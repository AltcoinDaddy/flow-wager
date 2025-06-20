"use client";

// src/components/market/market-filters.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  RotateCcw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { MarketCategory, MarketStatus } from "@/types/market";

const categories: { value: MarketCategory | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Categories", color: "bg-gray-100" },
  { value: MarketCategory.Sports, label: "Sports", color: "bg-blue-100" },
  { value: MarketCategory.Politics, label: "Politics", color: "bg-red-100" },
//   { value: "Entertainment", label: "Entertainment", color: "bg-purple-100" },
//   { value: "Technology", label: "Technology", color: "bg-green-100" },
//   { value: "Economics", label: "Economics", color: "bg-yellow-100" },
//   { value: "Science", label: "Science", color: "bg-indigo-100" },
//   { value: "Other", label: "Other", color: "bg-gray-100" }
];

const statuses: { value: MarketStatus | "all"; label: string; icon: any; color: string }[] = [
  { value: "all", label: "All Statuses", icon: TrendingUp, color: "text-gray-600" },
  { value: MarketStatus.Active, label: "Active", icon: TrendingUp, color: "text-green-600" },
  { value: MarketStatus.Closed, label: "Closed", icon: Clock, color: "text-yellow-600" },
  { value: MarketStatus.Resolved, label: "Resolved", icon: CheckCircle, color: "text-blue-600" },
  { value: MarketStatus.Cancelled, label: "Cancelled", icon: XCircle, color: "text-red-600" }
];

interface MarketFiltersProps {
  selectedCategory: MarketCategory | "all";
  selectedStatus: MarketStatus | "all";
  onCategoryChange: (category: MarketCategory | "all") => void;
  onStatusChange: (status: MarketStatus | "all") => void;
  onReset: () => void;
}

export function MarketFilters({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  onReset
}: MarketFiltersProps) {
  const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Category</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Status</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {statuses.map((status) => {
              const Icon = status.icon;
              const isSelected = selectedStatus === status.value;
              
              return (
                <button
                  key={status.value}
                  onClick={() => onStatusChange(status.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : status.color}`} />
                    <span className="text-sm font-medium">{status.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Volume Range</Label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select volume range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Volumes</SelectItem>
              <SelectItem value="low">Under 1K FLOW</SelectItem>
              <SelectItem value="medium">1K - 10K FLOW</SelectItem>
              <SelectItem value="high">10K - 100K FLOW</SelectItem>
              <SelectItem value="very-high">Over 100K FLOW</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Ending Time</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="ending-soon" />
              <Label htmlFor="ending-soon" className="text-sm">
                Ending within 24 hours
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="ending-week" />
              <Label htmlFor="ending-week" className="text-sm">
                Ending within 1 week
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="ending-month" />
              <Label htmlFor="ending-month" className="text-sm">
                Ending within 1 month
              </Label>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Advanced</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="has-image" />
              <Label htmlFor="has-image" className="text-sm">
                Has image
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="high-volume" />
              <Label htmlFor="high-volume" className="text-sm">
                High trading volume
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="new-markets" />
              <Label htmlFor="new-markets" className="text-sm">
                Created in last 7 days
              </Label>
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Popular Tags</Label>
          <div className="flex flex-wrap gap-2">
            {["crypto", "bitcoin", "election", "ai", "sports", "nfl", "tech", "earnings"].map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}