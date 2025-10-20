import { Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import {
  IoPricetag
} from "react-icons/io5";
import { toast } from "react-toastify";
import { ckbtc_ledger, createActor as createCkbtcActor } from "../../../../declarations/ckbtc_ledger";
import {
  canisterId as backendCanisterId,
  encrypted_notes_backend,
} from "../../../../declarations/encrypted-notes-backend";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";

const ADMIN_FEE_PERCENT = 3;
const DEFAULT_ALLOWANCE_SATS = 200_000_000n; // 2 ckBTC default approval buffer
const SATS_PER_CKBTC = 100_000_000n;

const Marketplace = () => {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [myPrincipal, setMyPrincipal] = useState(null);
    const [allowance, setAllowance] = useState(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [pendingPurchase, setPendingPurchase] = useState(null);
    const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);

    const normalizeNat = (value) => {
        if (value === null || value === undefined) return 0n;
        if (typeof value === "bigint") return value;
        if (typeof value === "number") return BigInt(Math.trunc(value));
        if (typeof value === "string") return BigInt(value);
        if (Array.isArray(value)) return value.length ? normalizeNat(value[0]) : 0n;
        if (value && typeof value === "object" && "toString" in value) {
            return BigInt(value.toString());
        }
        return 0n;
    };

    const formatCkbtc = (value) =>
        Number(normalizeNat(value)) / Number(SATS_PER_CKBTC);
    const stringifyIcrc = (value) =>
        JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));
    const { identity } = useInternetIdentity();
    const isAuthenticated =
        identity && !identity.getPrincipal().isAnonymous();

    const fetchNFTs = async () => {
        try {
            setLoading(true);
            const allNFTs = await encrypted_notes_backend.list_nfts_for_sale();
            setNfts(allNFTs);
        } catch (err) {
            console.error("❌ Failed to fetch NFTs:", err);
            toast.error("Failed to fetch NFTs");
        } finally {
            setLoading(false);
        }
    };

    const getLedgerActor = async () => {
        if (!identity) return undefined;

        const ledgerCanisterId = process.env.CANISTER_ID_CKBTC_LEDGER;
        if (!ledgerCanisterId) {
            console.warn("ckBTC ledger canister ID not configured.");
            return undefined;
        }

        const actor =
            ckbtc_ledger ??
            createCkbtcActor(ledgerCanisterId, {
                agentOptions: {},
            });

        Actor.agentOf(actor).replaceIdentity(identity);
        return actor;
    };

    const fetchPrincipal = async () => {
        if (!identity || identity.getPrincipal().isAnonymous()) {
            setMyPrincipal(null);
            setAllowance(null);
            return;
        }

    Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

        try {
            const principal = await encrypted_notes_backend.whoami();
            setMyPrincipal(principal);
            await fetchAllowance(principal);
        } catch (err) {
            console.error("❌ Failed to fetch principal:", err);
            setMyPrincipal(null);
            setAllowance(null);
        }
    };

    const fetchAllowance = async (principal) => {
        if (!identity || !principal) return;

        try {
            if (!backendCanisterId) {
                console.warn("Encrypted-notes-backend canister ID not configured.");
                return;
            }

            const ledgerActor = await getLedgerActor();
            if (!ledgerActor) return;

            const ownerPrincipal =
                typeof principal === "string" ? Principal.fromText(principal) : principal;
            const backendPrincipal = Principal.fromText(backendCanisterId);

            const account = { owner: ownerPrincipal, subaccount: [] };
            const spender = {
                owner: backendPrincipal,
                subaccount: [],
            };
            const result = await ledgerActor.icrc2_allowance({
                account,
                spender,
            });

            const allowanceValue = normalizeNat(result?.allowance);
            setAllowance(allowanceValue);
        } catch (err) {
            console.error("❌ Failed to fetch allowance:", err);
            setAllowance(null);
        }
    };

    useEffect(() => {
        fetchPrincipal();
        fetchNFTs();
    }, [identity]);

    const handleApprove = async (minimumRequiredSats) => {
        if (!identity || identity.getPrincipal().isAnonymous()) {
            toast.error("Please sign in with Internet Identity first.");
            return false;
        }
        if (!backendCanisterId) {
            toast.error("Backend canister ID is missing.");
            return false;
        }

        const approvalAmount =
            normalizeNat(minimumRequiredSats) > DEFAULT_ALLOWANCE_SATS
                ? normalizeNat(minimumRequiredSats)
                : DEFAULT_ALLOWANCE_SATS;

        const ledgerActor = await getLedgerActor();
        if (!ledgerActor) {
            toast.error("The ckBTC ledger is unavailable.");
            return false;
        }

        setIsApproving(true);

        try {
            const approveResult = await ledgerActor.icrc2_approve({
                from_subaccount: [],
                spender: {
                    owner: Principal.fromText(backendCanisterId),
                    subaccount: [],
                },
                amount: approvalAmount,
                fee: [],
                memo: [],
                created_at_time: [],
                expected_allowance: [],
                expires_at: [],
            });

            if ("Ok" in approveResult) {
                toast.success(`ckBTC allowance ready (${formatCkbtc(approvalAmount)} ckBTC).`);
                await fetchAllowance(identity.getPrincipal());
                return true;
            }

            toast.error(`Failed to prepare allowance: ${stringifyIcrc(approveResult.Err)}`);
            return false;
        } catch (err) {
            console.error("❌ Approve failed:", err);
            toast.error("Failed to set up ckBTC allowance. See console for details.");
            return false;
        } finally {
            setIsApproving(false);
        }
    };

    const handleBuy = async (nftId, price) => {
        try {
            if (!identity || identity.getPrincipal().isAnonymous()) {
                toast.error("You must log in with Internet Identity to purchase.");
                return;
            }

            const priceSats = normalizeNat(price);
            if (priceSats === 0n) {
                toast.error("NFT price is invalid or not listed for sale.");
                return;
            }

      Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

            let currentAllowance = allowance !== null ? normalizeNat(allowance) : 0n;

            if (currentAllowance < priceSats) {
                toast.info("Preparing ckBTC allowance for this purchase...");
                const approved = await handleApprove(priceSats);
                if (!approved) {
                    return;
                }
                currentAllowance = priceSats;
            }

            const priceBtc = Number(priceSats) / Number(SATS_PER_CKBTC);
            const adminFeeSats = (priceSats * BigInt(ADMIN_FEE_PERCENT)) / 100n;
            const adminFeeBtc = Number(adminFeeSats) / Number(SATS_PER_CKBTC);

      toast.info(
        `Buying NFT #${nftId} for ${priceBtc} ckBTC (includes ${adminFeeBtc} ckBTC admin fee)...`
      );

            setIsBuying(true);
            const res = await encrypted_notes_backend.buy_nft(nftId);

            if (res?.Ok) {
                toast.success(res.Ok);
            } else if (res?.Err) {
                throw new Error(res.Err);
            } else {
                toast.success("NFT purchased successfully");
            }

            fetchNFTs(); // refresh marketplace
            await fetchAllowance(identity.getPrincipal());
        } catch (err) {
            console.error("❌ Buy failed:", err);
            toast.error("Failed to buy NFT. See console for details.");
        } finally {
            setIsBuying(false);
            setIsConfirmingPurchase(false);
            setPendingPurchase(null);
        }
    };

    const startPurchase = (nft, priceSats, adminFeeSats, sellerReceivesSats) => {
        if (!identity || identity.getPrincipal().isAnonymous()) {
            toast.error("Please sign in with Internet Identity to purchase.");
            return;
        }

        if (priceSats === 0n) {
            toast.error("NFT price is invalid or not listed for sale.");
            return;
        }

        setPendingPurchase({
            nftId: nft.id,
            title: nft.title,
            priceSats,
            adminFeeSats,
            sellerReceivesSats,
            sellerPrincipal: nft.owner.toText(),
        });
    };

    const closePurchaseModal = () => {
        if (isBuying || isApproving || isConfirmingPurchase) {
            return;
        }
        setPendingPurchase(null);
    };

    const confirmPurchase = async () => {
        if (!pendingPurchase) return;
        setIsConfirmingPurchase(true);
        await handleBuy(pendingPurchase.nftId, pendingPurchase.priceSats);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">NFT Marketplace</h1>
                    <Tooltip
                        placement="right"
                        content={
                            <div className="max-w-xs text-left text-xs leading-relaxed space-y-2 bg-[#1C1F26] border border-[#3C444D] rounded-md p-3 shadow-lg">
                                <p className="font-semibold text-white">
                                    How to fund this Internet Identity
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-gray-200">
                                    <li>
                                        Sign in to the NNS dapp (or ckBTC app) with this exact
                                        Internet Identity.
                                    </li>
                                    <li>
                                        Deposit BTC to mint ckBTC, or transfer ckBTC from another
                                        wallet to the ledger account shown there.
                                    </li>
                                    <li>
                                        Return to the marketplace and press <strong>Buy</strong>; the system
                                        will automatically prepare the ckBTC allowance before completing
                                        the purchase.
                                    </li>
                                </ol>
                            </div>
                        }
                    >
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="border border-[#3C444D] text-gray-200 rounded-full w-5 h-5"
                            aria-label="How to transfer ckBTC to this Internet Identity"
                        >
                            ?
                        </Button>
                    </Tooltip>
                </div>
                <p className="text-sm text-default-500 mb-6">
                    ckBTC purchases pull funds from the ckBTC balance linked to the Internet
                    Identity you are signed in with.
                </p>

                {loading ? (
                    <p className="text-center text-gray-400">Loading NFTs...</p>
                ) : nfts.length === 0 ? (
                    <p className="text-center text-gray-400">
                        No NFTs available yet. Be the first to mint!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nfts.map((nft) => {
                            const isOwner =
                                myPrincipal && myPrincipal.toText() === nft.owner.toText();

                            const priceSats = normalizeNat(nft.price);
                            const adminFeeSats = (priceSats * BigInt(ADMIN_FEE_PERCENT)) / 100n;
                            const sellerReceivesSats =
                                priceSats > adminFeeSats ? priceSats - adminFeeSats : 0n;

                            return (
                                <Card
                                    key={Number(nft.id)}
                                    className="border border-[#3C444D] rounded-2xl shadow-lg hover:shadow-xl transition"
                                >
                                    <CardHeader className="p-4">
                                        <h2 className="text-xl font-semibold">{nft.title}</h2>
                                    </CardHeader>
                                    <CardBody className="p-4 space-y-3">
                                        <p className="text-sm text-gray-400 line-clamp-3">
                                            {nft.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <IoPricetag className="text-primary" />
                                            <span className="font-medium">
                                                {priceSats > 0n
                                                    ? `${formatCkbtc(priceSats)} ckBTC`
                                                    : "Not for sale"}
                                            </span>
                                        </div>
                                        <Chip size="sm" variant="flat" color="secondary">
                                            Owner: {nft.owner.toText().slice(0, 12)}...
                                        </Chip>
                                        {priceSats > 0n && !isOwner && (
                                            <Button
                                                color="primary"
                                                fullWidth
                                                className="mt-3"
                                                isDisabled={
                                                    !isAuthenticated || isBuying || isApproving || isConfirmingPurchase
                                                }
                                                isLoading={isBuying || isApproving || isConfirmingPurchase}
                                                onPress={() =>
                                                    startPurchase(
                                                        nft,
                                                        priceSats,
                                                        adminFeeSats,
                                                        sellerReceivesSats
                                                    )
                                                }
                                            >
                                                Buy Now
                                            </Button>
                                        )}
                                        {isOwner && nft.price && (
                                            <Chip size="sm" variant="flat" color="success">
                                                You own this listing
                                            </Chip>
                                        )}
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
            <Modal
                isOpen={!!pendingPurchase}
                onOpenChange={(open) => {
                    if (!open) closePurchaseModal();
                }}
                isDismissable={!(isBuying || isApproving || isConfirmingPurchase)}
            >
                <ModalContent className="bg-[#12151C] border border-[#3C444D] text-white">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-white">
                                Confirm Purchase
                            </ModalHeader>
                            <ModalBody className="text-sm text-gray-200 space-y-2">
                                <p className="font-medium text-lg text-white">
                                    {pendingPurchase?.title || "Selected NFT"}
                                </p>
                                <div className="flex justify-between">
                                    <span>Admin fee ({ADMIN_FEE_PERCENT}%)</span>
                                    <span>
                                        {pendingPurchase ? `${formatCkbtc(pendingPurchase.adminFeeSats)} ckBTC` : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Seller receives</span>
                                    <span>
                                        {pendingPurchase
                                            ? `${formatCkbtc(pendingPurchase.sellerReceivesSats)} ckBTC`
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-white font-semibold pt-2 border-t border-[#3C444D]">
                                    <span>Total charged</span>
                                    <span>
                                        {pendingPurchase ? `${formatCkbtc(pendingPurchase.priceSats)} ckBTC` : "-"}
                                    </span>
                                </div>
                                <div className="text-xs text-default-500 pt-2">
                                    Seller Principal:{" "}
                                    {pendingPurchase?.sellerPrincipal
                                        ? `${pendingPurchase.sellerPrincipal.slice(0, 12)}...`
                                        : "-"}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="light"
                                    onPress={onClose}
                                    isDisabled={isBuying || isApproving || isConfirmingPurchase}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={confirmPurchase}
                                    isLoading={isBuying || isApproving || isConfirmingPurchase}
                                    isDisabled={isBuying || isApproving || isConfirmingPurchase}
                                >
                                    Confirm & Pay
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default Marketplace;
