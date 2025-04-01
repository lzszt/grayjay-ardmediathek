{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    inputs@{
      self,
      flake-utils,
      nixpkgs,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit inputs system; };
      in
      {
        packages = {
          sign = pkgs.writeShellScriptBin "sign" ''
            # Parameters
            JS_FILE_PATH=ardmediathek.js
            CONFIG_FILE_PATH=ardmediathek.json
            PRIVATE_KEY=$1

            # Validate private key
            if ! ${pkgs.openssl}/bin/openssl rsa -check -noout -in $PRIVATE_KEY > /dev/null 2>&1; then
              echo "Invalid private key."
              exit 1
            fi

            # Generate signature for the provided JS file
            SIGNATURE=$(cat $JS_FILE_PATH | ${pkgs.openssl}/bin/openssl dgst -sha512 -sign $PRIVATE_KEY | ${pkgs.coreutils}/bin/base64 -w 0)

            # Extract public key from the temporary private key file
            PUBLIC_KEY=$(${pkgs.openssl}/bin/openssl rsa -pubout -outform DER -in $PRIVATE_KEY 2>/dev/null | ${pkgs.openssl}/bin/openssl pkey -pubin -inform DER -outform PEM | tail -n +2 | head -n -1 | tr -d '\n')

            echo "PUBLIC_KEY: $PUBLIC_KEY"

            # Update "scriptSignature" and "scriptPublicKey" fields in Config JSON
            cat $CONFIG_FILE_PATH | ${pkgs.jq}/bin/jq --arg signature "$SIGNATURE" --arg publicKey "$PUBLIC_KEY" '. + {scriptSignature: $signature, scriptPublicKey: $publicKey}' > temp_config.json && mv temp_config.json $CONFIG_FILE_PATH
          '';
          serve = pkgs.writeShellScriptBin "serve" ''
            ${pkgs.nodejs}/bin/npx serve
          '';
        };
        devShells = {
          default = pkgs.mkShell {
            buildInputs = [
              pkgs.nodejs
              pkgs.openssl
            ];
          };
        };
      }
    );
}
