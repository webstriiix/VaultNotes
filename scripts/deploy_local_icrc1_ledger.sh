#!/usr/bin/env bash
set -euo pipefail

# Deploy a local ICRC-1 ledger canister that behaves like ckBTC for development.
# Prerequisites:
#   - run ./download_latest_icrc1_ledger.sh (located in repo root)
#   - ledger artifacts (icrc1_ledger.did / icrc1_ledger.wasm.gz) present in repo root
#
# The script uses the currently selected dfx identity both as the minting account
# and as the archive controller, and mints 10 ckBTC (1_000_000_000 sats) to it.

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
dfx canister create "${LEDGER_CANISTER_NAME}" --no-wallet >/dev/null

INIT_ARG=$(cat <<CANDID
(variant { Init = record {
    minting_account = opt record { owner = principal "${MINTER_PRINCIPAL}" };
    initial_balances = vec {
        record {
            record { owner = principal "${MINTER_PRINCIPAL}" };
            1_000_000_000_000 : nat
        }
    };
    transfer_fee = 10_000 : nat;
    token_symbol = "ckBTC";
    token_name = "ckBTC Local";
    metadata = vec {};
    archive_options = record {
        trigger_threshold = 2000 : nat;
        num_blocks_to_archive = 1000 : nat;
        controller_id = principal "${MINTER_PRINCIPAL}";
        node_max_memory_size_bytes = opt 1_073_741_824 : nat;
        max_message_size_bytes = opt 1_048_576 : nat;
        cycles_for_archive_creation = opt 4_000_000_000_000 : nat;
    };
    feature_flags = opt record { icrc2 = true };
    max_memo_length = opt 32 : nat;
    accounts_overflow_trim_quantity = opt 0 : nat;
    maximum_number_of_accounts = opt 0 : nat;
}})
CANDID
)

dfx canister install "${LEDGER_CANISTER_NAME}" \
    --wasm "${LEDGER_WASM}" \
    --argument "${INIT_ARG}" \
    --mode reinstall \
    --no-wallet

echo "Ledger deployed. Principal: $(dfx canister id ${LEDGER_CANISTER_NAME})"
echo "Minted 10 ckBTC (1_000_000_000 sats) to ${MINTER_PRINCIPAL}"
