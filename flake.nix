{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    project-utils = {
      url = "github:aabccd021/project-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, treefmt-nix, project-utils }:

    let

      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      utilLib = project-utils.lib;

      nodeModules = utilLib.buildNodeModules.fromLockJson ./package.json ./package-lock.json;

      treefmtEval = treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
        programs.nixpkgs-fmt.enable = true;
        programs.biome.enable = true;
        programs.shfmt.enable = true;
        settings.formatter.prettier.priority = 1;
        settings.formatter.biome.priority = 2;
        settings.global.excludes = [ "LICENSE" "*.ico" ];
      };

      tests = pkgs.runCommandNoCCLocal "tests"
        {
          buildInputs = [ pkgs.nodejs ];
        } ''
        export XDG_CONFIG_HOME="$(pwd)"
        export XDG_CACHE_HOME="$(pwd)"
        export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
        export PATH=./node_modules/esbuild/bin:"$PATH"
        cp -L ${./package.json} ./package.json
        cp -L ${./playwright.config.ts} ./playwright.config.ts
        cp -L ${./tsconfig.json} ./tsconfig.json
        cp -Lr ${nodeModules} ./node_modules
        cp -Lr ${./src} ./src
        cp -Lr ${./e2e} ./e2e
        cp -Lr ${./stories} ./stories
        chmod -R 700 ./stories
        node_modules/playwright/cli.js test
        touch $out
      '';

      biome = pkgs.runCommandNoCCLocal "biome" { } ''
        cp -L ${./biome.jsonc} ./biome.jsonc
        cp -L ${./package.json} ./package.json
        cp -L ${./playwright.config.ts} ./playwright.config.ts
        cp -L ${./tsconfig.json} ./tsconfig.json
        cp -Lr ${nodeModules} ./node_modules
        cp -Lr ${./src} ./src
        cp -Lr ${./e2e} ./e2e
        cp -Lr ${./stories} ./stories
        ${pkgs.biome}/bin/biome check --error-on-warnings
        touch $out
      '';


      # dist = pkgs.runCommandNoCCLocal "dist" { } ''
      #   mkdir  $out
      #   ${pkgs.esbuild}/bin/esbuild ${./freeze-page.ts} \
      #     --bundle \
      #     --format=esm \
      #     --minify \
      #     --sourcemap \
      #     --outfile="$out/freeze-page.min.js"
      #   ${pkgs.esbuild}/bin/esbuild ${./freeze-page.ts} \
      #     --bundle \
      #     --format=esm \
      #     --target=es6 \
      #     --minify \
      #     --sourcemap \
      #     --outfile="$out/freeze-page.es6.min.js"
      # '';

      publish = pkgs.writeShellApplication {
        name = "publish";
        text = ''
          nix flake check
          NPM_TOKEN=''${NPM_TOKEN:-}
          if [ -n "$NPM_TOKEN" ]; then
            npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"
          fi
          result=$(nix build --no-link --print-out-paths .#dist)
          rm -rf dist
          mkdir dist
          cp -Lr "$result"/* dist
          chmod 400 dist/*
          npm publish --dry-run
          npm publish || true
        '';
      };

      packages = {
        publish = publish;
        tests = tests;
        biome = biome;
        # dist = dist;
        formatting = treefmtEval.config.build.check self;
      };

      gcroot = packages // {
        gcroot-all = pkgs.linkFarm "gcroot-all" packages;
      };

    in

    {

      packages.x86_64-linux = gcroot;
      checks.x86_64-linux = gcroot;
      formatter.x86_64-linux = treefmtEval.config.build.wrapper;

      devShells.x86_64-linux.default = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.nodejs
          pkgs.biome
        ];
      };
    };
}
