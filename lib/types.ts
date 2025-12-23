// TypeScript interfaces for IssueHub data models

export interface User {
  id: string;
  email: string;
  rollNumber?: string; // For students
  name: string;
  role: 'student' | 'faculty' | 'admin';
  avatar?: string;
  bio?: string;
  createdAt: Date;
  lastActive: Date;
  isVerified: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  answersCount: number;
  totalUpvotesReceived: number;
  reputation: number; // Calculated based on engagement
  badges?: string[]; // Achievement badges
  joinedAt: Date;
  lastActive: Date;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  upvotes: number;
  answersCount: number;
  status: 'open' | 'answered' | 'closed';
  isTrending: boolean;
  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export interface Answer {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Upvote {
  id: string;
  userId: string;
  targetId: string; // postId or answerId
  targetType: 'post' | 'answer';
  createdAt: Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalUpvotesReceived: number;
  postsCount: number;
  answersCount: number;
  reputation: number;
  rank: number;
}

// UI State types
export interface PostWithDetails extends Post {
  author: Pick<User, 'name' | 'avatar'>;
  answers: AnswerWithDetails[];
  userUpvoted?: boolean;
}

export interface AnswerWithDetails extends Answer {
  author: Pick<User, 'name' | 'avatar'>;
  userUpvoted?: boolean;
}

export interface UserStats {
  postsCount: number;
  answersCount: number;
  totalUpvotesReceived: number;
  followersCount: number;
  followingCount: number;
  reputation: number;
}
