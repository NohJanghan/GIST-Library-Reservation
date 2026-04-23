#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_env "VITE_API_BASE_URL"
require_env "DEPLOY_HOST"
require_env "DEPLOY_USER"
require_env "DEPLOY_TARGET_DIR"
require_env "DEPLOY_TMP_DIR"

SSH_PORT="${DEPLOY_PORT:-22}"
SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
LOCAL_DIST_DIR="$ROOT_DIR/dist"
LOCAL_ARCHIVE="$ROOT_DIR/dist.tar.gz"
REMOTE_ARCHIVE="${DEPLOY_TMP_DIR%/}/dist.tar.gz"

echo "Building frontend for ${VITE_API_BASE_URL}"
cd "$ROOT_DIR"
rm -rf "$LOCAL_DIST_DIR" "$LOCAL_ARCHIVE"
npm run build

echo "Preparing remote directory ${DEPLOY_TMP_DIR}"
ssh -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p '$DEPLOY_TMP_DIR'"

echo "Packing build output"
tar -C "$ROOT_DIR" -czf "$LOCAL_ARCHIVE" dist

echo "Uploading archive to ${DEPLOY_HOST}"
scp -P "$SSH_PORT" "$LOCAL_ARCHIVE" "$SSH_TARGET:$REMOTE_ARCHIVE"

echo "Deploying to ${DEPLOY_TARGET_DIR}"
ssh -p "$SSH_PORT" "$SSH_TARGET" "
  set -euo pipefail
  mkdir -p '$DEPLOY_TMP_DIR'
  rm -rf '${DEPLOY_TMP_DIR%/}/dist'
  tar -C '$DEPLOY_TMP_DIR' -xzf '$REMOTE_ARCHIVE'
  sudo mkdir -p '$DEPLOY_TARGET_DIR'
  sudo rm -rf '${DEPLOY_TARGET_DIR%/}'/*
  sudo cp -R '${DEPLOY_TMP_DIR%/}/dist/'* '$DEPLOY_TARGET_DIR/'
"

rm -f "$LOCAL_ARCHIVE"

echo "Deployment completed."
