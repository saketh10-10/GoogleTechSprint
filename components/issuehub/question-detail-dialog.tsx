"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageCircle, Clock, CheckCircle, Send, Loader2, ChevronDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PostWithDetails, AnswerWithDetails } from "@/lib/types"
import { createAnswer, upvoteAnswer, getAnswersForQuestion } from "@/lib/issuehub-service"
import { getCurrentUser } from "@/lib/auth-service"

interface QuestionDetailDialogProps {
  question: PostWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionDetailDialog({ question, open, onOpenChange }: QuestionDetailDialogProps) {
  const [answers, setAnswers] = useState<AnswerWithDetails[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(5);

  // Requirement 6: Fetch answers ONLY when a question is opened
  useEffect(() => {
    if (open && question.id) {
      fetchAnswers(5);
    } else {
      setAnswers([]);
      setLimit(5);
    }
  }, [open, question.id]);

  const fetchAnswers = async (limitCount: number) => {
    try {
      setLoading(true);
      const fetchedAnswers = await getAnswersForQuestion(question.id, limitCount);
      setAnswers(fetchedAnswers);
      // Simple check for more answers - if we got exactly what we asked for, there might be more
      setHasMore(fetchedAnswers.length === limitCount);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreAnswers = () => {
    const newLimit = limit + 10;
    setLimit(newLimit);
    fetchAnswers(newLimit);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || isSubmitting) return;

    const user = getCurrentUser();
    if (!user) {
      alert("You must be logged in to answer questions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAnswer(question.id, newAnswer.trim());

      if (result.success) {
        setNewAnswer("");
        // Alert and refresh
        fetchAnswers(limit);
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
    const user = getCurrentUser();
    if (!user) {
      alert("You must be logged in to upvote.");
      return;
    }

    try {
      // Optimistic upvote
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

      await upvoteAnswer(answerId);
    } catch (error: any) {
      console.error('Error upvoting answer:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{question.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className={`h-8 w-8 flex items-center justify-center rounded-md ${question.userUpvoted ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                <ThumbsUp className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{question.upvotes}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{question.author.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{question.author.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-secondary text-foreground text-xs">{question.category}</Badge>
                  {question.status === "answered" && <Badge className="bg-green-500/10 text-green-500 border-none"><CheckCircle className="w-3 h-3 mr-1" /> Answered</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{question.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((tag, index) => (
                  <span key={index} className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">#{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-secondary" />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-foreground">Answers</h3>
            </div>

            {loading && answers.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading answers...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {answers.map((answer) => (
                  <div key={answer.id} className="flex items-start gap-4 group">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 hover:bg-primary/10 ${answer.userUpvoted ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => handleUpvote(answer.id, answer.userUpvoted || false)}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-foreground">{answer.upvotes}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{answer.author.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{answer.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">• {new Date(answer.createdAt).toLocaleDateString()}</span>
                        {answer.isAccepted && (
                          <Badge className="bg-green-500/10 text-green-500 border-none text-[10px] h-5"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answer.content}</p>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <Button variant="ghost" className="w-full text-primary hover:bg-primary/5 text-xs h-8" onClick={loadMoreAnswers}>
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ChevronDown className="w-3 h-3 mr-2" />}
                    Load More Answers
                  </Button>
                )}

                {!loading && answers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No answers yet. Share your knowledge!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-secondary" />

          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Your Answer</h3>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <Textarea
                placeholder="Write your answer here..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="bg-secondary border-secondary text-white placeholder:text-muted-foreground min-h-[100px]"
                required
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={!newAnswer.trim() || isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</> : <><Send className="w-4 h-4 mr-2" /> Post Answer</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
