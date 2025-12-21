"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageCircle, Clock, CheckCircle, Send } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Question {
  id: string
  title: string
  content: string
  author: string
  authorAvatar: string
  category: string
  tags: string[]
  upvotes: number
  answers: number
  status: "open" | "answered"
  timeAgo: string
}

interface QuestionDetailDialogProps {
  question: Question
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock answers
const mockAnswers = [
  {
    id: "a1",
    author: "Prof. Amit Shah",
    authorAvatar: "AS",
    content:
      "You can access the library database by visiting library.college.edu and logging in with your college credentials. Make sure you're connected to the VPN if accessing from off-campus.",
    upvotes: 12,
    timeAgo: "1 hour ago",
    isAccepted: true,
  },
  {
    id: "a2",
    author: "Meera Joshi",
    authorAvatar: "MJ",
    content:
      "I had the same issue last week. Download the FortiClient VPN app, install it, and use the credentials sent to your college email. Then you can access all resources.",
    upvotes: 8,
    timeAgo: "2 hours ago",
    isAccepted: false,
  },
]

export function QuestionDetailDialog({ question, open, onOpenChange }: QuestionDetailDialogProps) {
  const [answer, setAnswer] = useState("")

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, submit answer to backend
    setAnswer("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl text-white text-balance pr-4">{question.title}</DialogTitle>
            <Badge
              variant="outline"
              className={
                question.status === "answered"
                  ? "border-green-500/30 text-green-500 bg-green-500/10 flex-shrink-0"
                  : "border-primary/30 text-primary bg-primary/10 flex-shrink-0"
              }
            >
              {question.status === "answered" ? "Answered" : "Open"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{question.authorAvatar}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{question.author}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{question.timeAgo}</span>
                  <span>•</span>
                  <Badge variant="outline" className="border-secondary text-foreground text-xs">
                    {question.category}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{question.content}</p>

            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((tag, index) => (
                <span key={index} className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {question.upvotes}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span>{question.answers} answers</span>
              </div>
            </div>
          </div>

          <Separator className="bg-secondary" />

          {/* Answers Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">{mockAnswers.length} Answers</h3>

            {mockAnswers.map((ans) => (
              <div
                key={ans.id}
                className={`p-4 rounded-xl ${
                  ans.isAccepted ? "bg-green-500/5 border border-green-500/20" : "bg-secondary/50"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-accent">{ans.authorAvatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{ans.author}</p>
                      {ans.isAccepted && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{ans.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{ans.content}</p>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-accent hover:bg-accent/10 h-8"
                  >
                    <ThumbsUp className="w-3 h-3 mr-2" />
                    {ans.upvotes}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="bg-secondary" />

          {/* Answer Form */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Your Answer</h3>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <Textarea
                placeholder="Share your knowledge and help others..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="bg-secondary border-secondary text-white placeholder:text-muted-foreground min-h-[100px]"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={!answer.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post Answer
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
