/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
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
import { AlertTriangle, Check, Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import * as fcl from "@onflow/fcl";
import { toast } from "sonner";
import flowConfig from '@/lib/flow/config';
import { 
  createMarketTransaction,
  getUserProfile,
  createUserAccountTransaction,
} from '@/lib/flow-wager-scripts';
import Image from "next/image";

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

// Cloudinary upload function
const uploadToCloudinary = async (file: File): Promise<string> => {
  // Validate environment variables
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error('Missing Cloudinary configuration:', {
      cloudName: !!cloudName,
      uploadPreset: !!uploadPreset
    });
    throw new Error('Cloudinary not configured. Please check environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    console.log('Uploading to Cloudinary:', {
      cloudName,
      uploadPreset,
      fileSize: file.size,
      fileType: file.type
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary API error:', data);
      throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
    }

    console.log('Upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image');
  }
};

export function CreateMarketForm({
  onSubmit,
  isLoading: externalLoading = false,
}: CreateMarketFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Check user authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await fcl.currentUser.snapshot();
      setUser(currentUser);
    };
    
    checkAuth();

    // Subscribe to auth changes
    const unsubscribe = fcl.currentUser.subscribe(setUser);
    
    // Return cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize Flow configuration
  useEffect(() => {
    const initFlow = async () => {
      try {
        flowConfig();
        console.log('Flow configuration initialized for market creation');
      } catch (error) {
        console.error('Failed to initialize Flow configuration:', error);
      }
    };

    initFlow();
  }, []);

  // Handle file selection and upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Check Cloudinary configuration
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Cloudinary not configured. Please check environment variables.');
      console.error('Missing Cloudinary environment variables:', {
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);
      
      setFormData(prev => ({ ...prev, imageURI: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      toast.error(errorMessage);
      setImagePreview("");
      
      // If it's a configuration error, provide helpful guidance
      if (errorMessage.includes('not configured')) {
        console.log(`
📋 Cloudinary Setup Instructions:
1. Sign up at https://cloudinary.com
2. Get your Cloud Name from the dashboard
3. Create an upload preset:
   - Go to Settings → Upload presets
   - Click "Add upload preset"
   - Set to "Unsigned"
   - Note the preset name
4. Add to your .env.local:
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
        `);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Trigger file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageURI: "" }));
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  // 🚨 UPDATED: Use your Flow Wager scripts instead of hardcoded Cadence 🚨
  const createMarketOnBlockchain = async (marketData: any): Promise<string> => {
    if (!user?.addr) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("Creating market on blockchain with data:", marketData);

      // Get the create market transaction script from your flow-wager-scripts
      const transactionScript = await createMarketTransaction();
      
      console.log("Using transaction script from flow-wager-scripts");

      const authorization = fcl.currentUser().authorization;
      const transactionId = await fcl.mutate({
        cadence: transactionScript,
        args: (arg, t) => [
          arg(marketData.question, t.String),           // title
          arg(marketData.description, t.String),        // description (includes rules + image)
          arg(marketData.category.toString(), t.UInt8), // category
          arg(marketData.optionA, t.String),           // optionA
          arg(marketData.optionB, t.String),           // optionB
          arg(marketData.endTime.toFixed(1), t.UFix64), // endTime (Unix timestamp)
          arg(marketData.minBet.toFixed(8), t.UFix64),  // minBet
          arg(marketData.maxBet.toFixed(8), t.UFix64),  // maxBet
          arg(marketData.imageURI || "", t.String),     // imageUrl
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000
      });

      console.log("Transaction submitted:", transactionId);

      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      
      console.log("Transaction result:", transaction);
      console.log("Transaction status:", transaction.status);
      console.log("Transaction events:", transaction.events);

      // Check transaction status
      if (transaction.status === 5) {
        // Status 5 = EXPIRED/FAILED
        const errorMsg = transaction.errorMessage || "Transaction expired/failed";
        console.error("Transaction failed with error:", errorMsg);
        throw new Error(`Transaction failed: ${errorMsg}`);
      }

      if (transaction.status === 4) {
        // Status 4 = SEALED (success!)
        console.log("Transaction sealed successfully!");
        
        // Try to extract market ID from events
        const marketCreatedEvent = transaction.events?.find(
          (event: any) => event.type.includes('MarketCreated')
        );
        
        if (marketCreatedEvent) {
          console.log("Market created event:", marketCreatedEvent);
          // Extract market ID from event data if available
          const marketId = marketCreatedEvent.data?.marketId;
          if (marketId) {
            console.log("Extracted market ID:", marketId);
          }
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
      
      // Handle specific error cases
      if (errorMessage.includes('Could not borrow Admin reference')) {
        errorMessage = "You do not have the required permissions to create a market. Please ensure your account is set up correctly or contact support if this issue persists.";
      } else if (errorMessage.includes('Could not borrow FlowToken vault')) {
        errorMessage = "Unable to access your Flow token vault. Please ensure you have sufficient FLOW tokens and proper vault setup.";
      } else if (errorMessage.includes('location')) {
        errorMessage = "Contract deployment error. Please check the contract address configuration.";
      }
      
      console.error("Processed error message:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Helper to ensure user account exists before market creation
  const ensureUserAccount = async () => {
    if (!user?.addr) {
      toast.error("Wallet not connected. Please connect your wallet.");
      throw new Error("Wallet not connected");
    }
    try {
      // Check if user profile exists
      const script = await getUserProfile();
      const profile = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(user.addr, t.Address)],
      });
      if (!profile) {
        // Prompt user to create account
        if (!window.confirm("You need to create a FlowWager user account before creating a market. Continue?")) {
          toast.info("User account creation cancelled.");
          throw new Error("User account creation cancelled");
        }
        const tx = await createUserAccountTransaction();
        let txId;
        try {
          const authorization = fcl.currentUser().authorization;
          txId = await fcl.mutate({
            cadence: tx,
            args: () => [],
            proposer: authorization,
            payer: authorization,
            authorizations: [authorization],
            limit: 100,
          });
        } catch (err: any) {
          if (err && err.message && err.message.toLowerCase().includes("user rejected")) {
            toast.error("Transaction cancelled by user.");
            throw new Error("User rejected the transaction");
          }
          toast.error("Failed to send account creation transaction. Please check your wallet connection.");
          throw err;
        }
        // Wait for transaction to be sealed
        try {
          await fcl.tx(txId).onceSealed();
        } catch (err: any) {
          toast.error("Account creation transaction failed or was not sealed.");
          throw err;
        }
        toast.success("User account created successfully!");
      }
    } catch (err: any) {
      if (err && err.message && err.message.toLowerCase().includes("user rejected")) {
        toast.error("Transaction cancelled by user.");
      } else if (err && err.message && err.message.toLowerCase().includes("wallet not connected")) {
        toast.error("Wallet not connected. Please connect your wallet.");
      } else {
        toast.error("Error creating user account: " + (err.message || err));
      }
      throw err;
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
      // Ensure user account exists before proceeding
      await ensureUserAccount();

      // Calculate end time as Unix timestamp
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const endTimeUnix = endDateTime.getTime() / 1000;

  
      const marketCreationData = {
        question: formData.question.trim(),
        description: formData.rules.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        category: formData.category,
        endTime: endTimeUnix, // Unix timestamp
        minBet: parseFloat(formData.minBet),
        maxBet: parseFloat(formData.maxBet),
        imageURI: formData.imageURI.trim(),
      };

      console.log("Submitting market creation:", marketCreationData);

      // 🚨 CALLING YOUR FLOW WAGER SCRIPT HERE 🚨
      let transactionId;
      try {
        transactionId = await createMarketOnBlockchain(marketCreationData);
      } catch (err: any) {
        if (err && err.message && err.message.toLowerCase().includes("user rejected")) {
          toast.error("Transaction cancelled by user.");
          if (onSubmit) onSubmit({ success: false, error: "User rejected the transaction" });
          return;
        }
        if (err && err.message && err.message.toLowerCase().includes("wallet not connected")) {
          toast.error("Wallet not connected. Please connect your wallet.");
          if (onSubmit) onSubmit({ success: false, error: "Wallet not connected" });
          return;
        }
        toast.error("Failed to create market: " + (err.message || err));
        if (onSubmit) onSubmit({ success: false, error: err.message || "Failed to create market" });
        return;
      }

      toast.success("Market created successfully on Flow blockchain!");

      if (onSubmit) {
        onSubmit({
          success: true,
          transactionId,
          marketId: Date.now(), // Temporary ID - you could extract real ID from events
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Wallet Connection Check */}
      {!user?.loggedIn && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            Please connect your wallet to create markets.
          </AlertDescription>
        </Alert>
      )}

      {/* Cloudinary Configuration Check */}
      {(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) && (
        <Alert className="bg-orange-500/10 border-orange-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-400">
            <div>
              <p className="font-medium">Cloudinary not configured</p>
              <p className="text-sm mt-1">
                Image upload will not work. Manual URL entry is still available.
                Check console for setup instructions.
              </p>
            </div>
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

            {/* Enhanced Image Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="imageURI" className="text-gray-300">
                Market Image (Optional)
              </Label>
              
              {/* Image Preview */}
              {(imagePreview || formData.imageURI) && (
                <div className="relative">
                  <div className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <Image
                      src={imagePreview || formData.imageURI}
                      alt="Market preview"
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 border-red-500 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Controls */}
              <div className="flex space-x-2">
                <Input
                  id="imageURI"
                  placeholder="https://example.com/image.jpg or click upload"
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
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  disabled={isUploadingImage}
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5] min-w-[120px]"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <ImageIcon className="h-3 w-3" />
                <span>Supports JPG, PNG, GIF up to 5MB. Images will be hosted on Cloudinary.</span>
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
                  {process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT || "0xfb16e84ea1882f67"}
                </p>
                <p>
                  • <strong className="text-gray-300">Network:</strong> Flow{" "}
                  {process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet"}
                </p>
                <p>
                  • <strong className="text-gray-300">Your Address:</strong>{" "}
                  {user?.addr}
                </p>
                <p>
                  • <strong className="text-gray-300">Creation Fee:</strong> 10.0 FLOW
                  (waived for contract deployer)
                </p>
                <p>
                  • <strong className="text-gray-300">Platform Fee:</strong> 2.5%
                  of winnings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Confirm - Updated to not show hidden image URL in rules */}
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

              {formData.imageURI && (
                <div>
                  <h4 className="font-semibold text-white">Market Image</h4>
                  <div className="w-32 h-20 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <Image
                      width={100}
                      height={100}
                      src={formData.imageURI}
                      alt="Market image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-white">Trading Period</h4>
                <p className="text-sm text-gray-400">
                  Ends{" "}
                  {new Date(
                    `${formData.endDate}T${formData.endTime}`
                  ).toLocaleString()}
                </p>
              </div>

              {/* ✅ Show clean resolution rules (without hidden image URL) */}
              {formData.rules && (
                <div>
                  <h4 className="font-semibold text-white">Resolution Rules</h4>
                  <p className="text-sm text-gray-400">{formData.rules}</p>
                </div>
              )}

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