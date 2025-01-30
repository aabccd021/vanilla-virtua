{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }:

    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;

    in

    {

      devShells.x86_64-linux.default = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.nodejs
          pkgs.biome
          pkgs.esbuild
        ];
      };
    };
}
