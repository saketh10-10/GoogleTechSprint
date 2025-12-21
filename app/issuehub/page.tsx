"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  MessageSquare,
  Search,
  TrendingUp,
  Plus,
  MessageCircle,
  ThumbsUp,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PostQuestionDialog } from "@/components/issuehub/post-question-dialog"
import { QuestionDetailDialog } from "@/components/issuehub/question-detail-dialog"

// Mock questions data
const questions = [
  {
    id: "1",
    title: "How to access the college library database from home?",
    content: "I need to access research papers for my project but can't figure out how to log in remotely.",
    author: "Rahul Kumar",
    authorAvatar: "RK",
    category: "Library",
    tags: ["library", "access", "database"],
    upvotes: 24,
    answers: 3,
    status: "answered" as const,
    timeAgo: "2 hours ago",
    trending: true,
  },
  {
    id: "2",
    title: "Missing grade for Data Structures midterm exam",
    content: "My midterm exam grade is not showing up in the portal. Who should I contact about this?",
    author: "Priya Sharma",
    authorAvatar: "PS",
    category: "Academics",
    tags: ["grades", "exams", "portal"],
    upvotes: 18,
    answers: 5,
    status: "answered" as const,
    timeAgo: "5 hours ago",
    trending: false,
  },
  {
    id: "3",
    title: "WiFi not working in Block C hostel",
    content: "The WiFi has been down for 2 days in Block C. Has anyone else experienced this?",
    author: "Arjun Patel",
    authorAvatar: "AP",
    category: "Infrastructure",
    tags: ["wifi", "hostel", "internet"],
    upvotes: 42,
    answers: 8,
    status: "answered" as const,
    timeAgo: "1 day ago",
    trending: true,
  },
  {
    id: "4",
    title: "Best coding clubs to join for beginners?",
    content: "I'm a first year student interested in competitive programming. Which clubs should I consider?",
    author: "Sneha Reddy",
    authorAvatar: "SR",
    category: "Clubs",
    tags: ["clubs", "coding", "beginners"],
    upvotes: 15,
    answers: 7,
    status: "answered" as const,
    timeAgo: "3 hours ago",
    trending: false,
  },
  {
    id: "5",
    title: "Bus schedule changed - where to find updates?",
    content: "The college bus timings seem to have changed but I can't find the new schedule anywhere.",
    author: "Vikram Singh",
    authorAvatar: "VS",
    category: "Transport",
    tags: ["transport", "bus", "schedule"],
    upvotes: 31,
    answers: 2,
    status: "open" as const,
    timeAgo: "30 minutes ago",
    trending: true,
  },
  {
    id: "6",
    title: "How to apply for scholarship programs?",
    content: "Are there any merit-based scholarships available? What's the application process?",
    author: "Anjali Gupta",
    authorAvatar: "AG",
    category: "Financial",
    tags: ["scholarship", "financial-aid", "application"],
    upvotes: 28,
    answers: 4,
    status: "answered" as const,
    timeAgo: "1 day ago",
    trending: false,
  },
]

const categories = ["All", "Academics", "Infrastructure", "Library", "Clubs", "Transport", "Financial"]

export default function IssueHubPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "All" || q.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const trendingQuestions = questions.filter((q) => q.trending).slice(0, 3)
  const selectedQuestionData = questions.find((q) => q.id === selectedQuestion)

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-secondary backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-secondary" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-medium text-white">IssueHub</h1>
              <p className="text-xs text-muted-foreground">Campus Community Platform</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowPostDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ask Question
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header & Search */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-3xl font-medium text-white">Community Questions</h2>
              </div>
              <p className="text-muted-foreground mb-6">Get help from your peers and share your knowledge</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions, tags, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-secondary text-white placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category
                      ? "bg-primary border-primary text-white"
                      : "border-secondary hover:bg-secondary bg-transparent text-muted-foreground"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card
                  key={question.id}
                  className="p-6 bg-card border-secondary hover:border-primary/50 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedQuestion(question.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-white">{question.upvotes}</span>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-medium text-white hover:text-primary transition-colors duration-200">
                          {question.title}
                        </h3>
                        {question.trending && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{question.content}</p>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{question.authorAvatar}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{question.author}</span>
                        </div>

                        <span className="text-xs text-muted-foreground">•</span>

                        <Badge variant="outline" className="border-secondary text-foreground text-xs">
                          {question.category}
                        </Badge>

                        <span className="text-xs text-muted-foreground">•</span>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{question.timeAgo}</span>
                        </div>

                        <span className="text-xs text-muted-foreground ml-auto">•</span>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{question.answers} answers</span>
                          </div>

                          {question.status === "answered" && (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Answered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {question.tags.map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="p-6 bg-card border-secondary">
              <h3 className="text-lg font-medium text-white mb-4">Community Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Questions</span>
                  <span className="text-lg font-medium text-white">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Answered</span>
                  <span className="text-lg font-medium text-green-500">892</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="text-lg font-medium text-primary">342</span>
                </div>
              </div>
            </Card>

            {/* Trending Questions */}
            <Card className="p-6 bg-card border-secondary">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-medium text-white">Trending Now</h3>
              </div>
              <div className="space-y-3">
                {trendingQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedQuestion(question.id)}
                  >
                    <p className="text-sm text-white mb-2 line-clamp-2">{question.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{question.upvotes}</span>
                      <span>•</span>
                      <MessageCircle className="w-3 h-3" />
                      <span>{question.answers}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Guidelines */}
            <Card className="p-6 bg-card border-secondary">
              <h3 className="text-lg font-medium text-white mb-4">Community Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Be respectful and supportive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Search before posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Provide clear details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Mark helpful answers</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Post Question Dialog */}
      <PostQuestionDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onPost={() => {
          setShowPostDialog(false)
          // In production, add new question here
        }}
      />

      {/* Question Detail Dialog */}
      {selectedQuestionData && (
        <QuestionDetailDialog
          question={selectedQuestionData}
          open={!!selectedQuestion}
          onOpenChange={(open) => !open && setSelectedQuestion(null)}
        />
      )}
    </div>
  )
}
