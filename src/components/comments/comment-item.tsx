
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  HeartOff,
  MessageCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Comment, CommentsService } from "@/lib/comments-service";
import { toast } from "sonner";
import { CommentForm } from "./comment-form";

interface CommentItemProps {
  comment: Comment;
  currentUserAddress?: string;
  onUpdate: () => void;
  level?: number;
}

export function CommentItem({
  comment,
  currentUserAddress,
  onUpdate,
  level = 0,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnComment = currentUserAddress === comment.user_address;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReaction = async (type: "like" | "dislike") => {
    if (!currentUserAddress || isLiking) return;

    setIsLiking(true);
    try {
      console.log(`Attempting to ${type} comment ${comment.id}`);

      const success = await CommentsService.reactToComment(
        comment.id,
        currentUserAddress,
        type,
      );

      if (success) {
        console.log(`Successfully ${type}d comment, refreshing...`);
        // Add a small delay to ensure database is updated
        setTimeout(() => {
          onUpdate();
        }, 300);
      } else {
        toast.error("Failed to react to comment");
      }
    } catch (error) {
      console.error("Error in handleReaction:", error);
      toast.error("Failed to react to comment");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserAddress || isDeleting) return;

    setIsDeleting(true);
    try {
      console.log(`Attempting to delete comment ${comment.id}`);

      const success = await CommentsService.deleteComment(
        comment.id,
        currentUserAddress,
      );

      if (success) {
        toast.success("Comment deleted");
        onUpdate();
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    onUpdate();
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div
      className={`${level > 0 ? "ml-2 sm:ml-8 border-l-2 border-gray-800/50 pl-2 sm:pl-4" : ""}`}
    >
      <div className="flex gap-2 sm:gap-3 group p-3 sm:p-4 rounded-xl bg-gray-800/20 border border-gray-800/30 hover:border-gray-700/50 transition-all duration-200">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage
            src={
              comment.user?.profile_image_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_address}`
            }
          />
          <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5] font-bold text-xs sm:text-sm">
            {comment.user?.display_name?.[0] ||
              comment.user?.username?.[0] ||
              comment.user_address?.slice(2, 4).toUpperCase() ||
              "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm truncate max-w-[120px] sm:max-w-none">
              {comment.user?.display_name ||
                comment.user?.username ||
                `${comment.user_address?.slice(0, 6)}...${comment.user_address?.slice(-4)}`}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDistanceToNow(new Date(comment.created_at))} ago
              {comment.edited && " (edited)"}
            </span>
          </div>

          {isEditing ? (
            <CommentForm
              initialValue={comment.content}
              onSubmit={async (content) => {
                if (!currentUserAddress) return;
                const success = await CommentsService.updateComment(
                  comment.id,
                  content,
                  currentUserAddress,
                );
                if (success) {
                  handleEditSuccess();
                  toast.success("Comment updated");
                } else {
                  toast.error("Failed to update comment");
                }
              }}
              onCancel={() => setIsEditing(false)}
              submitLabel="Update"
            />
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed break-words">
              {comment.content}
            </p>
          )}

          {/* Mobile-optimized action buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("like")}
              disabled={isLiking}
              className={`h-6 sm:h-7 px-1.5 sm:px-2 text-xs hover:bg-gray-700/50 ${
                comment.user_reaction === "like"
                  ? "text-red-400 hover:text-red-300"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Heart
                className={`h-3 w-3 mr-1 ${
                  comment.user_reaction === "like" ? "fill-current" : ""
                }`}
              />
              <span className="hidden sm:inline">{comment.likes_count}</span>
              <span className="sm:hidden">{comment.likes_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("dislike")}
              disabled={isLiking}
              className={`h-6 sm:h-7 px-1.5 sm:px-2 text-xs hover:bg-gray-700/50 ${
                comment.user_reaction === "dislike"
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <HeartOff
                className={`h-3 w-3 mr-1 ${
                  comment.user_reaction === "dislike" ? "fill-current" : ""
                }`}
              />
              <span>{comment.dislikes_count}</span>
            </Button>

            {currentUserAddress && level < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(true)}
                className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50"
              >
                <Reply className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Reply</span>
              </Button>
            )}

            {isOwnComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1A1F2C] border-gray-700">
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700/50"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                placeholder="Write a reply..."
                onSubmit={async (content) => {
                  if (!currentUserAddress) return;
                  await CommentsService.addComment({
                    content,
                    userAddress: currentUserAddress,
                    marketId: comment.market_id,
                    parentId: comment.id,
                  });
                  handleReplySuccess();
                  toast.success("Reply added!");
                }}
                onCancel={() => setIsReplying(false)}
                submitLabel="Reply"
              />
            </div>
          )}

          {hasReplies && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-6 sm:h-7 px-0 text-xs text-gray-400 hover:text-[#9b87f5]"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {showReplies ? "Hide" : "Show"} {comment.replies!.length}{" "}
                {comment.replies!.length === 1 ? "reply" : "replies"}
              </Button>

              {showReplies && (
                <div className="mt-3 space-y-3 sm:space-y-4">
                  {comment.replies!.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserAddress={currentUserAddress}
                      onUpdate={onUpdate}
                      level={level + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
