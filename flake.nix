{
  description = "Discord MCP Server - Model Context Protocol server for Discord integration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        python = pkgs.python312;

        # Python packages available in nixpkgs
        pythonPackages = ps: with ps; [
          pydantic
          httpx
          pip
          setuptools
          wheel
          virtualenv
        ];

        pythonEnv = python.withPackages pythonPackages;
      in
      {
        # Development shell with venv support for MCP
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pythonEnv
          ];

          shellHook = ''
            echo "Discord MCP Server Development Environment"
            echo "============================================"
            echo "Python: $(python --version)"
            echo ""

            # Create venv if it doesn't exist
            if [ ! -d ".venv" ]; then
              echo "Creating virtual environment..."
              python -m venv .venv
              source .venv/bin/activate
              pip install --upgrade pip
              pip install mcp
              echo "MCP SDK installed in .venv"
            else
              source .venv/bin/activate
            fi

            echo ""
            echo "Virtual environment activated!"
            echo ""
            echo "To run the server:"
            echo "  python discord_mcp.py"
            echo ""
            echo "To test (will hang waiting for input):"
            echo "  timeout 2s python discord_mcp.py || echo 'Server started OK'"
          '';
        };

        # For running directly (assumes MCP is installed globally or in PATH)
        packages.default = pkgs.writeShellScriptBin "discord_mcp" ''
          cd ${./.}
          exec ${pythonEnv}/bin/python discord_mcp.py "$@"
        '';

        apps.default = {
          type = "app";
          program = "${self.packages.${system}.default}/bin/discord_mcp";
        };
      }
    );
}
