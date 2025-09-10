// src/lib/comments-service.ts
import { supabase } from "@/utils/supabase/client";

export interface Comment {
  id: number;
  content: string;
  user_address: string;
  market_id?: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
  edited: boolean;
  likes_count: number;
  dislikes_count: number;
  users?: {
    username: string;
    display_name: string;
    profile_image_url?: string;
  };
  user?: {
    username: string;
    display_name: string;
    profile_image_url?: string;
  };
  replies?: Comment[];
  user_reaction?: "like" | "dislike" | null;
}

export interface CommentReaction {
  id: number;
  comment_id: number;
  user_address: string;
  reaction_type: "like" | "dislike";
  created_at: string;
}

export class CommentsService {
  // Get comments for a market with user data and reactions - FIXED VERSION
  static async getMarketComments(
    marketId: number,
    userAddress?: string,
  ): Promise<Comment[]> {
    try {
      console.log(`Fetching comments for market ${marketId}`);

      // Get main comments (not replies) - Use * to get all fields
      const { data: comments, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          users!comments_user_address_fkey (
            username,
            display_name,
            profile_image_url
          )
        `,
        )
        .eq("market_id", marketId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      console.log("Raw comments from DB:", comments);

      // Get replies and user reactions for each comment
      const commentsWithReplies = await Promise.all(
        (comments || []).map(async (comment) => {
          const replies = await this.getCommentReplies(comment.id, userAddress);
          const userReaction = userAddress
            ? await this.getUserReaction(comment.id, userAddress)
            : null;

          const processedComment = {
            ...comment,
            user: comment.users,
            replies,
            user_reaction: userReaction,
          };

          console.log(`Processed comment ${comment.id}:`, {
            likes_count: processedComment.likes_count,
            dislikes_count: processedComment.dislikes_count,
            user_reaction: processedComment.user_reaction,
          });

          return processedComment;
        }),
      );

      console.log("Final comments with replies:", commentsWithReplies);
      return commentsWithReplies;
    } catch (error) {
      console.error("Error fetching market comments:", error);
      return [];
    }
  }

  // Get replies for a specific comment
  static async getCommentReplies(
    commentId: number,
    userAddress?: string,
  ): Promise<Comment[]> {
    try {
      const { data: replies, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          users!comments_user_address_fkey (
            username,
            display_name,
            profile_image_url
          )
        `,
        )
        .eq("parent_id", commentId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Add user reactions for replies
      const repliesWithReactions = await Promise.all(
        (replies || []).map(async (reply) => {
          const userReaction = userAddress
            ? await this.getUserReaction(reply.id, userAddress)
            : null;

          return {
            ...reply,
            user: reply.users,
            user_reaction: userReaction,
          };
        }),
      );

      return repliesWithReactions;
    } catch (error) {
      console.error("Error fetching comment replies:", error);
      return [];
    }
  }

  // Add a new comment
  static async addComment({
    content,
    userAddress,
    marketId,
    parentId,
  }: {
    content: string;
    userAddress: string;
    marketId?: number;
    parentId?: number;
  }): Promise<Comment | null> {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          content: content.trim(),
          user_address: userAddress,
          market_id: marketId,
          parent_id: parentId,
        })
        .select(
          `
          *,
          users!comments_user_address_fkey (
            username,
            display_name,
            profile_image_url
          )
        `,
        );

      if (error) throw error;

      // Get the first inserted comment
      const insertedComment = data?.[0];
      if (!insertedComment) throw new Error("Failed to insert comment");

      return {
        ...insertedComment,
        user: insertedComment.users,
        replies: [],
        user_reaction: null,
      };
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Update a comment
  static async updateComment(
    commentId: number,
    content: string,
    userAddress: string,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("comments")
        .update({
          content: content.trim(),
          edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_address", userAddress);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating comment:", error);
      return false;
    }
  }

  // Delete a comment
  // In src/lib/comments-service.ts - Update the deleteComment method
  static async deleteComment(
    commentId: number,
    userAddress: string,
  ): Promise<boolean> {
    try {
      console.log(
        `Attempting to delete comment ${commentId} by user ${userAddress}`,
      );

      // First check if the comment exists and belongs to the user
      const { data: existingComment, error: fetchError } = await supabase
        .from("comments")
        .select("id, user_address")
        .eq("id", commentId)
        .eq("user_address", userAddress);

      if (fetchError) {
        console.error("Error checking comment ownership:", fetchError);
        return false;
      }

      if (!existingComment || existingComment.length === 0) {
        console.error("Comment not found or user not authorized");
        return false;
      }

      // Delete associated reactions first (if any)
      const { error: reactionsDeleteError } = await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", commentId);

      if (reactionsDeleteError) {
        console.error(
          "Error deleting comment reactions:",
          reactionsDeleteError,
        );
        // Don't return false here, continue with comment deletion
      }

      // Delete the comment
      const { error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_address", userAddress);

      if (deleteError) {
        console.error("Error deleting comment:", deleteError);
        return false;
      }

      console.log("Comment deleted successfully");
      return true;
    } catch (error) {
      console.error("Exception deleting comment:", error);
      return false;
    }
  }

  // React to a comment (like/dislike)
  static async reactToComment(
    commentId: number,
    userAddress: string,
    reactionType: "like" | "dislike",
  ): Promise<boolean> {
    try {
      console.log(
        `Reacting to comment ${commentId} with ${reactionType} for user ${userAddress}`,
      );

      // Check if user already has a reaction
      const { data: existingReactions, error: fetchError } = await supabase
        .from("comment_reactions")
        .select("*")
        .eq("comment_id", commentId)
        .eq("user_address", userAddress);

      if (fetchError) {
        console.error("Error fetching existing reaction:", fetchError);
        return false;
      }

      const existingReaction =
        existingReactions && existingReactions.length > 0
          ? existingReactions[0]
          : null;

      console.log("Existing reaction:", existingReaction);

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if it's the same
          console.log("Removing existing reaction");
          const { error } = await supabase
            .from("comment_reactions")
            .delete()
            .eq("id", existingReaction.id);

          if (error) {
            console.error("Error deleting reaction:", error);
            return false;
          }
        } else {
          // Update reaction if it's different
          console.log("Updating existing reaction");
          const { error } = await supabase
            .from("comment_reactions")
            .update({ reaction_type: reactionType })
            .eq("id", existingReaction.id);

          if (error) {
            console.error("Error updating reaction:", error);
            return false;
          }
        }
      } else {
        // Add new reaction
        console.log("Adding new reaction");
        const { error } = await supabase.from("comment_reactions").insert({
          comment_id: commentId,
          user_address: userAddress,
          reaction_type: reactionType,
        });

        if (error) {
          console.error("Error inserting new reaction:", error);
          return false;
        }
      }

      // Update comment counts and wait for completion
      console.log("Updating comment counts");
      await this.updateCommentReactionCounts(commentId);

      console.log("Reaction completed successfully");
      return true;
    } catch (error) {
      console.error("Error reacting to comment:", error);
      return false;
    }
  }

  // Get user's reaction to a comment
  static async getUserReaction(
    commentId: number,
    userAddress: string,
  ): Promise<"like" | "dislike" | null> {
    try {
      const { data, error } = await supabase
        .from("comment_reactions")
        .select("reaction_type")
        .eq("comment_id", commentId)
        .eq("user_address", userAddress);

      if (error) {
        console.error("Error fetching user reaction:", error);
        return null;
      }

      // Return the first result or null
      return data && data.length > 0
        ? (data[0].reaction_type as "like" | "dislike")
        : null;
    } catch (error) {
      console.error("Error in getUserReaction:", error);
      return null;
    }
  }

  // Update reaction counts for a comment - IMPROVED VERSION
  static async updateCommentReactionCounts(commentId: number): Promise<void> {
    try {
      console.log(`Updating reaction counts for comment ${commentId}`);

      // Count likes and dislikes
      const { data: reactions, error } = await supabase
        .from("comment_reactions")
        .select("reaction_type")
        .eq("comment_id", commentId);

      if (error) {
        console.error("Error fetching reactions for count:", error);
        return;
      }

      const likes =
        reactions?.filter((r) => r.reaction_type === "like").length || 0;
      const dislikes =
        reactions?.filter((r) => r.reaction_type === "dislike").length || 0;

      console.log(
        `Calculated counts for comment ${commentId}: likes=${likes}, dislikes=${dislikes}`,
      );

      // Update comment with new counts and return updated data
      const { data: updatedComment, error: updateError } = await supabase
        .from("comments")
        .update({
          likes_count: likes,
          dislikes_count: dislikes,
        })
        .eq("id", commentId)
        .select("id, likes_count, dislikes_count");

      if (updateError) {
        console.error("Error updating comment counts:", updateError);
        return;
      }

      console.log("Successfully updated comment counts:", updatedComment);
    } catch (error) {
      console.error("Error updating comment reaction counts:", error);
    }
  }

  // Get comment count for a market
  static async getMarketCommentCount(marketId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("market_id", marketId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting comment count:", error);
      return 0;
    }
  }
}
