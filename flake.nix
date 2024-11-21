{
  inputs.pkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs =
    { pkgs, ... }:
    let
      nixpkgs = import pkgs { system = "x86_64-linux"; };
    in
    {
      devShells.x86_64-linux.default = nixpkgs.mkShell { 
        buildInputs = with nixpkgs; [
          nixpkgs.nodejs_22
          nixpkgs.corepack_22
        ];
      };
    };
}
