"use client";

// src/components/market/countdown-timer.tsx

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  endTime: number;
  compact?: boolean;
  showIcon?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ endTime, compact = false, showIcon = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime - Date.now();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds, total: difference });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`flex items-center space-x-1 ${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>
        {showIcon && <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />}
        <span>Loading...</span>
      </div>
    );
  }

  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center space-x-1 ${compact ? "text-xs" : "text-sm"} text-red-600`}>
        <AlertTriangle className={compact ? "h-3 w-3" : "h-4 w-4"} />
        <span>Ended</span>
      </div>
    );
  }

  const formatTime = () => {
    const { days, hours, minutes, seconds } = timeLeft;
    
    if (compact) {
      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    } else {
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
  };

  const getUrgencyColor = () => {
    const { total } = timeLeft;
    const hoursLeft = total / (1000 * 60 * 60);
    
    if (hoursLeft < 1) {
      return "text-red-600";
    } else if (hoursLeft < 24) {
      return "text-yellow-600";
    } else {
      return "text-muted-foreground";
    }
  };

  const getUrgencyIcon = () => {
    const { total } = timeLeft;
    const hoursLeft = total / (1000 * 60 * 60);
    
    if (hoursLeft < 1) {
      return <AlertTriangle className={compact ? "h-3 w-3" : "h-4 w-4"} />;
    } else {
      return <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />;
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${compact ? "text-xs" : "text-sm"} ${getUrgencyColor()}`}>
      {showIcon && getUrgencyIcon()}
      <span className="tabular-nums">{formatTime()}</span>
    </div>
  );
}