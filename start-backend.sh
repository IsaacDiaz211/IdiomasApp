#!/usr/bin/env bash

set -euo pipefail

prompt_env_var() {
  local var_name="$1"
  local prompt_message="$2"
  local silent="${3:-}"

  if [ -z "${!var_name:-}" ]; then
    if [ "$silent" = "silent" ]; then
      read -r -s -p "${prompt_message}: " value
      echo
    else
      read -r -p "${prompt_message}: " value
    fi
    export "$var_name"="$value"
  fi
}

if ! command -v bun >/dev/null 2>&1; then
  echo "Error: Bun no está instalado o no está disponible en el PATH." >&2
  exit 1
fi

prompt_env_var "AI_KEY" "Ingresa AI_KEY" "silent"
prompt_env_var "AI_BASE_URL" "Ingresa AI_BASE_URL"
prompt_env_var "AI_MODEL" "Ingresa AI_MODEL"

echo "Iniciando el servidor Backend..."
exec bun run src/index.ts
