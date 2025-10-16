#!/usr/bin/env bash
set -uo pipefail

# Download the universal ledger canister that exposes the ICP/ICRC compatible interface.
# The script scans recent commits of dfinity/ic until it finds artifacts for the ledger.

COMMITS=$(curl -sLf \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/dfinity/ic/commits?per_page=100" | jq -r '.[].sha') || {
    echo >&2 "Unable to fetch commits from dfinity/ic"
    exit 1
}

for commit in ${COMMITS}; do
    wasm_url="https://download.dfinity.systems/ic/${commit}/canisters/ledger-canister_notify-method.wasm.gz"
    did_url="https://raw.githubusercontent.com/dfinity/ic/${commit}/rs/ledger_suite/icrc1/ledger/ledger.did"

    status_code=$(curl -s -o /dev/null -w "%{http_code}" -L --head "${wasm_url}")
    if ((status_code >= 200 && status_code < 300)); then
        echo "Downloading ledger artifacts from commit ${commit}"
        curl -sLf "${did_url}" -o icp_ledger.did || {
            echo >&2 "Failed to download icp_ledger.did"
            exit 2
        }
        curl -sLf "${wasm_url}" -o icp_ledger.wasm.gz || {
            echo >&2 "Failed to download icp_ledger.wasm.gz"
            exit 3
        }
        exit 0
    fi
done

echo >&2 "Could not find downloadable ledger artifacts in the scanned commits."
exit 4
