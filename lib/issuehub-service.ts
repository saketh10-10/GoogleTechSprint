// IssueHub Firebase Services - Updated for Cloud Functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
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
const answersRef = collection(db, 'answers');

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
    id: userDoc.id,
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
  } as UserProfile;
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
    const author = authorProfile ? { name: authorProfile.name, email: authorProfile.userId } : { name: 'Unknown User', email: question.createdBy };

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
    const author = authorProfile ? { name: authorProfile.name, email: authorProfile.userId } : { name: 'Unknown User', email: answerData.createdBy };

    // Check if current user upvoted
    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, answerDoc.id, 'answer') : false;

    answers.push({
      id: answerDoc.id,
      content: answerData.content,
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

export const generateLeaderboard = async (): Promise<{ success: boolean; leaderboard?: LeaderboardEntry[]; message?: string }> => {
  const generateLeaderboardFunction = httpsCallable(functions, 'generateLeaderboard');
  const result = await generateLeaderboardFunction({});
  return result.data as any;
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  // First try to get from the stored leaderboard
  try {
    const leaderboardDoc = await getDoc(doc(db, 'leaderboard/current'));
    if (leaderboardDoc.exists()) {
      const data = leaderboardDoc.data();
      return data.users || [];
    }
  } catch (error) {
    console.error('Error fetching stored leaderboard:', error);
  }

  // If no stored leaderboard, generate a new one
  const result = await generateLeaderboard();
  return result.leaderboard || [];
};

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

export const searchQuestions = async (searchTerm: string, category?: string): Promise<PostWithDetails[]> => {
  // Note: Firestore doesn't support full-text search natively
  // In production, you'd use Algolia, ElasticSearch, or Firestore's text search extensions

  // For now, we'll do a basic title and tags search
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
      const data = doc.data();
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
