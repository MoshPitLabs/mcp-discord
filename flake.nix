{
  description = "Discord MCP Server - TypeScript Edition";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_23
            typescript
          ];

          shellHook = ''
            echo "Discord MCP Server - TypeScript Development Environment"
            echo "========================================================"
            echo "Bun version: $(bun --version)"
            echo "Node version: $(node --version)"
            echo ""
            echo "Commands:"
            echo "  bun install    - Install dependencies"
            echo "  bun run dev    - Run in development mode"
            echo "  bun run build  - Build for production"
            echo "  bun run typecheck - Type check without emitting"
            echo ""

            # Auto-install dependencies if needed
            if [ ! -d "node_modules" ]; then
              echo "Installing dependencies..."
              bun install
            fi
          '';
        };

        # Package for running the server
        packages.default = pkgs.writeShellScriptBin "discord-mcp" ''
          # Ensure we're in the right directory
          if [ ! -f "package.json" ]; then
            echo "Error: Must run from mcp-discord directory" >&2
            exit 1
          fi

          # Install dependencies if needed
          if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..." >&2
            ${pkgs.bun}/bin/bun install
          fi

          # Build if dist doesn't exist or is outdated
          if [ ! -f "dist/index.js" ] || [ "src/index.ts" -nt "dist/index.js" ]; then
            echo "Building server..." >&2
            ${pkgs.bun}/bin/bun run build
          fi

          # Run the built server
          exec ${pkgs.bun}/bin/bun run dist/index.js "$@"
        '';

        apps.default = {
          type = "app";
          program = "${self.packages.${system}.default}/bin/discord-mcp";
        };
      }
    );
}
