"use client";

// src/app/admin/create/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateMarketForm } from "@/components/admin/create/create-market-form";
import { 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  TrendingUp
} from "lucide-react";

// Mock recent market creation stats
const creationStats = {
  marketsCreatedToday: 5,
  marketsCreatedThisWeek: 23,
  averageVolume: 12456.78,
  successRate: 94.2,
  totalCreators: 89
};

export default function AdminCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [createdMarketId, setCreatedMarketId] = useState<number | null>(null);

  const handleMarketSubmission = async (marketData: any) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call to create market
      console.log("Creating market with data:", marketData);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful creation
      const newMarketId = Math.floor(Math.random() * 1000) + 100;
      setCreatedMarketId(newMarketId);
      setCreationSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        router.push(`/markets/${newMarketId}`);
      }, 2000);
      
    } catch (error) {
      console.error("Failed to create market:", error);
      alert("Failed to create market. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (creationSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Market Created Successfully!</h1>
              <p className="text-muted-foreground mb-6">
                Your market has been created and is now live on the platform.
              </p>
              
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm font-medium">Market ID: #{createdMarketId}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href={`/markets/${createdMarketId}`}>
                    View Market
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    Back to Admin
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/create">
                    Create Another
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Create New Market</h1>
            <p className="text-muted-foreground">
              Create a new prediction market for users to trade on
            </p>
          </div>
        </div>
        
        <Badge variant="secondary" className="hidden sm:flex">
          Admin Panel
        </Badge>
      </div>

      {/* Creation Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{creationStats.marketsCreatedToday}</div>
              <div className="text-xs text-muted-foreground">Created Today</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{creationStats.marketsCreatedThisWeek}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{(creationStats.averageVolume / 1000).toFixed(1)}K</div>
              <div className="text-xs text-muted-foreground">Avg Volume</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{creationStats.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{creationStats.totalCreators}</div>
              <div className="text-xs text-muted-foreground">Total Creators</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Market Creation Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-700">✅ Best Practices</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Use clear, unambiguous language</li>
                <li>• Set realistic end dates and resolution criteria</li>
                <li>• Choose appropriate betting limits</li>
                <li>• Include reliable data sources</li>
                <li>• Add relevant tags for discoverability</li>
                <li>• Use high-quality images when possible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-red-700">❌ Avoid</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Subjective or opinion-based questions</li>
                <li>• Markets that could influence outcomes</li>
                <li>• Illegal, harmful, or inappropriate content</li>
                <li>• Extremely short timeframes (&lt;1 hour)</li>
                <li>• Markets without clear resolution criteria</li>
                <li>• Duplicate or very similar existing markets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Market Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateMarketForm 
            onSubmit={handleMarketSubmission}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Loading State */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Creating Market...</h3>
              <p className="text-muted-foreground">
                Deploying smart contract and setting up market infrastructure
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}