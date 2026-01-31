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
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "discord-mcp-server";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [ pkgs.bun ];

          buildPhase = ''
            export HOME=$TMPDIR
            bun install --frozen-lockfile
            bun run build
          '';

          installPhase = ''
            mkdir -p $out/lib/discord-mcp
            cp -r dist node_modules package.json $out/lib/discord-mcp/

            mkdir -p $out/bin
            cat > $out/bin/discord-mcp <<EOF
            #!${pkgs.bash}/bin/bash
            exec ${pkgs.bun}/bin/bun run $out/lib/discord-mcp/dist/index.js "\$@"
            EOF
            chmod +x $out/bin/discord-mcp
          '';
        };

        apps.default = {
          type = "app";
          program = "${self.packages.${system}.default}/bin/discord-mcp";
        };
      }
    );
}
