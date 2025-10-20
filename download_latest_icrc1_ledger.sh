#!/usr/bin/env bash
set -uo pipefail

# Download latest or a specific release of the ICRC-1 ledger artifacts (DID + WASM)
# Usage:
#   ./download_latest_icrc1_ledger.sh             # fetch latest release
#   RELEASE_TAG=ledger-suite-icrc__2024-01-24_23-02_commit-c1a7bd ./download_latest_icrc1_ledger.sh

RELEASE_TAG_PREFIX=ledger-suite-icrc

download_release() {
    local release=$1
    local wasm_url="https://github.com/dfinity/ic/releases/download/${release}/ic-icrc1-ledger.wasm.gz"
    local did_url="https://github.com/dfinity/ic/releases/download/${release}/ledger.did"

    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -L --head "${wasm_url}")
    if ((status_code >= 200 && status_code < 300)); then
        echo "Downloading ICRC-1 ledger artifacts for ${release}"
        curl -sLf "${did_url}" -o icrc1_ledger.did || {
            echo >&2 "Failed to download icrc1_ledger.did from ${did_url}"
            exit 2
        }
        curl -sLf "${wasm_url}" -o icrc1_ledger.wasm.gz || {
            echo >&2 "Failed to download icrc1_ledger.wasm.gz from ${wasm_url}"
            exit 3
        }
        exit 0
    fi
}

if [[ -n "${RELEASE_TAG:-}" ]]; then
    download_release "${RELEASE_TAG}"
    echo >&2 "Could not download release ${RELEASE_TAG}"
    exit 1
fi

page=1
items_per_page=100
max_pages=10

while ((page <= max_pages)); do
    releases_json=$(curl -sLf \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/dfinity/ic/releases?per_page=${items_per_page}&page=${page}") || {
        echo >&2 "Unable to fetch releases from dfinity/ic"
        exit 1
    }

    for ((item = 0; item < items_per_page; item++)); do
        release_tag=$(echo "${releases_json}" | jq -r ".[$item].tag_name")
        [[ "${release_tag}" == "null" ]] && continue

        if [[ "${release_tag}" == ${RELEASE_TAG_PREFIX}* ]]; then
            download_release "${release_tag}"
        fi
    done

    ((page++))
done

echo >&2 "No release with prefix ${RELEASE_TAG_PREFIX} found in the latest ${max_pages} pages"
exit 1
