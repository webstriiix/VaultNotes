import { Actor } from "@dfinity/agent";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Tooltip,
} from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import {
  IoCart,
  IoPerson,
  IoPricetag,
  IoShield,
  IoWallet,
} from "react-icons/io5";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";

const ADMIN_FEE_PERCENT = 3;

const Marketplace = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myPrincipal, setMyPrincipal] = useState(null);
  const [ledgerId, setLedgerId] = useState(null);
  const { identity } = useInternetIdentity();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

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
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setMyPrincipal(null);
      return;
    }

    Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

    try {
      const principal = await encrypted_notes_backend.whoami();
      setMyPrincipal(principal);
    } catch (err) {
      console.error("❌ Failed to fetch principal:", err);
      setMyPrincipal(null);
    }
  };

  const fetchLedgerId = async () => {
    try {
      const id = await encrypted_notes_backend.get_ledger_id();
      setLedgerId(id);
    } catch (err) {
      console.error("❌ Failed to fetch ledger ID:", err);
    }
  };

  useEffect(() => {
    fetchPrincipal();
    fetchNFTs();
    fetchLedgerId();
  }, [identity]);

  const handleBuy = async (nftId, price) => {
    try {
      if (!identity || identity.getPrincipal().isAnonymous()) {
        toast.error("You must log in with Internet Identity to purchase.");
        return;
      }

      Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

      const priceBtc = Number(price) / 100_000_000;
      const adminFeeSats = Math.floor(
        (Number(price) * ADMIN_FEE_PERCENT) / 100
      );
      const adminFeeBtc = adminFeeSats / 100_000_000;

      toast.info(
        `Buying NFT #${nftId} for ${priceBtc} ckBTC (includes ${adminFeeBtc} ckBTC admin fee)...`
      );

      const res = await encrypted_notes_backend.buy_nft(nftId);
      toast.success(
        typeof res === "string" ? res : "NFT purchased successfully"
      );

      fetchNFTs();
    } catch (err) {
      toast.error("Failed to buy NFT");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <ClipLoader size={50} color="#FFFFFF" />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              NFT Marketplace
            </h1>
            <p className="text-default-500 text-lg">
              Discover and collect unique digital assets
            </p>
          </div>
          {ledgerId && (
            <Chip
              variant="flat"
              color="primary"
              size="lg"
              className="font-medium px-4 py-2"
              startContent={<IoWallet className="h-4 w-4" />}
            >
              Ledger Connected
            </Chip>
          )}
        </div>

        {/* NFTs Grid */}
        {nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {nfts.map((nft) => {
              const isOwner = myPrincipal && myPrincipal === nft.owner.toText();
              const priceSats = nft.price ? Number(nft.price) : 0;
              const adminFeeSats = Math.floor(
                (priceSats * ADMIN_FEE_PERCENT) / 100
              );
              const sellerReceivesSats = priceSats - adminFeeSats;
              const satsToBtc = (value) => value / 100_000_000;

              return (
                <Card
                  key={Number(nft.id)}
                  className="border border-[#3C444D] rounded-2xl hover:scale-[1.02] transition-all duration-200"
                >
                  <CardHeader className="pb-3 pt-6 px-6">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-3">
                        <IoShield className="h-6 w-6 text-primary" />
                        <Chip
                          color="primary"
                          variant="flat"
                          size="md"
                          className="font-semibold px-3 py-1"
                        >
                          NFT #{Number(nft.id)}
                        </Chip>
                      </div>
                      {isOwner && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="success"
                          className="font-medium"
                        >
                          Your Listing
                        </Chip>
                      )}
                    </div>
                  </CardHeader>

                  <CardBody className="pt-0 px-6 pb-4">
                    <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-2 leading-tight">
                      {nft.title}
                    </h3>
                    <p className="text-default-600 text-sm leading-relaxed line-clamp-3 mb-5">
                      {nft.description}
                    </p>

                    {/* Price Section */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-default-100 rounded-xl border border-[#3C444D]">
                        <IoPricetag className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs text-default-500 mb-1">Price</p>
                          <p className="text-lg font-bold text-foreground">
                            {nft.price
                              ? `${satsToBtc(priceSats)} ckBTC`
                              : "Not for sale"}
                          </p>
                        </div>
                      </div>

                      {nft.price && (
                        <div className="p-3 bg-default-50 rounded-xl space-y-2 border border-[#3C444D]">
                          <div className="flex justify-between text-xs">
                            <span className="text-default-500">
                              Admin Fee ({ADMIN_FEE_PERCENT}%)
                            </span>
                            <span className="font-medium text-default-700">
                              {satsToBtc(adminFeeSats)} ckBTC
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-default-500">
                              Seller Receives
                            </span>
                            <span className="font-medium text-success">
                              {satsToBtc(Math.max(sellerReceivesSats, 0))} ckBTC
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center gap-2 p-3 bg-default-50 rounded-xl border border-[#3C444D]">
                      <IoPerson className="h-4 w-4 text-default-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-default-500 mb-1">Owner</p>
                        <p className="text-xs font-mono text-default-700 truncate">
                          {nft.owner.toText()}
                        </p>
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter className="pt-2 px-6 pb-6">
                    {nft.price && !isOwner && (
                      <Tooltip
                        content={
                          isAuthenticated
                            ? `Total: ${satsToBtc(
                                priceSats
                              )} ckBTC (includes ${satsToBtc(
                                adminFeeSats
                              )} ckBTC fee)`
                            : "Log in with Internet Identity to purchase"
                        }
                        placement="top"
                        classNames={{
                          content:
                            "bg-content1 border border-white/20 backdrop-blur-md shadow-xl px-4 py-2 rounded-xl",
                        }}
                      >
                        <Button
                          color="primary"
                          size="lg"
                          fullWidth
                          isDisabled={!isAuthenticated}
                          onPress={() => handleBuy(nft.id, nft.price)}
                          startContent={<IoCart className="h-5 w-5" />}
                          className="font-semibold shadow-lg border border-[#3C444D] rounded-xl"
                        >
                          {isAuthenticated ? "Buy Now" : "Login to Buy"}
                        </Button>
                      </Tooltip>
                    )}
                    {!nft.price && (
                      <Button
                        size="lg"
                        fullWidth
                        isDisabled
                        variant="bordered"
                        className="font-medium border border-[#3C444D] rounded-xl"
                      >
                        Not Available
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="text-center max-w-md">
                <div className="bg-default-100 rounded-full p-8 mb-8 inline-block border border-[#3C444D]">
                  <IoShield className="h-16 w-16 text-default-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  No NFTs Available
                </h3>
                <p className="text-default-500 mb-8 text-lg leading-relaxed">
                  The marketplace is empty. Be the first to mint and list an
                  NFT!
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
