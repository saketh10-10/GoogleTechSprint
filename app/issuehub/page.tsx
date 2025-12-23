"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PostQuestionDialog } from "@/components/issuehub/post-question-dialog";
import { QuestionDetailDialog } from "@/components/issuehub/question-detail-dialog";
import { Leaderboard } from "@/components/issuehub/leaderboard";
import { AuthGuard } from "@/components/auth-guard";
import { getPosts, searchPosts, toggleUpvote, getLeaderboard } from "@/lib/issuehub-service";
import { PostWithDetails, LeaderboardEntry } from "@/lib/types";

// Mock questions data
const questions = [
  {
    id: "1",
    title: "How to access the college library database from home?",
    content:
      "I need to access research papers for my project but can't figure out how to log in remotely.",
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
    content:
      "My midterm exam grade is not showing up in the portal. Who should I contact about this?",
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
    content:
      "The WiFi has been down for 2 days in Block C. Has anyone else experienced this?",
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
    content:
      "I'm a first year student interested in competitive programming. Which clubs should I consider?",
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
    content:
      "The college bus timings seem to have changed but I can't find the new schedule anywhere.",
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
    content:
      "Are there any merit-based scholarships available? What's the application process?",
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
];

const categories = [
  "All",
  "Academics",
  "Infrastructure",
  "Library",
  "Clubs",
  "Transport",
  "Financial",
];

export default function IssueHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  // Real data states
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [postsData, leaderboardData] = await Promise.all([
        getPosts({ limit: 20 }),
        getLeaderboard(10)
      ]);

      setPosts(postsData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle category and search changes
  useEffect(() => {
    if (!loading) {
      handleSearchAndFilter();
    }
  }, [selectedCategory, searchQuery]);

  const handleSearchAndFilter = async () => {
    try {
      setLoading(true);
      let filteredPosts: PostWithDetails[];

      if (searchQuery.trim()) {
        filteredPosts = await searchPosts(searchQuery.trim(), selectedCategory === "All" ? undefined : selectedCategory);
      } else {
        filteredPosts = await getPosts({
          category: selectedCategory === "All" ? undefined : selectedCategory,
          limit: 20
        });
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error filtering posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            upvotes: post.userUpvoted ? post.upvotes - 1 : post.upvotes + 1,
            userUpvoted: !post.userUpvoted
          };
        }
        return post;
      });
      setPosts(updatedPosts);

      // Actually toggle the upvote in Firebase
      await toggleUpvote(postId, 'post');
    } catch (error) {
      console.error('Error toggling upvote:', error);
      // Revert the optimistic update on error
      handleSearchAndFilter();
    }
  };

  const handlePostCreated = () => {
    // Reload posts to show the new post
    loadInitialData();
  };

  // Get trending posts (posts with high upvotes or recent activity)
  const trendingPosts = posts
    .filter(post => post.upvotes > 5 || post.answersCount > 2)
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 3);

  // Find selected post for detail dialog
  const selectedPostData = posts.find((post) => post.id === selectedQuestion);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading IssueHub...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-medium text-foreground">IssueHub</h1>
              <p className="text-xs text-muted-foreground">
                Campus Community Platform
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setShowPostDialog(true)}
          >
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
                <h2 className="text-3xl font-medium text-foreground">
                  Community Questions
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Get help from your peers and share your knowledge
              </p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions, tags, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
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
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-secondary hover:bg-secondary bg-transparent text-muted-foreground"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="p-6 bg-card border-secondary hover:border-primary/50 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedQuestion(post.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 hover:bg-primary/10 ${
                          post.userUpvoted
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(post.id);
                        }}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-foreground">
                        {post.upvotes}
                      </span>
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-200">
                          {post.title}
                        </h3>
                        {post.isTrending && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {post.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {post.author.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {post.author.name}
                          </span>
                        </div>

                        <span className="text-xs text-muted-foreground">•</span>

                        <Badge
                          variant="outline"
                          className="border-secondary text-foreground text-xs"
                        >
                          {post.category}
                        </Badge>

                        <span className="text-xs text-muted-foreground">•</span>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>

                        <span className="text-xs text-muted-foreground ml-auto">
                          •
                        </span>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {post.answersCount} answers
                            </span>
                          </div>

                          {post.status === "answered" && (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Answered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.map((tag, index) => (
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
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="p-6 bg-card border-secondary">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Community Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Questions
                  </span>
                  <span className="text-lg font-medium text-foreground">
                    {posts.length > 0 ? posts.length : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Answered
                  </span>
                  <span className="text-lg font-medium text-green-500">
                    {posts.filter(p => p.status === 'answered').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Contributors
                  </span>
                  <span className="text-lg font-medium text-primary">
                    {leaderboard.length > 0 ? leaderboard.length : '0'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Trending Posts */}
            <Card className="p-6 bg-card border-secondary">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">
                  Trending Now
                </h3>
              </div>
              <div className="space-y-3">
                {trendingPosts.length > 0 ? trendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedQuestion(post.id)}
                  >
                    <p className="text-sm text-foreground mb-2 line-clamp-2">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{post.upvotes}</span>
                      <span>•</span>
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.answersCount}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground py-4">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No trending posts yet</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Leaderboard */}
            <Leaderboard />

            {/* Guidelines */}
            <Card className="p-6 bg-card border-secondary">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Community Guidelines
              </h3>
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
        onPost={handlePostCreated}
      />

      {/* Question Detail Dialog */}
      {selectedPostData && (
        <QuestionDetailDialog
          question={selectedPostData}
          open={!!selectedQuestion}
          onOpenChange={(open) => !open && setSelectedQuestion(null)}
        />
      )}
    </div>
    </AuthGuard>
  );
}

