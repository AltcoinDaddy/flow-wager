// src/components/comments/comments-section.tsx
"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Comment, CommentsService } from "@/lib/comments-service";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { toast } from "sonner";

interface CommentsSectionProps {
  marketId: number;
  marketTitle?: string;
  currentUserAddress?: string;
}

export function CommentsSection({
  marketId,
  marketTitle,
  currentUserAddress,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const [commentsData, count] = await Promise.all([
        CommentsService.getMarketComments(marketId, currentUserAddress),
        CommentsService.getMarketCommentCount(marketId),
      ]);

      setComments(commentsData);
      setCommentCount(count);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [marketId, currentUserAddress]);

  const handleAddComment = async (content: string) => {
    if (!currentUserAddress) {
      toast.error("Please connect your wallet to comment");
      return;
    }

    try {
      await CommentsService.addComment({
        content,
        userAddress: currentUserAddress,
        marketId,
      });

      setShowCommentForm(false);
      fetchComments();
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
      throw error;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-[#9b87f5]" />
            Discussion ({commentCount})
          </CardTitle>

          {currentUserAddress && !showCommentForm && (
            <Button
              size="sm"
              onClick={() => setShowCommentForm(true)}
              className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white border-0 shadow-lg hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {showCommentForm && (
          <CommentForm
            onSubmit={handleAddComment}
            onCancel={() => setShowCommentForm(false)}
            placeholder={`Share your thoughts about ${marketTitle || "this market"}...`}
          />
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9b87f5] mx-auto mb-4"></div>
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
            {!currentUserAddress && (
              <p className="text-xs mt-4 text-gray-500">
                Connect your wallet to join the discussion
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserAddress={currentUserAddress}
                onUpdate={fetchComments}
              />
            ))}
          </div>
        )}

        {!currentUserAddress && comments.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/30 rounded-xl border border-gray-800/50">
            <p className="text-center text-gray-400 text-sm">
              Connect your wallet to join the discussion
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
