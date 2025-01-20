{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs = { self, nixpkgs, treefmt-nix }:

    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;

      treefmtEval = treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
        programs.nixpkgs-fmt.enable = true;
        programs.biome.enable = true;
        programs.shfmt.enable = true;
        settings.formatter.prettier.priority = 1;
        settings.formatter.biome.priority = 2;
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

    in

    {

      checks.x86_64-linux = {
        formatting = treefmtEval.config.build.check self;
      };

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;

      devShells.x86_64-linux.default = pkgs.mkShellNoCC {
        shellHook = ''
          export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers-chromium}
        '';
        buildInputs = [
          pkgs.nodejs
          pkgs.biome
          pkgs.typescript
          pkgs.http-server
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
