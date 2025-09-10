// src/components/comments/comment-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  initialValue = "",
  submitLabel = "Comment",
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/30 rounded-xl p-4 border border-gray-800/50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] bg-gray-800/20 border-gray-700/50 text-white placeholder:text-gray-400 focus:border-[#9b87f5]/50 focus:ring-[#9b87f5]/20"
          disabled={isSubmitting}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            size="sm"
            className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white border-0 shadow-lg"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white bg-gray-800/50"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
