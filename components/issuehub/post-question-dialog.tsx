"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"
import { createQuestion } from "@/lib/issuehub-service"
import { getAuth } from "firebase/auth"

interface PostQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPost: (questionData: { title: string; description: string; tags: string[] }) => Promise<{ success: boolean; similarQuestions?: any[]; message?: string }>
}

const categories = ["Academics", "Infrastructure", "Library", "Clubs", "Transport", "Financial", "Other"]

export function PostQuestionDialog({ open, onOpenChange, onPost }: PostQuestionDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [similarQuestions, setSimilarQuestions] = useState<any[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      alert("Authentication Required: You must be logged in to post questions.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onPost({
        title: title.trim(),
        description: content.trim(),
        tags
      })

      if (result.success) {
        alert("Question Posted! Your question has been shared with the community.")
        console.log('Question posted successfully')

        // Reset form
        setTitle("")
        setContent("")
        setTags([])
        setTagInput("")
        setSimilarQuestions([])
        setShowDuplicates(false)
        onOpenChange(false)
      } else if (result.similarQuestions) {
        // Show similar questions
        setSimilarQuestions(result.similarQuestions)
        setShowDuplicates(true)
      } else {
        alert(result.message || "Failed to create question.")
      }
    } catch (error) {
      console.error('Error creating question:', error)
      alert("Failed to create question. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Ask a Question</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your question with the community and get helpful answers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm text-muted-foreground mb-2 block">
              Question Title
            </Label>
            <Input
              id="title"
              placeholder="What would you like to ask?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-secondary text-white placeholder:text-muted-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Be specific and clear in your question</p>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-sm text-muted-foreground mb-2 block">
              Details
            </Label>
            <Textarea
              id="content"
              placeholder="Provide more context and details about your question..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-secondary border-secondary text-white placeholder:text-muted-foreground min-h-[120px]"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-sm text-muted-foreground mb-2 block">
              Category
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={`${
                    category === cat
                      ? "bg-primary border-primary text-white"
                      : "border-secondary hover:bg-secondary bg-transparent text-muted-foreground"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-sm text-muted-foreground mb-2 block">
              Tags (max 5)
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="bg-secondary border-secondary text-white placeholder:text-muted-foreground"
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
                className="bg-secondary hover:bg-secondary/80 text-white"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-primary text-primary pr-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Duplicate Detection */}
          {showDuplicates && similarQuestions.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                Similar questions found
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                We found questions that might already answer your query. Please review them before posting:
              </p>
              <div className="space-y-2">
                {similarQuestions.map((question, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border text-sm">
                    <p className="font-medium">{question.title}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDuplicates(false);
                    setSimilarQuestions([]);
                  }}
                >
                  Edit Question
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      const result = await createQuestion({
                        title: title.trim(),
                        description: content.trim(),
                        tags
                      });

                      if (result.success) {
                        setTitle("");
                        setContent("");
                        setTags([]);
                        setTagInput("");
                        setSimilarQuestions([]);
                        setShowDuplicates(false);
                        onOpenChange(false);
                      } else {
                        alert(result.message || "Failed to create question.");
                      }
                    } catch (error) {
                      console.error("Error creating question:", error);
                      alert("Failed to create question. Please try again.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Anyway"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-secondary hover:bg-secondary bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              disabled={!title || !content || !category || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Question"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
