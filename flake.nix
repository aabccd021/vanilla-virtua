{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs = { nixpkgs, treefmt-nix, ... }:

    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;

      treefmtEval = treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
      };

    in

    {

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;
      devShell.x86_64-linux = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.bun
          pkgs.nodejs
          pkgs.typescript
          pkgs.typescript-language-server
        ];
      };

    };
}
