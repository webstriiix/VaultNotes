# Local ckBTC (ICRC-1) Setup

The backend expects a ckBTC ledger canister that implements the ICRC‑1 / ICRC‑2
interfaces. When you are developing locally you can use the reference ICRC‑1
ledger, because it exposes the same API surface as the mainnet ckBTC ledger.

The repository contains helper scripts that download the latest ledger build,
deploy it as `ckbtc_ledger`, seed a small balance for the currently selected
`dfx` identity, and configure the backend canister.

## 1. Download the ledger artifacts

Run this once (re-run whenever you want to pick up a newer release):

```bash
./download_latest_icrc1_ledger.sh
```

It stores `icrc1_ledger.did` and `icrc1_ledger.wasm.gz` in the repository root.
The files are git-ignored.

## 2. Deploy the local ledger and link it to the backend

```bash
./scripts/deploy_local_icrc1_ledger.sh
```

The script:

1. Creates (or reinstalls) a canister named `ckbtc_ledger`
2. Uses the current `dfx identity` as both the minting account and the archive
   controller
3. Mints 10 ckBTC (1_000_000_000 sats) to that same identity
4. Calls the backend’s `set_ledger_id` so future ckBTC calls use this canister

If you switch identities, simply run the script again to rebuild the ledger with
fresh state.

## 3. Manually re-link the backend (optional)

```bash
./scripts/set_local_ckbtc_ledger.sh
```

The deployment script already runs this command. Only re-run it if you reinstall
the backend canister manually or want to switch to a different ledger principal.

## 4. Optional ledger operations

Inspect your balance:

```bash
dfx canister call ckbtc_ledger icrc1_balance_of '(record { owner = principal "'$(dfx identity get-principal)'" })'
```

Transfer additional ckBTC between accounts:

```bash
dfx canister call ckbtc_ledger icrc1_transfer '(
  record {
    to = record { owner = principal "<recipient>"; };
    amount = 100_000_000 : nat; // 1 ckBTC
    memo = null;
    fee = null;
    created_at_time = null;
  }
)'
```

The backend’s NFT marketplace (`buy_nft`) uses `icrc2_transfer_from`. The local
ledger that the script deploys enables the ICRC‑2 feature flag, so no further
changes are necessary.

### Granting spending allowance from the UI

The ledger only respects approvals signed by the Internet Identity that owns
the ckBTC. Before purchasing an NFT, open the Marketplace page and click
**“Approve ckBTC Spending”** – the app calls `icrc2_approve` on your behalf
and shows the active allowance. Once the allowance covers the listing price
you can press **Buy Now**, and the allowance will decrease automatically.

## Clean-up

To remove the local ledger state entirely, delete the canister:

```bash
dfx canister stop ckbtc_ledger
dfx canister delete ckbtc_ledger
```

You can always redeploy by repeating the steps above.
