import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Clock,
  Shield,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";
import { useForteActions } from "@/hooks/useForteActions";

interface ForteSetupPromptProps {
  onSetupComplete?: () => void;
  variant?: "card" | "inline" | "banner";
  className?: string;
}

export function ForteSetupPrompt({
  onSetupComplete,
  variant = "card",
  className = "",
}: ForteSetupPromptProps) {
  const { isInitialized, isLoading, initialize, isAvailable, error } =
    useForteActions();

  const handleSetup = async () => {
    await initialize();
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  // Don't show if not available
  if (!isAvailable) {
    return null;
  }

  // Don't show if already initialized
  if (isInitialized) {
    return null;
  }

  const features = [
    {
      icon: <Bot className="h-4 w-4" />,
      title: "Conditional Betting",
      description: "Set conditions and let your bets execute automatically",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: "Scheduled Actions",
      description: "Time-based betting and automated strategies",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Risk Management",
      description: "Built-in stop-loss, slippage protection, and limits",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Advanced Analytics",
      description: "Track performance and optimize your strategies",
    },
  ];

  if (variant === "banner") {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                🚀 Unlock Automation Features
              </h3>
              <p className="text-sm text-gray-600">
                Set up conditional betting, scheduling, and risk management tools
              </p>
            </div>
          </div>
          <Button
            onClick={handleSetup}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Setting Up...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Enable Now
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">
            Automation features available
          </span>
          <Badge variant="secondary" className="text-xs">
            Optional
          </Badge>
        </div>
        <Button
          onClick={handleSetup}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? (
            <Settings className="h-3 w-3 animate-spin" />
          ) : (
            "Set Up"
          )}
        </Button>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`max-w-2xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Forte Automation</CardTitle>
              <CardDescription>
                Professional-grade betting automation tools
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1 bg-white rounded">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens when you enable?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Creates secure automation resources in your account</li>
            <li>• Unlocks conditional and scheduled betting features</li>
            <li>• Adds risk management tools to your betting interface</li>
            <li>• No additional fees - pay only for transactions you execute</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium">100% Optional</span> - Regular betting works without this
        </div>
        <Button
          onClick={handleSetup}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Setting Up...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Enable Automation
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Status component to show current Forte Actions state
export function ForteStatus({ className = "" }: { className?: string }) {
  const { isInitialized, isLoading, isAvailable, scheduledTransactions } =
    useForteActions();

  if (!isAvailable) {
    return null;
  }

  if (isLoading) {
    return (
      <Badge variant="outline" className={`${className}`}>
        <Settings className="h-3 w-3 mr-1 animate-spin" />
        Setting up...
      </Badge>
    );
  }

  if (!isInitialized) {
    return (
      <Badge variant="outline" className={`text-gray-600 ${className}`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        Automation available
      </Badge>
    );
  }

  const activeCount = scheduledTransactions.filter(
    (tx) => tx.status === "PENDING"
  ).length;

  return (
    <Badge variant="outline" className={`text-green-600 border-green-200 ${className}`}>
      <CheckCircle className="h-3 w-3 mr-1" />
      Active
      {activeCount > 0 && (
        <span className="ml-1 px-1 py-0.5 text-xs bg-green-100 rounded">
          {activeCount}
        </span>
      )}
    </Badge>
  );
}

export default ForteSetupPrompt;
