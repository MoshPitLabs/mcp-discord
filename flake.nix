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

        # Build timestamp for version info
        buildDate = builtins.substring 0 10 (self.lastModifiedDate or "19700101");

        # Fetch dependencies in a fixed-output derivation (network access allowed)
        # Run `nix build 2>&1 | grep "got:"` to update the hash after dependency changes
        discord-mcp-deps = pkgs.stdenv.mkDerivation {
          pname = "discord-mcp-deps";
          version = "2.0.0";
          src = ./.;

          nativeBuildInputs = [ pkgs.bun ];

          buildPhase = ''
            export HOME=$TMPDIR
            bun install --frozen-lockfile
          '';

          installPhase = ''
            mkdir -p $out
            cp -r node_modules $out/node_modules
          '';

          outputHashAlgo = "sha256";
          outputHashMode = "recursive";
          outputHash = "sha256-3vDepJfk1ghGUHwxeJoY2514M3HCiNs0w1sJiR+/ZOk=";
        };

        # Discord MCP Server - Built from TypeScript source using Bun
        discord-mcp-server = pkgs.stdenv.mkDerivation {
          pname = "discord-mcp-server";
          version = "2.0.0";
          src = ./.;

          nativeBuildInputs = [ pkgs.bun ];

          buildPhase = ''
            export HOME=$TMPDIR

            # Link pre-fetched dependencies
            cp -r ${discord-mcp-deps}/node_modules ./node_modules
            chmod -R u+w node_modules

            # Build TypeScript
            bun run build
          '';

          installPhase = ''
            mkdir -p $out/lib/discord-mcp
            cp -r dist node_modules package.json $out/lib/discord-mcp/

            mkdir -p $out/bin
            cat > $out/bin/discord-mcp-server <<WRAPPER
            #!${pkgs.bash}/bin/bash
            exec ${pkgs.bun}/bin/bun run $out/lib/discord-mcp/dist/index.js "$@"
            WRAPPER
            chmod +x $out/bin/discord-mcp-server
          '';

          meta = with pkgs.lib; {
            description = "MCP Server for Discord integration via webhooks";
            homepage = "https://github.com/MoshPitLabs/mcp-discord";
            license = licenses.mit;
            maintainers = [ ];
            platforms = platforms.unix;
            mainProgram = "discord-mcp-server";
          };
        };

        # Wrapper script with version info
        discord-mcp-wrapper = pkgs.writeShellScriptBin "discord-mcp" ''
          set -euo pipefail

          # Version info
          if [ "''${1:-}" = "--version" ] || [ "''${1:-}" = "-v" ]; then
            echo "discord-mcp-server 2.0.0 (nix flake build)"
            echo "Source: ${self.shortRev or "dirty"}"
            echo "Built: ${buildDate}"
            exit 0
          fi

          exec ${discord-mcp-server}/bin/discord-mcp-server "$@"
        '';

        # MCP Configuration Generator
        generate-mcp-config = pkgs.writeShellScriptBin "generate-mcp-config" ''
          set -euo pipefail

          DISCORD_BIN="${discord-mcp-server}/bin/discord-mcp-server"

          usage() {
            echo "Usage: generate-mcp-config [client]"
            echo ""
            echo "Clients:"
            echo "  claude-code    - Generate for Claude Code CLI (~/.claude.json)"
            echo "  vscode         - Generate for VS Code (.vscode/mcp.json)"
            echo "  opencode       - Generate for OpenCode (~/.opencode/mcp.json)"
            echo "  generic        - Print generic MCP configuration to stdout"
            exit 1
          }

          case "''${1:-generic}" in
            claude-code|claude)
              echo "Generating Claude Code configuration..."
              echo "Add this to ~/.claude.json under 'mcpServers':"
              echo ""
              echo '"discord": {'
              echo '  "command": "'"$DISCORD_BIN"'",'
              echo '  "args": []'
              echo '}'
              ;;
            vscode)
              echo "Generating VS Code configuration..."
              echo "Save this to .vscode/mcp.json:"
              echo ""
              echo '{'
              echo '  "servers": {'
              echo '    "discord": {'
              echo '      "command": "'"$DISCORD_BIN"'",'
              echo '      "args": []'
              echo '    }'
              echo '  }'
              echo '}'
              ;;
            opencode)
              echo "Generating OpenCode configuration..."
              echo "Add this to ~/.opencode/mcp.json under 'mcpServers':"
              echo ""
              echo '"discord": {'
              echo '  "command": "'"$DISCORD_BIN"'",'
              echo '  "args": []'
              echo '}'
              ;;
            generic|*)
              echo '{'
              echo '  "mcpServers": {'
              echo '    "discord": {'
              echo '      "command": "'"$DISCORD_BIN"'",'
              echo '      "args": []'
              echo '    }'
              echo '  }'
              echo '}'
              ;;
          esac
        '';

      in
      {
        # ============================================================
        # PACKAGES
        # ============================================================

        packages = {
          # Discord MCP Server - the built server
          inherit discord-mcp-server;

          # Wrapped version with version info
          discord-mcp = discord-mcp-wrapper;

          # Configuration generator
          inherit generate-mcp-config;

          # Default is the wrapper
          default = discord-mcp-wrapper;
        };

        # ============================================================
        # APPS - Direct execution targets
        # ============================================================

        apps = {
          discord-mcp = {
            type = "app";
            program = "${discord-mcp-wrapper}/bin/discord-mcp";
          };

          generate-config = {
            type = "app";
            program = "${generate-mcp-config}/bin/generate-mcp-config";
          };

          default = self.apps.${system}.discord-mcp;
        };

        # ============================================================
        # DEVELOPMENT SHELLS
        # ============================================================

        devShells = {
          # Default: Full development environment
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              # Build toolchain
              bun
              nodejs_22
              typescript

              # Container tooling
              docker

              # Common tools
              git
              jq

              # The built server for testing
              discord-mcp-server
            ];

            shellHook = ''
              echo "Discord MCP Server - Development Environment"
              echo "============================================="
              echo ""
              echo "Binary: ${discord-mcp-server}/bin/discord-mcp-server"
              echo "Source: ${self.shortRev or "dirty"}"
              echo ""
              echo "Commands:"
              echo "  bun install        - Install dependencies"
              echo "  bun run dev        - Run in development mode"
              echo "  bun run build      - Build for production"
              echo "  bun run typecheck  - Type check without emitting"
              echo ""
              echo "Docker:"
              echo "  docker build -t discord-mcp-server ."
              echo "  docker run -i discord-mcp-server"
              echo ""
              echo "Configuration:"
              echo "  nix run .#generate-config -- claude-code"
              echo "  nix run .#generate-config -- vscode"
              echo ""

              # Auto-install dependencies if needed
              if [ ! -d "node_modules" ]; then
                echo "Installing dependencies..."
                bun install
              fi
            '';
          };

          # Minimal shell for testing only
          minimal = pkgs.mkShell {
            buildInputs = with pkgs; [
              discord-mcp-server
              jq
            ];

            shellHook = ''
              echo "Discord MCP Server (Minimal Shell)"
              echo "==================================="
              echo ""
              echo "Binary: ${discord-mcp-server}/bin/discord-mcp-server"
              echo ""
              echo "Usage:"
              echo "  discord-mcp-server"
              echo ""
            '';
          };
        };

        # ============================================================
        # CHECKS - Validation and testing
        # ============================================================

        checks = {
          # Verify the server builds and the binary exists
          discord-mcp-server-check = pkgs.runCommand "discord-mcp-check" { } ''
            test -x ${discord-mcp-server}/bin/discord-mcp-server
            echo "Discord MCP server builds successfully" > $out
          '';
        };
      }
    )
    // {
      # ============================================================
      # OVERLAYS - For use in other flakes (system-independent)
      # ============================================================

      overlays.default = final: prev: {
        discord-mcp-server = self.packages.${prev.system}.discord-mcp-server;
      };
    };
}
