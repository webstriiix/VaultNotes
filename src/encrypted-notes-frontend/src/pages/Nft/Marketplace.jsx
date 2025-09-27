import { Actor } from "@dfinity/agent";
import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { IoPricetag } from "react-icons/io5";
import { toast } from "react-toastify";
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";

const Marketplace = () => {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [myPrincipal, setMyPrincipal] = useState(null);
    const [ledgerId, setLedgerId] = useState(null);
    const { identity } = useInternetIdentity();

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

    const fetchPrincipal = async () => {
                Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

        try {
            const principal = await encrypted_notes_backend.whoami();
            setMyPrincipal(principal);
        } catch (err) {
            console.error("❌ Failed to fetch principal:", err);
        }
    };

    const fetchLedgerId = async () => {
        try {
            const id = await encrypted_notes_backend.get_ledger_id();
            setLedgerId(id);
        } catch (err) {
            console.error("❌ Failed to fetch ledger id:", err);
            toast.error("Failed to fetch ledger ID");
        }
    };

    useEffect(() => {
        fetchPrincipal();
        fetchNFTs();
        fetchLedgerId();
    }, []);

    const handleBuy = async (nftId, price) => {

        try {
            toast.info(
                `Buying NFT #${nftId} for ${Number(price) / 100_000_000} ckBTC...`
            );

            console.log("my principal: " + myPrincipal)

            const res = await encrypted_notes_backend.buy_nft(nftId);
            toast.success(res);

            fetchNFTs(); // refresh marketplace
        } catch (err) {
            console.error("❌ Buy failed:", err);
            toast.error("Failed to buy NFT: " + (err.message || err));
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-2">NFT Marketplace</h1>

                {/* {ledgerId && (
                    <p className="text-sm text-gray-500 mb-6">
                        💡 Using Ledger: <span className="font-mono">{ledgerId}</span>
                    </p>
                )} */}

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
                                myPrincipal && myPrincipal === nft.owner.toText();

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
                                                {nft.price
                                                    ? `${Number(nft.price) / 100_000_000} BTC`
                                                    : "Not for sale"}
                                            </span>
                                        </div>
                                        <Chip size="sm" variant="flat" color="secondary">
                                            Owner: {nft.owner.toText().slice(0, 12)}...
                                        </Chip>
                                        {nft.price && !isOwner && (
                                            <Button
                                                color="primary"
                                                fullWidth
                                                className="mt-3"
                                                isDisabled
                                            >
                                                Coming Soon
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Marketplace;
