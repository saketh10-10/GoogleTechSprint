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
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PostQuestionDialog } from "@/components/issuehub/post-question-dialog";
import { QuestionDetailDialog } from "@/components/issuehub/question-detail-dialog";
import { Leaderboard } from "@/components/issuehub/leaderboard";
import AuthGuard from "@/components/auth-guard";
import {
  getQuestions,
  searchQuestions,
  upvoteQuestion,
  upvoteAnswer,
  getLeaderboard,
  createQuestion,
  createAnswer,
  getAnswersForQuestion,
  subscribeToQuestions
} from "@/lib/issuehub-service";
import { getCurrentUser } from "@/lib/auth-service";
import { PostWithDetails, LeaderboardEntry } from "@/lib/types";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

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
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Real data states
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Load real-time data
  useEffect(() => {
    setLoading(true);

    // Subscribe to real-time updates for questions
    const unsubscribe = subscribeToQuestions((questionsData) => {
      setPosts(questionsData);
      setLoading(false);
      setHasMore(questionsData.length >= 10);
    }, {
      category: selectedCategory === "All" ? undefined : selectedCategory,
      limit: 10
    });

    // Fetch leaderboard separately as it's not real-time for now
    getLeaderboard().then(leaderboardData => {
      setLeaderboard(leaderboardData);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  const loadMoreQuestions = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextQuestions = await getQuestions({
        limit: 10,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        // startAfter: lastDoc // startAfter support added to service but we need to track doc snapshots
      });

      // Special handling: if we wanted real pagination with startAfter, 
      // we'd need getQuestions to return the last doc. 
      // For now, we'll append and check length.
      setPosts(prev => [...prev, ...nextQuestions]);
      setHasMore(nextQuestions.length === 10);
    } catch (error) {
      console.error('Error loading more questions:', error);
    } finally {
      setLoadingMore(false);
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
        filteredPosts = await searchQuestions(searchQuery.trim(), selectedCategory === "All" ? undefined : selectedCategory);
        setHasMore(false); // Search results usually aren't paginated the same way in this simple setup
      } else {
        filteredPosts = await getQuestions({
          category: selectedCategory === "All" ? undefined : selectedCategory,
          limit: 10
        });
        setHasMore(filteredPosts.length === 10);
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error filtering posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (targetId: string, targetType: 'question' | 'answer') => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      alert("You must be logged in to upvote.");
      return;
    }

    try {
      // Optimistic update
      const updatedPosts = posts.map(post => {
        if (post.id === targetId) {
          return {
            ...post,
            upvotes: post.userUpvoted ? post.upvotes - 1 : post.upvotes + 1,
            userUpvoted: !post.userUpvoted
          };
        }
        return post;
      });
      setPosts(updatedPosts);

      // Call the appropriate upvote function
      if (targetType === 'question') {
        await upvoteQuestion(targetId);
      } else {
        await upvoteAnswer(targetId);
      }
    } catch (error: any) {
      console.error('Error upvoting:', error);
      // Revert the optimistic update on error if needed
    }
  };

  const handlePostCreated = () => {
    // Real-time listener handles the update automatically
  };

  const handleQuestionSubmit = async (questionData: { title: string; description: string; tags: string[] }): Promise<{ success: boolean; similarQuestions?: any[]; message?: string }> => {
    try {
      const result = await createQuestion(questionData);
      if (result.success) {
        handlePostCreated();
        return { success: true };
      } else if (result.similarQuestions && result.similarQuestions.length > 0) {
        return {
          success: false,
          similarQuestions: result.similarQuestions,
          message: result.message
        };
      } else {
        return { success: false, message: result.message || 'Failed to create question' };
      }
    } catch (error) {
      console.error('Error creating question:', error);
      return { success: false, message: 'Failed to create question. Please try again.' };
    }
  };

  const handleAnswerSubmit = async (questionId: string, content: string) => {
    try {
      const result = await createAnswer(questionId, content);
      if (result.success) {
        // Parent refresh logic is handled in the detail dialog locally as well
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Failed to post answer' };
      }
    } catch (error) {
      console.error('Error posting answer:', error);
      return { success: false, message: 'Failed to post answer. Please try again.' };
    }
  };

  // Get trending posts locally from the fetched set
  const trendingPosts = [...posts]
    .filter(post => post.upvotes > 5 || post.answersCount > 2)
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 3);

  const selectedPostData = posts.find((post) => post.id === selectedQuestionId);

  return (
    <AuthGuard allowedRoles={['student']} requireAuth={true} requireRole={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <nav className="border-b border-border backdrop-blur-sm bg-background/80 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="hover:bg-secondary" asChild>
                <Link href="/"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div>
                <h1 className="text-xl font-medium text-foreground">IssueHub</h1>
                <p className="text-xs text-muted-foreground">Campus Community Platform</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setShowPostDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Ask Question
            </Button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-3xl font-medium text-foreground">Community Questions</h2>
                </div>
                <p className="text-muted-foreground mb-6">Get help from your peers and share your knowledge</p>
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

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`${selectedCategory === category ? "bg-primary border-primary text-primary-foreground" : "border-secondary hover:bg-secondary bg-transparent text-muted-foreground"}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {loading ? (
                  // Skeleton Loaders (Requirement 12)
                  Array(5).fill(0).map((_, i) => (
                    <Card key={i} className="p-6 bg-card border-secondary animate-pulse">
                      <div className="h-6 bg-secondary/50 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-secondary/30 rounded w-full mb-2"></div>
                      <div className="h-4 bg-secondary/30 rounded w-5/6"></div>
                    </Card>
                  ))
                ) : posts.length > 0 ? (
                  <>
                    {posts.map((post) => (
                      <Card
                        key={post.id}
                        className="p-6 bg-card border-secondary hover:border-primary/50 transition-all cursor-pointer group"
                        onClick={() => setSelectedQuestionId(post.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 hover:bg-primary/10 ${post.userUpvoted ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                              onClick={(e) => { e.stopPropagation(); handleUpvote(post.id, 'question'); }}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium text-foreground">{post.upvotes}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="border-secondary text-foreground text-[10px] h-5">{post.category}</Badge>
                              {post.status === "answered" && <Badge className="bg-green-500/10 text-green-500 border-none text-[10px] h-5"><CheckCircle className="w-3 h-3 mr-1" /> Answered</Badge>}
                              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors mb-2">{post.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1.5">
                                {post.tags.map((tag, index) => (
                                  <span key={index} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-foreground">#{tag}</span>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-1.5 text-xs"><MessageCircle className="w-4 h-4" /> <span>{post.answersCount} answers</span></div>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-[10px] font-medium text-primary">{post.author.name.charAt(0).toUpperCase()}</span></div>
                                  <span className="text-xs font-medium text-foreground">{post.author.name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Load More Button (Requirement 13) */}
                    {hasMore && (
                      <Button
                        variant="outline"
                        className="w-full border-secondary py-6"
                        onClick={loadMoreQuestions}
                        disabled={loadingMore}
                      >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        Load More Questions
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-card rounded-xl border border-secondary border-dashed">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No questions found. Be the first to ask!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <Leaderboard entries={leaderboard} loading={loading} />
              <Card className="p-6 bg-card border-secondary">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-medium text-foreground">Trending Now</h3>
                </div>
                <div className="space-y-4">
                  {trendingPosts.map((post) => (
                    <div key={post.id} className="group cursor-pointer" onClick={() => setSelectedQuestionId(post.id)}>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">{post.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.upvotes}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.answersCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {selectedPostData && (
          <QuestionDetailDialog
            question={selectedPostData}
            open={!!selectedQuestionId}
            onOpenChange={(open) => !open && setSelectedQuestionId(null)}
          />
        )}
        <PostQuestionDialog
          open={showPostDialog}
          onOpenChange={setShowPostDialog}
          onPost={handleQuestionSubmit}
        />
      </div>
    </AuthGuard>
  );
}
