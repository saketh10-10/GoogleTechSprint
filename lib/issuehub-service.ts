// IssueHub Firebase Services
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import {
  User,
  UserProfile,
  Post,
  Answer,
  Upvote,
  Follow,
  LeaderboardEntry,
  PostWithDetails,
  AnswerWithDetails,
  UserStats
} from './types';

// Collection references
const usersRef = collection(db, 'users');
const postsRef = collection(db, 'posts');
const answersRef = collection(db, 'answers');
const upvotesRef = collection(db, 'upvotes');
const followsRef = collection(db, 'follows');

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const createUserProfile = async (user: User): Promise<void> => {
  const userProfile: Omit<UserProfile, 'id'> = {
    userId: user.id,
    name: user.name,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    answersCount: 0,
    totalUpvotesReceived: 0,
    reputation: 0,
    joinedAt: user.createdAt,
    lastActive: user.lastActive
  };

  await addDoc(usersRef, userProfile);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(usersRef, userId));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() } as UserProfile;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  await updateDoc(doc(usersRef, userId), updates);
};

export const updateUserStats = async (userId: string, stats: Partial<UserStats>): Promise<void> => {
  const updates: any = {};
  if (stats.postsCount !== undefined) updates.postsCount = increment(stats.postsCount);
  if (stats.answersCount !== undefined) updates.answersCount = increment(stats.answersCount);
  if (stats.totalUpvotesReceived !== undefined) updates.totalUpvotesReceived = increment(stats.totalUpvotesReceived);
  if (stats.followersCount !== undefined) updates.followersCount = increment(stats.followersCount);
  if (stats.followingCount !== undefined) updates.followingCount = increment(stats.followingCount);

  // Recalculate reputation (simple algorithm)
  updates.reputation = increment((stats.totalUpvotesReceived || 0) + (stats.postsCount || 0) * 2 + (stats.answersCount || 0));

  await updateDoc(doc(usersRef, userId), updates);
};

// ============================================================================
// POST MANAGEMENT
// ============================================================================

export const createPost = async (postData: Omit<Post, 'id' | 'upvotes' | 'answersCount' | 'views' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const post: Omit<Post, 'id'> = {
    ...postData,
    upvotes: 0,
    answersCount: 0,
    views: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const docRef = await addDoc(postsRef, {
    ...post,
    createdAt: Timestamp.fromDate(post.createdAt),
    updatedAt: Timestamp.fromDate(post.updatedAt)
  });

  // Update user stats
  await updateUserStats(postData.authorId, { postsCount: 1 });

  return docRef.id;
};

export const getPost = async (postId: string): Promise<PostWithDetails | null> => {
  const postDoc = await getDoc(doc(postsRef, postId));
  if (!postDoc.exists()) return null;

  const post = { id: postDoc.id, ...postDoc.data() } as Post;

  // Get author info
  const authorProfile = await getUserProfile(post.authorId);
  const author = authorProfile ? { name: authorProfile.name } : { name: 'Unknown User' };

  // Get answers
  const answers = await getAnswersForPost(postId);

  // Check if current user upvoted
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, postId, 'post') : false;

  return {
    ...post,
    author,
    answers,
    userUpvoted
  };
};

export const getPosts = async (options: {
  category?: string;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
} = {}): Promise<PostWithDetails[]> => {
  let q = query(postsRef, orderBy('createdAt', 'desc'));

  if (options.category && options.category !== 'All') {
    q = query(q, where('category', '==', options.category));
  }

  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  if (options.startAfter) {
    q = query(q, startAfter(options.startAfter));
  }

  const querySnapshot = await getDocs(q);
  const posts: PostWithDetails[] = [];

  for (const postDoc of querySnapshot.docs) {
    const post = { id: postDoc.id, ...postDoc.data() } as Post;

    // Get author info
    const authorProfile = await getUserProfile(post.authorId);
    const author = authorProfile ? { name: authorProfile.name } : { name: 'Unknown User' };

    // Get answers count
    const answersSnapshot = await getDocs(query(answersRef, where('postId', '==', post.id)));
    const answersCount = answersSnapshot.size;

    // Check if current user upvoted
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, post.id, 'post') : false;

    posts.push({
      ...post,
      author,
      answers: [], // We'll load answers separately for performance
      answersCount,
      userUpvoted
    });
  }

  return posts;
};

export const updatePost = async (postId: string, updates: Partial<Post>): Promise<void> => {
  await updateDoc(doc(postsRef, postId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

export const incrementPostViews = async (postId: string): Promise<void> => {
  await updateDoc(doc(postsRef, postId), {
    views: increment(1)
  });
};

// ============================================================================
// ANSWER MANAGEMENT
// ============================================================================

export const createAnswer = async (answerData: Omit<Answer, 'id' | 'upvotes' | 'isAccepted' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const answer: Omit<Answer, 'id'> = {
    ...answerData,
    upvotes: 0,
    isAccepted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const docRef = await addDoc(answersRef, {
    ...answer,
    createdAt: Timestamp.fromDate(answer.createdAt),
    updatedAt: Timestamp.fromDate(answer.updatedAt)
  });

  // Update post answers count
  await updateDoc(doc(postsRef, answerData.postId), {
    answersCount: increment(1),
    updatedAt: Timestamp.fromDate(new Date())
  });

  // Update user stats
  await updateUserStats(answerData.authorId, { answersCount: 1 });

  return docRef.id;
};

export const getAnswersForPost = async (postId: string): Promise<AnswerWithDetails[]> => {
  const q = query(answersRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);

  const answers: AnswerWithDetails[] = [];
  const auth = getAuth();
  const currentUser = auth.currentUser;

  for (const answerDoc of querySnapshot.docs) {
    const answer = { id: answerDoc.id, ...answerDoc.data() } as Answer;

    // Get author info
    const authorProfile = await getUserProfile(answer.authorId);
    const author = authorProfile ? { name: authorProfile.name } : { name: 'Unknown User' };

    // Check if current user upvoted
    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, answer.id, 'answer') : false;

    answers.push({
      ...answer,
      author,
      userUpvoted
    });
  }

  return answers;
};

export const updateAnswer = async (answerId: string, updates: Partial<Answer>): Promise<void> => {
  await updateDoc(doc(answersRef, answerId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

// ============================================================================
// UPVOTE SYSTEM
// ============================================================================

export const toggleUpvote = async (userId: string, targetId: string, targetType: 'post' | 'answer'): Promise<boolean> => {
  const existingUpvote = await getUserUpvote(userId, targetId, targetType);

  if (existingUpvote) {
    // Remove upvote
    await deleteDoc(doc(upvotesRef, existingUpvote.id));

    // Decrement upvotes count
    const targetRef = targetType === 'post' ? postsRef : answersRef;
    await updateDoc(doc(targetRef, targetId), {
      upvotes: increment(-1)
    });

    // Update user stats if it's an answer
    if (targetType === 'answer') {
      const answerDoc = await getDoc(doc(answersRef, targetId));
      if (answerDoc.exists()) {
        const answer = answerDoc.data() as Answer;
        await updateUserStats(answer.authorId, { totalUpvotesReceived: -1 });
      }
    }

    return false; // Upvote removed
  } else {
    // Add upvote
    await addDoc(upvotesRef, {
      userId,
      targetId,
      targetType,
      createdAt: Timestamp.fromDate(new Date())
    });

    // Increment upvotes count
    const targetRef = targetType === 'post' ? postsRef : answersRef;
    await updateDoc(doc(targetRef, targetId), {
      upvotes: increment(1)
    });

    // Update user stats if it's an answer
    if (targetType === 'answer') {
      const answerDoc = await getDoc(doc(answersRef, targetId));
      if (answerDoc.exists()) {
        const answer = answerDoc.data() as Answer;
        await updateUserStats(answer.authorId, { totalUpvotesReceived: 1 });
      }
    }

    return true; // Upvote added
  }
};

export const hasUserUpvoted = async (userId: string, targetId: string, targetType: 'post' | 'answer'): Promise<boolean> => {
  const upvote = await getUserUpvote(userId, targetId, targetType);
  return !!upvote;
};

const getUserUpvote = async (userId: string, targetId: string, targetType: 'post' | 'answer'): Promise<Upvote | null> => {
  const q = query(
    upvotesRef,
    where('userId', '==', userId),
    where('targetId', '==', targetId),
    where('targetType', '==', targetType)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Upvote;
  }
  return null;
};

// ============================================================================
// FOLLOW SYSTEM
// ============================================================================

export const toggleFollow = async (followerId: string, followingId: string): Promise<boolean> => {
  const existingFollow = await getFollowRelationship(followerId, followingId);

  if (existingFollow) {
    // Unfollow
    await deleteDoc(doc(followsRef, existingFollow.id));

    // Update follower counts
    await updateUserStats(followerId, { followingCount: -1 });
    await updateUserStats(followingId, { followersCount: -1 });

    return false; // Unfollowed
  } else {
    // Follow
    await addDoc(followsRef, {
      followerId,
      followingId,
      createdAt: Timestamp.fromDate(new Date())
    });

    // Update follower counts
    await updateUserStats(followerId, { followingCount: 1 });
    await updateUserStats(followingId, { followersCount: 1 });

    return true; // Followed
  }
};

export const isUserFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const follow = await getFollowRelationship(followerId, followingId);
  return !!follow;
};

const getFollowRelationship = async (followerId: string, followingId: string): Promise<Follow | null> => {
  const q = query(
    followsRef,
    where('followerId', '==', followerId),
    where('followingId', '==', followingId)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Follow;
  }
  return null;
};

export const getFollowers = async (userId: string): Promise<string[]> => {
  const q = query(followsRef, where('followingId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().followerId);
};

export const getFollowing = async (userId: string): Promise<string[]> => {
  const q = query(followsRef, where('followerId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().followingId);
};

// ============================================================================
// LEADERBOARD
// ============================================================================

export const getLeaderboard = async (limitCount: number = 10): Promise<LeaderboardEntry[]> => {
  const q = query(usersRef, orderBy('reputation', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);

  const leaderboard: LeaderboardEntry[] = [];
  let rank = 1;

  querySnapshot.forEach((doc) => {
    const userData = doc.data() as UserProfile;
    leaderboard.push({
      userId: userData.userId,
      name: userData.name,
      totalUpvotesReceived: userData.totalUpvotesReceived,
      postsCount: userData.postsCount,
      answersCount: userData.answersCount,
      reputation: userData.reputation,
      rank: rank++
    });
  });

  return leaderboard;
};

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

export const searchPosts = async (searchTerm: string, category?: string): Promise<PostWithDetails[]> => {
  // Note: Firestore doesn't support full-text search natively
  // In production, you'd use Algolia, ElasticSearch, or Firestore's text search extensions

  // For now, we'll do a basic title and tags search
  const allPosts = await getPosts({ category });
  return allPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const subscribeToPost = (postId: string, callback: (post: PostWithDetails) => void) => {
  return onSnapshot(doc(postsRef, postId), async (doc) => {
    if (doc.exists()) {
      const post = { id: doc.id, ...doc.data() } as Post;
      const postWithDetails = await getPost(postId);
      if (postWithDetails) {
        callback(postWithDetails);
      }
    }
  });
};

export const subscribeToAnswers = (postId: string, callback: (answers: AnswerWithDetails[]) => void) => {
  const q = query(answersRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));

  return onSnapshot(q, async (querySnapshot) => {
    const answers = [];
    for (const answerDoc of querySnapshot.docs) {
      const answer = { id: answerDoc.id, ...answerDoc.data() } as Answer;

      // Get author info
      const authorProfile = await getUserProfile(answer.authorId);
      const author = authorProfile ? { name: authorProfile.name } : { name: 'Unknown User' };

      // Check if current user upvoted
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, answer.id, 'answer') : false;

      answers.push({
        ...answer,
        author,
        userUpvoted
      });
    }

    callback(answers);
  });
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile) => void) => {
  return onSnapshot(doc(usersRef, userId), (doc) => {
    if (doc.exists()) {
      const profile = { id: doc.id, ...doc.data() } as UserProfile;
      callback(profile);
    }
  });
};
