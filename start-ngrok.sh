#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed."
  echo "Install it from https://ngrok.com/download, then run:"
  echo "  ngrok config add-authtoken YOUR_NGROK_TOKEN"
  echo "  ./start-ngrok.sh"
  exit 1
fi

echo "Opening public ngrok tunnel for http://127.0.0.1:${PORT}"
ngrok http "http://127.0.0.1:${PORT}"
