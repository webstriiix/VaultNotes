#!/usr/bin/env bash
set -euo pipefail

# Set the ckBTC ledger canister ID inside the encrypted-notes backend for local development.
# Usage: ./scripts/set_local_ckbtc_ledger.sh

LEDGER_CANISTER_NAME=${LEDGER_CANISTER_NAME:-ckbtc_ledger}
BACKEND_CANISTER_NAME=${BACKEND_CANISTER_NAME:-encrypted-notes-backend}

LEDGER_ID=$(dfx canister id "${LEDGER_CANISTER_NAME}")

echo "Setting ledger canister ID to ${LEDGER_ID}"
dfx canister call "${BACKEND_CANISTER_NAME}" set_ledger_id "(principal \"${LEDGER_ID}\")"
echo "Done."
