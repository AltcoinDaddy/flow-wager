"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  endTime: number;
  showIcon?: boolean;
}

function pad(num: number) {
  return num.toString().padStart(2, "0");
}

export function CountdownTimer({ endTime, showIcon = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const update = () => {
      setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        {showIcon && <Clock className="h-4 w-4" />}
        <span>Loading...</span>
      </div>
    );
  }

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center space-x-1 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span>Ended</span>
      </div>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center space-x-1 text-sm tabular-nums text-center text-white justify-center-safe">
      {showIcon && <Clock className="h-4 w-4" />}
      <span>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}