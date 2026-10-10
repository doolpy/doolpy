#!/bin/bash
set -euo pipefail

# Only run in remote (cloud) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Add dependency install commands here as the project grows.
# Examples:
#   npm install
#   pip install -e ".[dev]"
#   cargo build

echo "Session start hook: no dependencies to install."
