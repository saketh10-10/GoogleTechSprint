"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  ThumbsUp,
  Calendar,
  MapPin,
  Mail,
  UserPlus,
  UserMinus,
  Edit,
  Award,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import {
  getUserProfile,
  isUserFollowing,
  toggleFollow,
  getFollowers,
  getFollowing
} from "@/lib/issuehub-service";
import { getAuth } from "firebase/auth";
import { UserProfile, PostWithDetails, AnswerWithDetails } from "@/lib/types";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser && currentUser.uid === userId) {
          setIsCurrentUser(true);
        }

        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
          router.push('/404');
          return;
        }

        setProfile(userProfile);

        if (currentUser && !isCurrentUser) {
          const following = await isUserFollowing(currentUser.uid, userId);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, router, isCurrentUser]);

  const handleFollowToggle = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !profile) return;

    setFollowLoading(true);
    try {
      const newFollowState = await toggleFollow(currentUser.uid, userId);
      setIsFollowing(newFollowState);

      // Update local profile counts
      setProfile(prev => prev ? {
        ...prev,
        followersCount: newFollowState ? prev.followersCount + 1 : prev.followersCount - 1
      } : null);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!profile) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground mb-4">The user profile you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/issuehub')}>
              Back to IssueHub
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary"
                onClick={() => router.push('/issuehub')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-medium">User Profile</h1>
                <p className="text-xs text-muted-foreground">Community member</p>
              </div>
            </div>

            {isCurrentUser && (
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {!isCurrentUser && (
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className="w-full md:w-auto"
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {followLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : isFollowing ? (
                        <UserMinus className="w-4 h-4 mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                </div>

                {/* Profile Details */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                    <p className="text-muted-foreground">User ID: {profile.userId}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Joined {profile.joinedAt.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{profile.reputation}</div>
                      <div className="text-sm text-muted-foreground">Reputation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{profile.totalUpvotesReceived}</div>
                      <div className="text-sm text-muted-foreground">Upvotes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{profile.postsCount}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{profile.answersCount}</div>
                      <div className="text-sm text-muted-foreground">Answers</div>
                    </div>
                  </div>

                  {/* Social Stats */}
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{profile.followersCount}</span>
                      <span className="text-muted-foreground">followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{profile.followingCount}</span>
                      <span className="text-muted-foreground">following</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    <span>Questions Asked</span>
                  </div>
                  <Badge variant="secondary">{profile.postsCount}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                    <span>Answers Given</span>
                  </div>
                  <Badge variant="secondary">{profile.answersCount}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ThumbsUp className="w-5 h-5 text-purple-500" />
                      <span>Helpful Votes</span>
                    </div>
                    <Badge variant="secondary">{profile.totalUpvotesReceived}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span>Community Rank</span>
                  </div>
                  <Badge variant="outline">
                    {profile.reputation > 100 ? 'Expert' :
                      profile.reputation > 50 ? 'Contributor' :
                        profile.reputation > 10 ? 'Helper' : 'Newcomer'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts (Placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Recent posts and answers will appear here</p>
                  <p className="text-sm mt-2">Activity tracking coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
