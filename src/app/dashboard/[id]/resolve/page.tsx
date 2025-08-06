/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MarketError } from "@/components/market/market-error";
import { MarketLoading } from "@/components/market/market-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  getAllMarkets,
  getMarketEvidence,
  submitResolutionEvidenceTransaction,
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import * as fcl from "@onflow/fcl";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { getStatusColor } from "@/utils";
import { MarketCategoryLabels } from "@/types/market";

interface Market {
  id: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  endTime: string;
  status?: string;
}

interface Evidence {
  evidence: string;
  requestedOutcome: "0" | "1";
}

export default function UserResolvePage() {
  const params = useParams();
  const userAddress = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingEvidence, setIsFetchingEvidence] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [evidence, setEvidence] = useState("");
  const [requestedOutcome, setRequestedOutcome] = useState<"0" | "1" | "">("");
  const [existingEvidence, setExistingEvidence] = useState<Evidence | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOwnProfile = currentUser?.addr === userAddress;

  const authorization = fcl.currentUser().authorization;

  const initConfig = async () => {
    flowConfig();
  };

  const fetchPendingMarkets = async () => {
    try {
      setError(null);
      await initConfig();

      const script = await getAllMarkets();
      const result = await fcl.query({
        cadence: script,
      });

      console.log(result, "This is the queried result");

      const formattedMarkets: Market[] = (Array.isArray(result) ? result : [])
        .filter(
          (market: any) =>
            market?.creator === userAddress && market.resolved !== true
        )
        .map((marketObj: any) => {
          const market = marketObj.market ?? marketObj;
          return {
            id: market.id?.toString() ?? "",
            title: market.title ?? "",
            description: market.description ?? "",
            optionA: market.optionA ?? "",
            optionB: market.optionB ?? "",
            endTime: market.endTime ?? "0",
            status: market.status.rawValue ?? "0",
          };
        });

      setMarkets(formattedMarkets);
    } catch (err) {
      console.error("Error fetching pending markets:", err);
      setError("Failed to fetch markets pending resolution.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchMarketEvidence = async (marketId: string) => {
    try {
      setIsFetchingEvidence(true);
      setSubmitError(null);
      const script = await getMarketEvidence();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(marketId, t.UInt64)],
      });

      if (result) {
        setExistingEvidence({
          evidence: result.evidence,
          requestedOutcome: result.requestedOutcome.toString() as "0" | "1",
        });
      } else {
        setExistingEvidence(null);
      }
    } catch (err) {
      console.error("Error fetching market evidence:", err);
      setSubmitError("Failed to fetch existing evidence.");
    } finally {
      setIsFetchingEvidence(false);
    }
  };

  const handleSubmitEvidence = async (marketId: string) => {
    if (!evidence || !requestedOutcome) {
      setSubmitError("Please provide evidence and select an outcome.");
      return;
    }

    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      setIsSubmitting(true);
      const transaction = await submitResolutionEvidenceTransaction();
      const txResult = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(marketId, t.UInt64),
          arg(evidence, t.String),
          arg(requestedOutcome, t.UInt8),
        ],
        payer: authorization,
        proposer: authorization,
        authorizations: [authorization],
        limit: 999,
      });

      await fcl.tx(txResult).onceSealed();
      setMarkets(markets.filter((market) => market.id !== marketId));
      setSelectedMarket(null);
      setEvidence("");
      setRequestedOutcome("");
      setExistingEvidence(null);
      setSubmitSuccess("Evidence submitted successfully!");
      setTimeout(() => setSubmitSuccess(null), 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to submit evidence.";
      if (errorMessage.includes("Evidence already submitted")) {
        setSubmitError("Evidence has already been submitted for this market.");
      } else {
        setSubmitError(errorMessage);
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingMarkets();
  };

  useEffect(() => {
    if (userAddress && isOwnProfile) {
      fetchPendingMarkets();

      pollingIntervalRef.current = setInterval(() => {
        fetchPendingMarkets();
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [userAddress, isOwnProfile]);

  useEffect(() => {
    if (selectedMarket) {
      fetchMarketEvidence(selectedMarket.id);
    } else {
      setExistingEvidence(null);
      setEvidence("");
      setRequestedOutcome("");
    }
  }, [selectedMarket]);

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - parseInt(timestamp) * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (!isOwnProfile) {
    return (
      <MarketError
        error="You can only view your own markets to resolve."
        onRetry={() =>
          (window.location.href = `/dashboard/${currentUser?.addr}/resolve`)
        }
      />
    );
  }

  if (loading) {
    return <MarketLoading />;
  }

  if (error) {
    return <MarketError error={error} onRetry={fetchPendingMarkets} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Resolve Your Markets
              </h1>
              <p className="text-gray-400">
                Submit evidence for markets you created that are pending
                resolution.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50 w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Markets List */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">
              Markets Pending Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {markets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No markets to resolve</p>
                <p className="text-sm">
                  You have no markets pending resolution without evidence.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((market) => (
                  <Card
                    key={market.id}
                    className="bg-[#1A1F2C] border-gray-800/50 hover:bg-gray-800/20 transition-colors"
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {market.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {market.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-400">Option A</p>
                          <p className="text-white font-medium">
                            {market.optionA}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Option B</p>
                          <p className="text-white font-medium">
                            {market.optionB}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Ended</p>
                          <p className="text-white font-medium">
                            {formatRelativeTime(market.endTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Status</p>
                          <p
                            className={`text-white font-medium ${getStatusColor(
                              Number(market.status)
                            )}`}
                          >
                            {
                              MarketCategoryLabels[
                                market.status as unknown as keyof typeof MarketCategoryLabels
                              ]
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white w-full"
                        onClick={() => setSelectedMarket(market)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Evidence
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence Submission Modal */}
        <Dialog
          open={!!selectedMarket}
          onOpenChange={(open) => !open && setSelectedMarket(null)}
        >
          <DialogContent className="bg-[#1A1F2C] border-gray-800/50 max-w-md w-full text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                Submit Evidence for {selectedMarket?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {submitError && (
                <div className="text-red-400 text-sm">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="text-green-400 text-sm">{submitSuccess}</div>
              )}
              {isFetchingEvidence ? (
                <div className="text-gray-400 text-sm flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading evidence...
                </div>
              ) : existingEvidence ? (
                <div className="space-y-4">
                  <div className="flex flex-col  gap-2">
                    <Label className="text-gray-400">Submitted Evidence</Label>
                    <Textarea
                      value={existingEvidence.evidence}
                      readOnly
                      className="bg-[#151923] border-gray-700 text-white placeholder-gray-500 h-[150px]"
                      aria-describedby="evidence-description"
                    />
                    <p
                      id="evidence-description"
                      className="text-sm text-gray-500 mt-1"
                    >
                      This is the evidence you previously submitted.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-400">Selected Outcome</Label>
                    <p className="text-white font-medium">
                      {existingEvidence.requestedOutcome === "0"
                        ? selectedMarket?.optionA
                        : selectedMarket?.optionB}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col  gap-2">
                    <Label htmlFor="evidence" className="text-gray-400">
                      Evidence Description
                    </Label>
                    <Textarea
                      id="evidence"
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      placeholder="Enter evidence details (e.g., URL or description)"
                      className="bg-[#151923] border-gray-700 text-white placeholder-gray-500 h-[150px]"
                      aria-describedby="evidence-description"
                    />
                    <p
                      id="evidence-description"
                      className="text-sm text-gray-500 mt-1"
                    >
                      Provide a URL or detailed description of the evidence.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outcome" className="text-gray-400">
                      Requested Outcome
                    </Label>
                    <Select
                      value={requestedOutcome}
                      onValueChange={(value) =>
                        setRequestedOutcome(value as "0" | "1")
                      }
                    >
                      <SelectTrigger className="bg-[#151923] border-gray-700 text-white">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1F2C] border-gray-700 text-white">
                        <SelectItem value="0">
                          {selectedMarket?.optionA}
                        </SelectItem>
                        <SelectItem value="1">
                          {selectedMarket?.optionB}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMarket(null)}
                  className="border-gray-700 text-white hover:bg-[#1A1F2C] bg-[#1A1F2C] hover:text-white"
                >
                  Close
                </Button>
              </DialogClose>
              {!existingEvidence && (
                <Button
                  className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                  onClick={() =>
                    selectedMarket && handleSubmitEvidence(selectedMarket.id)
                  }
                  disabled={
                    !evidence ||
                    !requestedOutcome ||
                    isSubmitting ||
                    isFetchingEvidence
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    "Submit Evidence"
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
