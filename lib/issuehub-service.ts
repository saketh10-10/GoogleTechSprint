// IssueHub Firebase Services - Updated for Cloud Functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
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
const questionsRef = collection(db, 'questions');
const postsRef = collection(db, 'questions'); // Aliased for legacy code compatibility
const answersRef = collection(db, 'answers');
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
  const data = userDoc.data();
  return {
    userId: data?.userId || userId,
    name: data?.name || '',
    followersCount: data?.followersCount || 0,
    followingCount: data?.followingCount || 0,
    postsCount: data?.postsCount || 0,
    answersCount: data?.answersCount || 0,
    totalUpvotesReceived: data?.totalUpvotesReceived || 0,
    reputation: data?.reputation || 0,
    badges: data?.badges || [],
    joinedAt: data?.joinedAt?.toDate() || new Date(),
    lastActive: data?.lastActive?.toDate() || new Date()
  };
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
// QUESTION MANAGEMENT
// ============================================================================

export const createQuestion = async (questionData: {
  title: string;
  description: string;
  tags?: string[]
}): Promise<{ success: boolean; questionId?: string; similarQuestions?: any[]; message?: string; question?: any }> => {
  const createQuestionFunction = httpsCallable(functions, 'createQuestion');
  const result = await createQuestionFunction(questionData);
  return result.data as any;
};

export const getPost = async (postId: string): Promise<PostWithDetails | null> => {
  const postDoc = await getDoc(doc(postsRef, postId));
  if (!postDoc.exists()) return null;

  const data = postDoc.data();
  const post = { id: postDoc.id, ...data } as Post;

  // Get author info
  const authorProfile = await getUserProfile(post.authorId);
  const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };

  // Get answers
  const answers = await getAnswersForQuestion(postId);

  // Check if current user upvoted
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, postId, 'question') : false;

  return {
    ...post,
    authorName: author.name,
    author,
    answers: answers as AnswerWithDetails[],
    userUpvoted
  };
};

export const getQuestions = async (options: {
  category?: string;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
} = {}): Promise<PostWithDetails[]> => {
  let q = query(questionsRef, orderBy('createdAt', 'desc'));

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
  const questions: PostWithDetails[] = [];

  for (const questionDoc of querySnapshot.docs) {
    const question = questionDoc.data();

    // Get author info
    const authorProfile = await getUserProfile(question.createdBy);
    const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };

    // Get answers count (already in question data)
    const answersCount = question.answersCount || 0;

    // Check if current user upvoted
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, questionDoc.id, 'question') : false;

    questions.push({
      id: questionDoc.id,
      title: question.title,
      description: question.description,
      authorName: author.name,
      author,
      authorId: question.createdBy,
      category: question.category || 'General',
      tags: question.tags || [],
      upvotes: question.upvotesCount || 0,
      answersCount,
      status: answersCount > 0 ? 'answered' : 'open',
      createdAt: question.createdAt?.toDate() || new Date(),
      updatedAt: question.createdAt?.toDate() || new Date(),
      views: 0, // Not tracked in new system
      answers: [], // We'll load answers separately for performance
      userUpvoted,
      isTrending: (question.upvotesCount || 0) > 5 || answersCount > 2
    });
  }

  return questions;
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

export const createAnswer = async (questionId: string, content: string): Promise<{ success: boolean; answerId?: string; message?: string; answer?: any }> => {
  const postAnswerFunction = httpsCallable(functions, 'postAnswer');
  const result = await postAnswerFunction({
    questionId,
    content
  });
  return result.data as any;
};

export const getAnswersForQuestion = async (questionId: string): Promise<AnswerWithDetails[]> => {
  const q = query(answersRef, where('questionId', '==', questionId), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);

  const answers: AnswerWithDetails[] = [];
  const auth = getAuth();
  const currentUser = auth.currentUser;

  for (const answerDoc of querySnapshot.docs) {
    const answerData = answerDoc.data();

    // Get author info
    const authorProfile = await getUserProfile(answerData.createdBy);
    const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };

    // Check if current user upvoted
    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, answerDoc.id, 'answer') : false;

    answers.push({
      id: answerDoc.id,
      postId: questionId,
      content: answerData.content,
      authorName: author.name,
      author,
      authorId: answerData.createdBy,
      upvotes: answerData.upvotesCount || 0,
      isAccepted: false, // Not implemented in this version
      createdAt: answerData.createdAt?.toDate() || new Date(),
      updatedAt: answerData.createdAt?.toDate() || new Date(),
      userUpvoted
    });
  }

  return answers;
};

export const getAnswersForPost = getAnswersForQuestion; // Alias

export const updateAnswer = async (answerId: string, updates: Partial<Answer>): Promise<void> => {
  await updateDoc(doc(answersRef, answerId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

// ============================================================================
// UPVOTE SYSTEM
// ============================================================================

export const upvoteQuestion = async (questionId: string): Promise<{ success: boolean; message?: string }> => {
  const upvoteQuestionFunction = httpsCallable(functions, 'upvoteQuestion');
  const result = await upvoteQuestionFunction({ questionId });
  return result.data as any;
};

export const upvoteAnswer = async (answerId: string): Promise<{ success: boolean; message?: string }> => {
  const upvoteAnswerFunction = httpsCallable(functions, 'upvoteAnswer');
  const result = await upvoteAnswerFunction({ answerId });
  return result.data as any;
};

export const hasUserUpvoted = async (userId: string, targetId: string, targetType: 'question' | 'answer'): Promise<boolean> => {
  try {
    const collectionName = targetType === 'question' ? 'questionUpvotes' : 'answerUpvotes';
    const upvotesRef = collection(db, collectionName);

    const q = query(
      upvotesRef,
      where('userId', '==', userId),
      where(targetType === 'question' ? 'questionId' : 'answerId', '==', targetId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking upvote status:', error);
    return false;
  }
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
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Follow;
  }
  return null;
};

export const getFollowers = async (userId: string): Promise<string[]> => {
  const q = query(followsRef, where('followingId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => (docSnap.data() as any).followerId);
};

export const getFollowing = async (userId: string): Promise<string[]> => {
  const q = query(followsRef, where('followerId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => (docSnap.data() as any).followingId);
};

// ============================================================================
// LEADERBOARD
// ============================================================================

export const generateLeaderboard = async (): Promise<{ success: boolean; leaderboard?: LeaderboardEntry[]; message?: string }> => {
  try {
    const generateLeaderboardFunction = httpsCallable(functions, 'generateLeaderboard');
    const result = await generateLeaderboardFunction({});
    const data = result.data as any;

    // Transform backend fields to frontend types if necessary
    const leaderboard = (data.leaderboard || []).map((user: any) => ({
      userId: user.userId,
      name: user.name,
      totalUpvotesReceived: user.totalUpvotes || 0,
      postsCount: user.questionsPosted || 0,
      answersCount: user.answersPosted || 0,
      reputation: user.score || 0,
      rank: user.rank
    }));

    return { success: true, leaderboard };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Leaderboard generation failed. Returning mock data.', error.message);
      return {
        success: true,
        leaderboard: [
          { userId: 'u1', name: 'Arjun Reddy', totalUpvotesReceived: 125, answersCount: 42, postsCount: 12, reputation: 125042, rank: 1 },
          { userId: 'u2', name: 'Priya Sharma', totalUpvotesReceived: 98, answersCount: 35, postsCount: 8, reputation: 98035, rank: 2 },
          { userId: 'u3', name: 'Siddharth Malhotra', totalUpvotesReceived: 85, answersCount: 28, postsCount: 15, reputation: 85028, rank: 3 },
          { userId: 'u4', name: 'Ananya Iyer', totalUpvotesReceived: 72, answersCount: 22, postsCount: 5, reputation: 72022, rank: 4 },
          { userId: 'u5', name: 'Vikram Singh', totalUpvotesReceived: 65, answersCount: 18, postsCount: 10, reputation: 65018, rank: 5 }
        ],
        message: "Development Mock Data"
      };
    }
    throw error;
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardDoc = await getDoc(doc(db, 'leaderboard/current'));
    if (leaderboardDoc.exists()) {
      const data = leaderboardDoc.data();
      return (data.users || []).map((user: any) => ({
        userId: user.userId,
        name: user.name,
        totalUpvotesReceived: user.totalUpvotes || 0,
        postsCount: user.questionsPosted || 0,
        answersCount: user.answersPosted || 0,
        reputation: user.score || 0,
        rank: user.rank
      }));
    }
  } catch (error) {
    console.warn('Could not fetch stored leaderboard:', error);
  }

  const result = await generateLeaderboard();
  return result.leaderboard || [];
};

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

export const searchQuestions = async (searchTerm: string, category?: string): Promise<PostWithDetails[]> => {
  const allQuestions = await getQuestions({ category });
  return allQuestions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    question.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const subscribeToPost = (postId: string, callback: (post: PostWithDetails) => void) => {
  return onSnapshot(doc(postsRef, postId), async (docSnap) => {
    if (docSnap.exists()) {
      const post = await getPost(postId);
      if (post) callback(post);
    }
  });
};

export const subscribeToAnswers = (postId: string, callback: (answers: AnswerWithDetails[]) => void) => {
  const q = query(answersRef, where('questionId', '==', postId), orderBy('createdAt', 'asc'));

  return onSnapshot(q, async (querySnapshot) => {
    const answers = await getAnswersForQuestion(postId);
    callback(answers);
  });
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile) => void) => {
  return onSnapshot(doc(usersRef, userId), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile: UserProfile = {
        userId: data?.userId || userId,
        name: data?.name || '',
        followersCount: data?.followersCount || 0,
        followingCount: data?.followingCount || 0,
        postsCount: data?.postsCount || 0,
        answersCount: data?.answersCount || 0,
        totalUpvotesReceived: data?.totalUpvotesReceived || 0,
        reputation: data?.reputation || 0,
        badges: data?.badges || [],
        joinedAt: data?.joinedAt?.toDate() || new Date(),
        lastActive: data?.lastActive?.toDate() || new Date()
      };
      callback(profile);
    }
  });
};
