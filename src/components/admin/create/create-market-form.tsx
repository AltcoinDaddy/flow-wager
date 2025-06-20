"use client";

// src/components/admin/create-market-form.tsx

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
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  CalendarIcon,
  ImageIcon,
  Tag,
  AlertTriangle,
  Check,
  X,
  Upload,
  Globe,
  DollarSign
} from "lucide-react";
import { MARKET_CATEGORIES } from "@/lib/constants";
import type { MarketCategory } from "@/types/market";

interface CreateMarketFormProps {
  onSubmit?: (marketData: any) => void;
  isLoading?: boolean;
}

export function CreateMarketForm({ onSubmit, isLoading = false }: CreateMarketFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    question: "",
    optionA: "",
    optionB: "",
    category: "" as MarketCategory | "",
    endDate: "",
    endTime: "",
    resolutionSource: "",
    rules: "",
    imageURI: "",
    initialLiquidity: "1000",
    minBet: "1",
    maxBet: "1000",
    isBreakingNews: false,
    isPublic: true
  });
  
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.question.trim()) newErrors.question = "Question is required";
    if (formData.question.length < 10) newErrors.question = "Question must be at least 10 characters";
    if (formData.question.length > 200) newErrors.question = "Question must be less than 200 characters";
    
    if (!formData.optionA.trim()) newErrors.optionA = "Option A is required";
    if (!formData.optionB.trim()) newErrors.optionB = "Option B is required";
    
    if (!formData.category) newErrors.category = "Category is required";
    
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
    
    if (!formData.resolutionSource.trim()) {
      newErrors.resolutionSource = "Resolution source is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    const liquidity = parseFloat(formData.initialLiquidity);
    if (isNaN(liquidity) || liquidity < 100) {
      newErrors.initialLiquidity = "Minimum initial liquidity is 100 FLOW";
    }
    if (liquidity > 100000) {
      newErrors.initialLiquidity = "Maximum initial liquidity is 100,000 FLOW";
    }
    
    const minBet = parseFloat(formData.minBet);
    const maxBet = parseFloat(formData.maxBet);
    
    if (isNaN(minBet) || minBet < 0.01) {
      newErrors.minBet = "Minimum bet must be at least 0.01 FLOW";
    }
    if (isNaN(maxBet) || maxBet < minBet) {
      newErrors.maxBet = "Maximum bet must be greater than minimum bet";
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

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    const marketData = {
      ...formData,
      endDateTime: new Date(`${formData.endDate}T${formData.endTime}`),
      creatorFee: parseFloat(formData.creatorFee),
      initialLiquidity: parseFloat(formData.initialLiquidity)
    };
    
    if (onSubmit) {
      await onSubmit(marketData);
    } else {
      // Default submission logic
      console.log("Creating market:", marketData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push("/admin");
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              stepNumber < step ? "bg-green-600 text-white" :
              stepNumber === step ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`w-12 h-0.5 mx-2 ${
                stepNumber < step ? "bg-green-600" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Market Question *</Label>
              <Input
                id="question"
                placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className={errors.question ? "border-destructive" : ""}
              />
              {errors.question && (
                <p className="text-sm text-destructive">{errors.question}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.question.length}/200 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optionA">Option A *</Label>
                <Input
                  id="optionA"
                  placeholder="Yes"
                  value={formData.optionA}
                  onChange={(e) => setFormData(prev => ({ ...prev, optionA: e.target.value }))}
                  className={errors.optionA ? "border-destructive" : ""}
                />
                {errors.optionA && (
                  <p className="text-sm text-destructive">{errors.optionA}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="optionB">Option B *</Label>
                <Input
                  id="optionB"
                  placeholder="No"
                  value={formData.optionB}
                  onChange={(e) => setFormData(prev => ({ ...prev, optionB: e.target.value }))}
                  className={errors.optionB ? "border-destructive" : ""}
                />
                {errors.optionB && (
                  <p className="text-sm text-destructive">{errors.optionB}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: MarketCategory) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center space-x-2">
                        <span>{category.emoji}</span>
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageURI">Market Image (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  id="imageURI"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageURI}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageURI: e.target.value }))}
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isBreakingNews">Breaking News</Label>
                <p className="text-xs text-muted-foreground">
                  Mark this market as breaking news for higher visibility
                </p>
              </div>
              <Switch
                id="isBreakingNews"
                checked={formData.isBreakingNews}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isBreakingNews: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Market Timeline & Resolution */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline & Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.endDate ? "border-destructive" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className={errors.endTime ? "border-destructive" : ""}
                />
              </div>
            </div>
            {(errors.endDate || errors.endTime) && (
              <p className="text-sm text-destructive">
                {errors.endDate || errors.endTime}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="resolutionSource">Resolution Source *</Label>
              <Input
                id="resolutionSource"
                placeholder="CoinGecko, Reuters, Official Government Website, etc."
                value={formData.resolutionSource}
                onChange={(e) => setFormData(prev => ({ ...prev, resolutionSource: e.target.value }))}
                className={errors.resolutionSource ? "border-destructive" : ""}
              />
              {errors.resolutionSource && (
                <p className="text-sm text-destructive">{errors.resolutionSource}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Specify the authoritative source that will be used for resolution
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Resolution Rules</Label>
              <Textarea
                id="rules"
                placeholder="Detailed rules for how this market will be resolved, including edge cases..."
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                Clear resolution criteria help prevent disputes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Market Settings */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Market Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="initialLiquidity">Initial Liquidity (FLOW) *</Label>
              <Input
                id="initialLiquidity"
                type="number"
                placeholder="1000"
                value={formData.initialLiquidity}
                onChange={(e) => setFormData(prev => ({ ...prev, initialLiquidity: e.target.value }))}
                className={errors.initialLiquidity ? "border-destructive" : ""}
              />
              {errors.initialLiquidity && (
                <p className="text-sm text-destructive">{errors.initialLiquidity}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Higher liquidity reduces price impact for traders
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBet">Minimum Bet (FLOW) *</Label>
                <Input
                  id="minBet"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1"
                  value={formData.minBet}
                  onChange={(e) => setFormData(prev => ({ ...prev, minBet: e.target.value }))}
                  className={errors.minBet ? "border-destructive" : ""}
                />
                {errors.minBet && (
                  <p className="text-sm text-destructive">{errors.minBet}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBet">Maximum Bet (FLOW) *</Label>
                <Input
                  id="maxBet"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="1000"
                  value={formData.maxBet}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBet: e.target.value }))}
                  className={errors.maxBet ? "border-destructive" : ""}
                />
                {errors.maxBet && (
                  <p className="text-sm text-destructive">{errors.maxBet}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublic">Public Market</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow anyone to discover and trade this market
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isBreakingNews">Breaking News Market</Label>
                  <p className="text-xs text-muted-foreground">
                    Feature this market prominently on the platform
                  </p>
                </div>
                <Switch
                  id="isBreakingNews"
                  checked={formData.isBreakingNews}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isBreakingNews: checked }))
                  }
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Betting Limits Guide</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Low stakes:</strong> Min: 0.1 FLOW, Max: 100 FLOW</p>
                <p>• <strong>Medium stakes:</strong> Min: 1 FLOW, Max: 1,000 FLOW</p>
                <p>• <strong>High stakes:</strong> Min: 10 FLOW, Max: 10,000 FLOW</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Market Title</h4>
                <p className="text-sm text-muted-foreground">{formData.title}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Category</h4>
                <Badge variant="outline">{formData.category}</Badge>
              </div>
              
              <div>
                <h4 className="font-semibold">Trading Period</h4>
                <p className="text-sm text-muted-foreground">
                  Ends {new Date(`${formData.endDate}T${formData.endTime}`).toLocaleString()}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Initial Liquidity</h4>
                <p className="text-sm text-muted-foreground">{formData.initialLiquidity} FLOW</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Creator Fee</h4>
                <p className="text-sm text-muted-foreground">{formData.creatorFee}%</p>
              </div>
              
              {formData.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold">Tags</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Important Notice</p>
                  <p className="text-muted-foreground">
                    Once created, market details cannot be changed. Please review all information carefully.
                    You'll need to provide the initial liquidity from your wallet.
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
          disabled={step === 1}
        >
          Back
        </Button>
        
        <div className="space-x-2">
          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Creating Market..." : "Create Market"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================
// Analytics Panel Component
// =========================

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
    avgResolutionTime: "2.3 days"
  };

  const topMarkets = [
    {
      title: "Will Bitcoin reach $100,000 by end of 2025?",
      volume: "125,430.78",
      traders: 1247,
      category: "Economics"
    },
    {
      title: "Next US Presidential Election Winner",
      volume: "98,234.56", 
      traders: 892,
      category: "Politics"
    },
    {
      title: "Will ChatGPT-5 be released in 2025?",
      volume: "76,543.21",
      traders: 634,
      category: "Technology"
    }
  ];

  const categoryStats = [
    { category: "Economics", markets: 45, volume: "1,234,567" },
    { category: "Sports", markets: 38, volume: "876,543" },
    { category: "Politics", markets: 24, volume: "654,321" },
    { category: "Technology", markets: 31, volume: "543,210" },
    { category: "Entertainment", markets: 18, volume: "321,098" }
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analyticsData.totalMarkets}</div>
            <div className="text-sm text-muted-foreground">Total Markets</div>
            <div className="text-xs text-green-600">+12 this week</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analyticsData.totalVolume}</div>
            <div className="text-sm text-muted-foreground">Total Volume (FLOW)</div>
            <div className="text-xs text-green-600">+15.3% vs last week</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analyticsData.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
            <div className="text-xs text-green-600">+234 new users</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analyticsData.resolutionAccuracy}%</div>
            <div className="text-sm text-muted-foreground">Resolution Accuracy</div>
            <div className="text-xs text-green-600">+0.2% vs last month</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Markets */}
      <Card>
        <CardHeader>
          <CardTitle>Top Markets by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topMarkets.map((market, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium line-clamp-1">{market.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <Badge variant="outline">{market.category}</Badge>
                    <span>{market.traders} traders</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{market.volume} FLOW</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Markets by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{stat.category}</span>
                  <Badge variant="secondary">{stat.markets} markets</Badge>
                </div>
                <span className="font-medium">{stat.volume} FLOW</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}