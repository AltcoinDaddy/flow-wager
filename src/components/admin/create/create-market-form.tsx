/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// src/components/admin/create/create-market-form.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Check, Upload, Loader2 } from "lucide-react";
import * as fcl from "@onflow/fcl";
import { toast } from "sonner";

// Market categories matching your FlowWager contract enum values
const MARKET_CATEGORIES = [
  {
    value: 0,
    label: "Sports",
    emoji: "⚽",
    description: "Sports events, games, tournaments",
  },
  {
    value: 1,
    label: "Entertainment",
    emoji: "🎬",
    description: "Movies, music, awards, celebrities",
  },
  {
    value: 2,
    label: "Technology",
    emoji: "💻",
    description: "Product launches, tech developments",
  },
  {
    value: 3,
    label: "Economics",
    emoji: "💰",
    description: "Market movements, economic indicators",
  },
  {
    value: 4,
    label: "Weather",
    emoji: "🌤️",
    description: "Weather predictions, natural events",
  },
  {
    value: 5,
    label: "Crypto",
    emoji: "₿",
    description: "Cryptocurrency price predictions",
  },
  {
    value: 6,
    label: "Politics",
    emoji: "🗳️",
    description: "Elections, policy decisions, government",
  },
  {
    value: 7,
    label: "Breaking News",
    emoji: "📰",
    description: "Current events and breaking news",
  },
  {
    value: 8,
    label: "Other",
    emoji: "❓",
    description: "Miscellaneous predictions",
  },
];

interface CreateMarketFormProps {
  onSubmit?: (result: {
    success: boolean;
    transactionId?: string;
    marketId?: number;
    error?: string;
  }) => void;
  isLoading?: boolean;
}

export function CreateMarketForm({
  onSubmit,
  isLoading: externalLoading = false,
}: CreateMarketFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    question: "",
    optionA: "",
    optionB: "",
    category: -1,
    endDate: "",
    endTime: "",
    resolutionSource: "",
    rules: "",
    imageURI: "",
    initialLiquidity: "1000",
    minBet: "1",
    maxBet: "1000",
    isBreakingNews: false,
    isPublic: true,
    creatorFee: "2.5",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check user authentication on component mount
  useState(() => {
    const checkAuth = async () => {
      const currentUser = await fcl.currentUser.snapshot();
      setUser(currentUser);
    };
    checkAuth();

    // Subscribe to auth changes
    const unsubscribe = fcl.currentUser.subscribe(setUser);
    return unsubscribe;
  });

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) newErrors.question = "Question is required";
    if (formData.question.length < 10)
      newErrors.question = "Question must be at least 10 characters";
    if (formData.question.length > 500)
      newErrors.question = "Question must be less than 500 characters";

    if (!formData.optionA.trim()) newErrors.optionA = "Option A is required";
    if (!formData.optionB.trim()) newErrors.optionB = "Option B is required";
    if (formData.optionA === formData.optionB)
      newErrors.optionB = "Options must be different";

    if (formData.category === -1) newErrors.category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";

    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();
    const minEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    if (endDateTime <= minEndTime) {
      newErrors.endDate = "Market must end at least 1 hour from now";
    }

    // Calculate duration in hours
    const durationHours =
      (endDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (durationHours > 720) {
      // 30 days = 720 hours
      newErrors.endDate = "Market duration cannot exceed 30 days";
    }

    if (!formData.resolutionSource.trim()) {
      newErrors.resolutionSource = "Resolution source is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    const minBet = parseFloat(formData.minBet);
    const maxBet = parseFloat(formData.maxBet);

    if (isNaN(minBet) || minBet < 0.01) {
      newErrors.minBet = "Minimum bet must be at least 0.01 FLOW";
    }
    if (isNaN(maxBet) || maxBet < minBet) {
      newErrors.maxBet = "Maximum bet must be greater than minimum bet";
    }
    if (maxBet > 100000) {
      newErrors.maxBet = "Maximum bet cannot exceed 100,000 FLOW";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  // 🚨 THIS IS WHERE THE SMART CONTRACT IS CALLED 🚨
 const createMarketOnBlockchain = async (marketData: any): Promise<string> => {
  if (!user?.addr) {
    throw new Error("User not authenticated");
  }

  try {
    console.log("Creating market on blockchain with data:", marketData);

    const transactionId = await fcl.mutate({
      cadence: `
        import FlowWager from ${process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT}

        transaction(
          question: String,
          optionA: String,
          optionB: String,
          category: UInt8,
          minBet: UFix64,
          maxBet: UFix64,
          duration: UFix64
        ) {
          let adminRef: auth(Storage) &FlowWager.Admin
          
          prepare(signer: auth(Storage) &Account) {
            self.adminRef = signer.storage.borrow<auth(Storage) &FlowWager.Admin>(from: /storage/FlowWagerAdmin)
              ?? panic("Could not borrow Admin reference. Only admins can create markets.")
          }
          
          execute {
            let categoryEnum = FlowWager.MarketCategory(rawValue: category)
              ?? panic("Invalid category value")
            
            let endTime = getCurrentBlock().timestamp + duration
            
            let marketId = self.adminRef.createMarket(
              title: question,
              description: question,
              category: categoryEnum,
              optionA: optionA,
              optionB: optionB,
              endTime: endTime,
              minBet: minBet,
              maxBet: maxBet
            )
            
            log("Market created with ID: ".concat(marketId.toString()))
          }
        }
      `,
      args: (arg, t) => [
        arg(marketData.question, t.String),
        arg(marketData.optionA, t.String),
        arg(marketData.optionB, t.String),
        arg(marketData.category.toString(), t.UInt8),
        arg(marketData.minBet.toFixed(8), t.UFix64),
        arg(marketData.maxBet.toFixed(8), t.UFix64),
        arg((marketData.duration * 3600).toFixed(1), t.UFix64)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    console.log("Transaction submitted:", transactionId);

    // Wait for transaction to be sealed
    const transaction = await fcl.tx(transactionId).onceSealed();
    
    console.log("Transaction result:", transaction);
    console.log("Transaction status:", transaction.status);
    console.log("Transaction events:", transaction.events);

    // Check the correct status codes
    if (transaction.status === 5) {
      // Status 5 = EXPIRED (failed)
      const errorMsg = transaction.errorMessage || "Transaction expired/failed";
      console.error("Transaction failed with error:", errorMsg);
      throw new Error(`Transaction failed: ${errorMsg}`);
    }

    if (transaction.status === 4) {
      // Status 4 = SEALED (success!)
      console.log("Transaction sealed successfully!");
      
      // Try to extract market ID from events if possible
      const marketCreatedEvent = transaction.events?.find(
        (event: any) => event.type.includes('MarketCreated')
      );
      
      if (marketCreatedEvent) {
        console.log("Market created event:", marketCreatedEvent);
      }
      
      return transactionId;
    }

    // If we get here, something unexpected happened
    console.warn("Unexpected transaction status:", transaction.status);
    return transactionId;

  } catch (error: any) {
    console.error("Market creation failed:", error);
    
    // Better error message extraction
    let errorMessage = "Unknown error occurred";
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    // If it's a Cadence runtime error, try to extract the panic message
    if (error.message && error.message.includes('panic:')) {
      const panicMatch = error.message.match(/panic: (.+?)(?:\n|$)/);
      if (panicMatch) {
        errorMessage = panicMatch[1];
      }
    }
    
    console.error("Processed error message:", errorMessage);
    throw new Error(errorMessage);
  }
};


  const handleSubmit = async () => {
    if (!validateStep3()) return;

    if (!user?.loggedIn) {
      toast.error("Please connect your wallet first");
      if (onSubmit) {
        onSubmit({ success: false, error: "Wallet not connected" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate duration in hours from end date/time
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const now = new Date();
      const durationHours =
        (endDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const marketCreationData = {
        question: formData.question.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        category: formData.category,
        imageURI: formData.imageURI || "",
        duration: durationHours,
        isBreakingNews: formData.isBreakingNews,
        minBet: parseFloat(formData.minBet),
        maxBet: parseFloat(formData.maxBet),
      };

      console.log("Submitting market creation:", marketCreationData);

      // 🚨 CALLING THE SMART CONTRACT HERE 🚨
      const transactionId = await createMarketOnBlockchain(marketCreationData);

      toast.success("Market created successfully!");

      if (onSubmit) {
        onSubmit({
          success: true,
          transactionId,
          marketId: Date.now(), // Temporary ID until we can extract from events
        });
      } else {
        router.push("/admin");
      }
    } catch (error: any) {
      console.error("Failed to create market:", error);
      const errorMessage = error.message || "Failed to create market";
      toast.error(errorMessage);

      if (onSubmit) {
        onSubmit({ success: false, error: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isSubmitting || externalLoading;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 border-2 border-gray-700/50 rounded-xl bg-gradient-to-br from-[#0A0C14]/50 to-[#151923]/30 backdrop-blur-sm">
      {/* Wallet Connection Check */}
      {!user?.loggedIn && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            Please connect your wallet to create markets. Only admin wallets can
            create markets.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber < step
                  ? "bg-green-500 text-white"
                  : stepNumber === step
                  ? "bg-[#9b87f5] text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 4 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  stepNumber < step ? "bg-green-500" : "bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question" className="text-gray-300">
                Market Question *
              </Label>
              <Input
                id="question"
                placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                value={formData.question}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, question: e.target.value }))
                }
                className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
                  errors.question ? "border-red-500" : ""
                }`}
              />
              {errors.question && (
                <p className="text-sm text-red-400">{errors.question}</p>
              )}
              <p className="text-xs text-gray-400">
                {formData.question.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optionA" className="text-gray-300">
                  Option A *
                </Label>
                <Input
                  id="optionA"
                  placeholder="Yes"
                  value={formData.optionA}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      optionA: e.target.value,
                    }))
                  }
                  className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
                    errors.optionA ? "border-red-500" : ""
                  }`}
                />
                {errors.optionA && (
                  <p className="text-sm text-red-400">{errors.optionA}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionB" className="text-gray-300">
                  Option B *
                </Label>
                <Input
                  id="optionB"
                  placeholder="No"
                  value={formData.optionB}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      optionB: e.target.value,
                    }))
                  }
                  className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
                    errors.optionB ? "border-red-500" : ""
                  }`}
                />
                {errors.optionB && (
                  <p className="text-sm text-red-400">{errors.optionB}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">
                Category *
              </Label>
              <Select
                value={
                  formData.category === -1 ? "" : formData.category.toString()
                }
                onValueChange={(value: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: parseInt(value),
                  }))
                }
              >
                <SelectTrigger
                  className={`bg-[#0A0C14] border-gray-700 text-white focus:border-[#9b87f5] ${
                    errors.category ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F2C] border-gray-700">
                  {MARKET_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value.toString()}
                      className="text-white hover:bg-[#0A0C14]"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{category.emoji}</span>
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-400">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageURI" className="text-gray-300">
                Market Image (Optional)
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="imageURI"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageURI}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imageURI: e.target.value,
                    }))
                  }
                  className="bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C]"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isBreakingNews" className="text-gray-300">
                  Breaking News
                </Label>
                <p className="text-xs text-gray-400">
                  Mark this market as breaking news for higher visibility
                </p>
              </div>
              <Switch
                id="isBreakingNews"
                checked={formData.isBreakingNews}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isBreakingNews: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Timeline & Resolution */}
      {step === 2 && (
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">Timeline & Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-gray-300">
                  End Date *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className={`bg-[#0A0C14] border-gray-700 text-white focus:border-[#9b87f5] ${
                    errors.endDate ? "border-red-500" : ""
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-gray-300">
                  End Time *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className={`bg-[#0A0C14] border-gray-700 text-white focus:border-[#9b87f5] ${
                    errors.endTime ? "border-red-500" : ""
                  }`}
                />
              </div>
            </div>
            {(errors.endDate || errors.endTime) && (
              <p className="text-sm text-red-400">
                {errors.endDate || errors.endTime}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="resolutionSource" className="text-gray-300">
                Resolution Source *
              </Label>
              <Input
                id="resolutionSource"
                placeholder="CoinGecko, Reuters, Official Government Website, etc."
                value={formData.resolutionSource}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    resolutionSource: e.target.value,
                  }))
                }
                className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
                  errors.resolutionSource ? "border-red-500" : ""
                }`}
              />
              {errors.resolutionSource && (
                <p className="text-sm text-red-400">
                  {errors.resolutionSource}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Specify the authoritative source that will be used for
                resolution
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules" className="text-gray-300">
                Resolution Rules
              </Label>
              <Textarea
                id="rules"
                placeholder="Detailed rules for how this market will be resolved, including edge cases..."
                value={formData.rules}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rules: e.target.value }))
                }
                className="min-h-24 bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5]"
              />
              <p className="text-xs text-gray-400">
                Clear resolution criteria help prevent disputes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Market Settings */}
      {step === 3 && (
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">Market Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBet" className="text-gray-300">
                  Minimum Bet (FLOW) *
                </Label>
                <Input
                  id="minBet"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1"
                  value={formData.minBet}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, minBet: e.target.value }))
                  }
                  className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
                    errors.minBet ? "border-red-500" : ""
                  }`}
                />
                {errors.minBet && (
                  <p className="text-sm text-red-400">{errors.minBet}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBet" className="text-gray-300">
                  Maximum Bet (FLOW) *
                </Label>
                <Input
                  id="maxBet"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="1000"
                  value={formData.maxBet}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxBet: e.target.value }))
                  }
                  className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
                    errors.maxBet ? "border-red-500" : ""
                  }`}
                />
                {errors.maxBet && (
                  <p className="text-sm text-red-400">{errors.maxBet}</p>
                )}
              </div>
            </div>

            <div className="bg-[#0A0C14] p-4 rounded-lg border border-gray-800/50">
              <h4 className="font-medium mb-2 text-white">
                Contract Information
              </h4>
              <div className="text-sm text-gray-400 space-y-1">
                <p>
                  • <strong className="text-gray-300">Contract:</strong>{" "}
                  {process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT}
                </p>
                <p>
                  • <strong className="text-gray-300">Network:</strong> Flow
                  Mainnet
                </p>
                <p>
                  • <strong className="text-gray-300">Your Address:</strong>{" "}
                  {user?.addr}
                </p>
                <p>
                  • <strong className="text-gray-300">Platform Fee:</strong> 3%
                  of winnings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && (
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white">Market Question</h4>
                <p className="text-sm text-gray-400">{formData.question}</p>
              </div>

              <div>
                <h4 className="font-semibold text-white">Options</h4>
                <div className="flex space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-green-500/30"
                  >
                    {formData.optionA}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-red-500/20 text-red-400 border-red-500/30"
                  >
                    {formData.optionB}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white">Category</h4>
                <Badge
                  variant="outline"
                  className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30"
                >
                  {
                    MARKET_CATEGORIES.find(
                      (cat) => cat.value === formData.category
                    )?.label
                  }
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold text-white">Trading Period</h4>
                <p className="text-sm text-gray-400">
                  Ends{" "}
                  {new Date(
                    `${formData.endDate}T${formData.endTime}`
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white">Betting Limits</h4>
                <p className="text-sm text-gray-400">
                  {formData.minBet} - {formData.maxBet} FLOW
                </p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-400">
                    Important Notice
                  </p>
                  <p className="text-gray-400">
                    Once created, market details cannot be changed. The market
                    will be deployed to the Flow blockchain. Transaction fees
                    will be deducted from your wallet.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || loading}
          className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
        >
          Back
        </Button>

        <div className="space-x-2">
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !user?.loggedIn}
              className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Market...
                </>
              ) : (
                "Create Market"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Analytics Panel Component remains the same...
export function AnalyticsPanel() {
  const [timeRange, setTimeRange] = useState("7d");

  const analyticsData = {
    totalMarkets: 156,
    activeMarkets: 89,
    totalVolume: "2,847,293.45",
    totalUsers: 12437,
    avgMarketVolume: "18,251.24",
    topCategory: "Economics",
    resolutionAccuracy: 96.8,
    avgResolutionTime: "2.3 days",
  };

  const topMarkets = [
    {
      title: "Will Bitcoin reach $100,000 by end of 2025?",
      volume: "125,430.78",
      traders: 1247,
      category: "Economics",
    },
    {
      title: "Next US Presidential Election Winner",
      volume: "98,234.56",
      traders: 892,
      category: "Politics",
    },
    {
      title: "Will ChatGPT-5 be released in 2025?",
      volume: "76,543.21",
      traders: 634,
      category: "Technology",
    },
  ];

  const categoryStats = [
    { category: "Economics", markets: 45, volume: "1,234,567" },
    { category: "Sports", markets: 38, volume: "876,543" },
    { category: "Politics", markets: 24, volume: "654,321" },
    { category: "Technology", markets: 31, volume: "543,210" },
    { category: "Entertainment", markets: 18, volume: "321,098" },
  ];

  return (
    <div className="space-y-6 bg-[#0A0C14] text-white">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Platform Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-[#1A1F2C] border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1F2C] border-gray-700">
            <SelectItem value="24h" className="text-white hover:bg-[#0A0C14]">
              Last 24h
            </SelectItem>
            <SelectItem value="7d" className="text-white hover:bg-[#0A0C14]">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="text-white hover:bg-[#0A0C14]">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="text-white hover:bg-[#0A0C14]">
              Last 90 days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {analyticsData.totalMarkets}
            </div>
            <div className="text-sm text-gray-400">Total Markets</div>
            <div className="text-xs text-green-400">+12 this week</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {analyticsData.totalVolume}
            </div>
            <div className="text-sm text-gray-400">Total Volume (FLOW)</div>
            <div className="text-xs text-green-400">+15.3% vs last week</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {analyticsData.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Users</div>
            <div className="text-xs text-green-400">+234 new users</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {analyticsData.resolutionAccuracy}%
            </div>
            <div className="text-sm text-gray-400">Resolution Accuracy</div>
            <div className="text-xs text-green-400">+0.2% vs last month</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Markets */}
      <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Top Markets by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topMarkets.map((market, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0A0C14] transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium line-clamp-1 text-white">
                    {market.title}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <Badge
                      variant="outline"
                      className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30"
                    >
                      {market.category}
                    </Badge>
                    <span>{market.traders} traders</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">
                    {market.volume} FLOW
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Markets by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-white">
                    {stat.category}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-gray-700/50 text-gray-300 border-gray-600"
                  >
                    {stat.markets} markets
                  </Badge>
                </div>
                <span className="font-medium text-white">
                  {stat.volume} FLOW
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
