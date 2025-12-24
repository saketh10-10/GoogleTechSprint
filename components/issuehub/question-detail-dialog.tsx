"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageCircle, Clock, CheckCircle, Send, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PostWithDetails, AnswerWithDetails } from "@/lib/types"
import { createAnswer, upvoteAnswer } from "@/lib/issuehub-service"
import { getAuth } from "firebase/auth"

interface QuestionDetailDialogProps {
  question: PostWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionDetailDialog({ question, open, onOpenChange }: QuestionDetailDialogProps) {
  const [answers, setAnswers] = useState<AnswerWithDetails[]>(question.answers || []);
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load answers when dialog opens
  useEffect(() => {
    if (open && question.id) {
      setLoading(true);
      // Initial answers are passed from parent
      setAnswers(question.answers || []);
      setLoading(false);
    }
  }, [open, question.id, question.answers]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || isSubmitting) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to answer questions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAnswer(question.id, newAnswer.trim());

      if (result.success) {
        setNewAnswer("");
        alert("Answer posted successfully!");
        // The parent component will refresh the answers
      } else {
        alert(result.message || "Failed to post answer.");
      }
    } catch (error) {
      console.error('Error posting answer:', error);
      alert("Failed to post answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (answerId: string, currentUpvoted: boolean) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to upvote.");
      return;
    }

    try {
      const result = await upvoteAnswer(answerId);

      if (result.success) {
        // Update local state optimistically
        setAnswers(prevAnswers =>
          prevAnswers.map(answer =>
            answer.id === answerId
              ? {
                  ...answer,
                  upvotes: currentUpvoted ? answer.upvotes - 1 : answer.upvotes + 1,
                  userUpvoted: !currentUpvoted
                }
              : answer
          )
        );
      } else {
        alert(result.message || "Failed to upvote.");
      }
    } catch (error: any) {
      console.error('Error upvoting answer:', error);
      if (error.message?.includes('already upvoted')) {
        alert('You have already upvoted this answer.');
      } else {
        alert('Failed to upvote. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{question.title}</DialogTitle>
        </DialogHeader>

        {/* Question Content */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            {/* Question Vote Section */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 hover:bg-primary/10 ${
                  question.userUpvoted
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">
                {question.upvotes}
              </span>
            </div>

            {/* Question Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {question.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {question.author.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-secondary text-foreground text-xs"
                  >
                    {question.category}
                  </Badge>
                  {question.status === "answered" && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {question.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-secondary" />

          {/* Answers Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-foreground">
                Answers ({answers.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading answers...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {answers.map((answer) => (
                  <div key={answer.id} className="flex items-start gap-4">
                    {/* Answer Vote Section */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 hover:bg-primary/10 ${
                          answer.userUpvoted
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                        onClick={() => handleUpvote(answer.id, answer.userUpvoted || false)}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-foreground">
                        {answer.upvotes}
                      </span>
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {answer.author.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {answer.author.name}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                        </div>
                        {answer.isAccepted && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accepted Answer
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {answer.content}
                      </p>
                    </div>
                  </div>
                ))}

                {answers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No answers yet. Be the first to help!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-secondary" />

          {/* Add Answer Section */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Your Answer
            </h3>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <Textarea
                placeholder="Share your knowledge and help others..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="bg-secondary border-secondary text-white placeholder:text-muted-foreground min-h-[120px]"
                required
                disabled={isSubmitting}
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-secondary hover:bg-secondary bg-transparent"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={!newAnswer.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Answer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
