#!/usr/bin/env bash
set -euo pipefail

# Deploy a local ICRC-1 ledger canister that behaves like ckBTC for development.
# Prerequisites:
#   - run ./download_latest_icrc1_ledger.sh (located in repo root)
#   - ledger artifacts (icrc1_ledger.did / icrc1_ledger.wasm.gz) present in repo root
#
# The script uses the currently selected dfx identity both as the minting account
# and as the archive controller, and mints 10 ckBTC (1_000_000_000 sats) to it.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LEDGER_CANISTER_NAME=${LEDGER_CANISTER_NAME:-ckbtc_ledger}
LEDGER_WASM=${LEDGER_WASM:-icrc1_ledger.wasm.gz}
LEDGER_DID=${LEDGER_DID:-icrc1_ledger.did}

if [[ ! -f "${LEDGER_WASM}" ]] || [[ ! -f "${LEDGER_DID}" ]]; then
    echo "Ledger artifacts not found."
    echo "Run ./download_latest_icrc1_ledger.sh from the repository root first."
    exit 1
fi

MINTER_PRINCIPAL=$(dfx identity get-principal)

echo "Using dfx identity principal: ${MINTER_PRINCIPAL}"
echo "Installing ICRC-1 ledger canister '${LEDGER_CANISTER_NAME}'"

# Ensure the canister exists before installation
dfx canister create "${LEDGER_CANISTER_NAME}" >/dev/null 2>&1 || true

INIT_ARG=$(cat <<CANDID
(variant { Init = record {
    minting_account = record {
        owner = principal "${MINTER_PRINCIPAL}";
        subaccount = null;
    };
    fee_collector_account = null;
    initial_balances = vec {
        record {
            record {
                owner = principal "${MINTER_PRINCIPAL}";
                subaccount = null;
            };
            1_000_000_000 : nat
        }
    };
    transfer_fee = 10_000 : nat;
    decimals = null;
    max_memo_length = opt record { value = 32 : nat16 };
    token_symbol = "ckBTC";
    token_name = "ckBTC Local";
    metadata = vec {};
    feature_flags = opt record { icrc2 = true };
    archive_options = record {
        num_blocks_to_archive = 1_000 : nat64;
        max_transactions_per_response = null;
        trigger_threshold = 2_000 : nat64;
        max_message_size_bytes = opt record { value = 1_048_576 : nat64 };
        cycles_for_archive_creation = opt record { value = 4_000_000_000_000 : nat64 };
        node_max_memory_size_bytes = opt record { value = 1_073_741_824 : nat64 };
        controller_id = principal "${MINTER_PRINCIPAL}";
        more_controller_ids = null;
    };
    index_principal = null;
}})
CANDID
)

dfx canister install "${LEDGER_CANISTER_NAME}" \
    --wasm "${LEDGER_WASM}" \
    --argument "${INIT_ARG}" \
    --mode reinstall \
    --yes

LEDGER_ID="$(dfx canister id "${LEDGER_CANISTER_NAME}")"

echo "Ledger deployed. Principal: ${LEDGER_ID}"
echo "Minted 10 ckBTC (1_000_000_000 sats) to ${MINTER_PRINCIPAL}"

echo "Configuring encrypted-notes-backend to use ${LEDGER_ID}"
bash "${SCRIPT_DIR}/set_local_ckbtc_ledger.sh"

echo "Local ledger is deployed and linked to the backend."
