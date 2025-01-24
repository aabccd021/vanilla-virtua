{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs = inputs@{ self, nixpkgs, treefmt-nix }:

    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      lib = pkgs.lib;

      treefmtEval = treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
        programs.nixpkgs-fmt.enable = true;
        programs.biome.enable = true;
        programs.shfmt.enable = true;
        settings.formatter.prettier.priority = 1;
        settings.formatter.biome.priority = 2;
      };

      serve = pkgs.writeShellApplication {
        name = "serve";
        text = ''
          root=$(git rev-parse --show-toplevel)
          ${pkgs.esbuild}/bin/esbuild "$root/vil.ts" \
            --bundle \
            --target=es6 \
            --format=esm \
            --outdir="$root/fixtures" \
            --servedir="$root/fixtures" \
            --watch
        '';
      };

      check = pkgs.writeShellApplication {
        name = "check";
        text = ''
          trap 'cd $(pwd)' EXIT
          repo_root=$(git rev-parse --show-toplevel)
          cd "$repo_root" || exit
          ${pkgs.nodejs}/bin/npm install
          ${pkgs.typescript}/bin/tsc
          ${pkgs.biome}/bin/biome check --fix --error-on-warnings
          ${pkgs.nodejs}/bin/npx playwright test
        '';
      };

      inputOutPaths = is:
        lib.lists.unique (lib.lists.flatten (lib.lists.map
          (input:
            if lib.attrsets.hasAttr "inputs" input then
              [ input.outPath (inputOutPaths input.inputs) ]
            else
              input.outPath
          )
          (lib.attrsets.attrValues is)
        ));


      packages = {
        check = check;
        formatting = treefmtEval.config.build.check self;
      };

      gcroot = packages // {
        gcroot-all = pkgs.linkFarm "gcroot-all" packages;
      };

    in

    {

      packages.x86_64-linux = packages;

      checks.x86_64-linux = gcroot;

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;

      devShells.x86_64-linux.default = pkgs.mkShellNoCC {
        FLAKE_INPUTS = lib.strings.concatStringsSep " " (inputOutPaths inputs);
        shellHook = ''
          export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers-chromium}
        '';
        buildInputs = [
          pkgs.nodejs
          pkgs.biome
          pkgs.typescript
          pkgs.esbuild
          serve
        ];
      };

      apps.x86_64-linux = {
        check = {
          type = "app";
          program = "${check}/bin/check";
        };
      };


    };
}
