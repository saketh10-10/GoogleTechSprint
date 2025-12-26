// IssueHub Firebase Services - Optimized for Performance
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
import { db, getDb } from './firebase';
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

// Safe collection reference creation with validation
const safeCollection = (collectionName: string) => {
  try {
    const firestore = getDb(); // Use helper function to ensure db is initialized
    if (!firestore || typeof firestore !== 'object') {
      throw new Error(`Firestore not initialized properly`);
    }
    return collection(firestore, collectionName);
  } catch (error: any) {
    console.error(`Failed to create collection reference for "${collectionName}":`, error);
    throw new Error(`Failed to create collection reference for "${collectionName}": ${error.message}`);
  }
};

// Collection reference getters - created lazily to avoid initialization issues
const getUsersRef = () => safeCollection('users');
const getQuestionsRef = () => safeCollection('questions');
const getPostsRef = () => safeCollection('questions');
const getAnswersRef = () => safeCollection('answers');
const getFollowsRef = () => safeCollection('follows');

/**
 * CACHE SYSTEM
 * Prevents redundant network calls during a single session/page load
 */
const profileCache: Map<string, UserProfile> = new Map();

// Helper to batch fetch profiles
const getBatchProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  const uniqueIds = Array.from(new Set(userIds)).filter(id => !profileCache.has(id));

  if (uniqueIds.length > 0) {
    // Fetch unique profiles in parallel and cache them
    await Promise.all(uniqueIds.map(async (id) => {
      const profile = await getUserProfile(id);
      if (profile) profileCache.set(id, profile);
    }));
  }

  const result: Record<string, UserProfile> = {};
  userIds.forEach(id => {
    const cached = profileCache.get(id);
    if (cached) result[id] = cached;
  });
  return result;
};

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

  await addDoc(getUsersRef(), userProfile);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Check cache first
  if (profileCache.has(userId)) return profileCache.get(userId) || null;

  try {
    const userDoc = await getDoc(doc(getUsersRef(), userId));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    const profile = {
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

    profileCache.set(userId, profile);
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  await updateDoc(doc(getUsersRef(), userId), updates);
  profileCache.delete(userId); // Invalidate cache
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

  await updateDoc(doc(getUsersRef(), userId), updates);
  profileCache.delete(userId); // Invalidate cache
};

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

export const createQuestion = async (questionData: {
  title: string;
  description: string;
  tags?: string[]
}): Promise<{ success: boolean; questionId?: string; similarQuestions?: any[]; message?: string; question?: any }> => {
  try {
    const createQuestionFunction = httpsCallable(functions, 'createQuestion');
    const result = await createQuestionFunction(questionData);
    return result.data as any;
  } catch (error: any) {
    // If using demo-project without emulators, return mock success in development
    const isDemoProject = db.app.options.projectId === 'demo-project';
    const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

    if (isDemoProject && !useEmulators && process.env.NODE_ENV === 'development') {
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'student';
      console.warn('⚠️ createQuestion Cloud Function failed. Returning mock success for demo.');
      return {
        success: true,
        questionId: 'mock-q-' + Date.now(),
        question: {
          id: 'mock-q-' + Date.now(),
          ...questionData,
          createdBy: getAuth().currentUser?.uid || 'anonymous',
          createdByRole: userRole,
          createdAt: new Date()
        },
        message: "Development Mock Success (Demo Project Mode)"
      };
    }
    throw error;
  }
};

export const getPost = async (postId: string): Promise<PostWithDetails | null> => {
  const postDoc = await getDoc(doc(getPostsRef(), postId));
  if (!postDoc.exists()) return null;

  const data = postDoc.data();
  const post = { id: postDoc.id, ...data } as Post;

  // NO LONGER fetching answers with the post details to keep it separate per requirements
  const authorProfile = await getUserProfile(post.authorId);
  const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };

  // Check if current user upvoted
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, postId, 'question') : false;

  return {
    ...post,
    authorName: author.name,
    author,
    answers: [], // Initial state is empty, fetch separately
    userUpvoted
  };
};

export const getQuestions = async (options: {
  category?: string;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
} = {}): Promise<PostWithDetails[]> => {
  // REQUIREMENT 5: Default limit increased to handle smaller initial sets accurately
  const fetchLimit = options.limit || 10;

  let q = query(getQuestionsRef(), orderBy('createdAt', 'desc'), limit(fetchLimit));

  if (options.category && options.category !== 'All') {
    q = query(getQuestionsRef(), where('category', '==', options.category), orderBy('createdAt', 'desc'), limit(fetchLimit));
  }

  if (options.startAfter) {
    q = query(q, startAfter(options.startAfter));
  }

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs;

  // 1. Collect all author IDs to fetch in parallel
  const authorIds = docs.map(doc => doc.data().createdBy);
  const authorsMap = await getBatchProfiles(authorIds);

  // 2. Fetch upvote status for current user if applicable
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Process results
  const questions: PostWithDetails[] = await Promise.all(docs.map(async (questionDoc) => {
    const question = questionDoc.data();
    const authorProfile = authorsMap[question.createdBy];
    const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };
    const answersCount = question.answersCount || 0;

    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, questionDoc.id, 'question') : false;

    const safeDate = (timestamp: any) => {
      if (!timestamp) return new Date();
      if (typeof timestamp.toDate === 'function') return timestamp.toDate();
      return new Date(timestamp);
    };

    return {
      id: questionDoc.id,
      title: question.title,
      description: question.description,
      authorName: author.name,
      author,
      authorId: question.createdBy,
      createdByRole: question.createdByRole || 'student',
      category: question.category || 'General',
      tags: question.tags || [],
      upvotes: (question.upvotesCount || question.upvotes || 0),
      answersCount,
      status: answersCount > 0 ? 'answered' : 'open',
      createdAt: safeDate(question.createdAt),
      updatedAt: safeDate(question.updatedAt || question.createdAt),
      views: 0,
      answers: [],
      userUpvoted,
      isTrending: (question.upvotesCount || question.upvotes || 0) > 5 || answersCount > 2
    } as PostWithDetails;
  }));

  return questions;
};

export const updatePost = async (postId: string, updates: Partial<Post>): Promise<void> => {
  await updateDoc(doc(getPostsRef(), postId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

export const incrementPostViews = async (postId: string): Promise<void> => {
  await updateDoc(doc(getPostsRef(), postId), {
    views: increment(1)
  });
};

// ============================================================================
// ANSWER MANAGEMENT
// ============================================================================

export const createAnswer = async (questionId: string, content: string): Promise<{ success: boolean; answerId?: string; message?: string; answer?: any }> => {
  try {
    const postAnswerFunction = httpsCallable(functions, 'postAnswer');
    const result = await postAnswerFunction({
      questionId,
      content
    });
    return result.data as any;
  } catch (error: any) {
    const isDemoProject = db.app.options.projectId === 'demo-project';
    const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

    if (isDemoProject && !useEmulators && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ createAnswer Cloud Function failed. Returning mock success for demo.');
      return {
        success: true,
        answerId: 'mock-a-' + Date.now(),
        message: "Development Mock Success (Demo Project Mode)"
      };
    }
    throw error;
  }
};

export const getAnswersForQuestion = async (questionId: string, limitCount: number = 5): Promise<AnswerWithDetails[]> => {
  // REQUIREMENT 6: Fetch with limit
  const q = query(
    getAnswersRef(),
    where('questionId', '==', questionId),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs;

  // Batch fetch authors
  const authorIds = docs.map(doc => doc.data().createdBy);
  const authorsMap = await getBatchProfiles(authorIds);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const answers: AnswerWithDetails[] = await Promise.all(docs.map(async (answerDoc) => {
    const answerData = answerDoc.data();
    const authorProfile = authorsMap[answerData.createdBy];
    const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };
    const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, answerDoc.id, 'answer') : false;

    return {
      id: answerDoc.id,
      postId: questionId,
      content: answerData.content,
      authorName: author.name,
      author,
      authorId: answerData.createdBy,
      createdByRole: answerData.createdByRole || 'student',
      upvotes: answerData.upvotesCount || 0,
      isAccepted: false,
      createdAt: answerData.createdAt?.toDate() || new Date(),
      updatedAt: answerData.createdAt?.toDate() || new Date(),
      userUpvoted
    } as AnswerWithDetails;
  }));

  return answers;
};

export const getAnswersForPost = getAnswersForQuestion; // Alias

export const updateAnswer = async (answerId: string, updates: Partial<Answer>): Promise<void> => {
  await updateDoc(doc(getAnswersRef(), answerId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

// ============================================================================
// UPVOTE SYSTEM
// ============================================================================

export const upvoteQuestion = async (questionId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const upvoteQuestionFunction = httpsCallable(functions, 'upvoteQuestion');
    const result = await upvoteQuestionFunction({ questionId });
    return result.data as any;
  } catch (error: any) {
    const isDemoProject = db.app.options.projectId === 'demo-project';
    const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

    if (isDemoProject && !useEmulators && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ upvoteQuestion Cloud Function failed. Returning mock success for demo.');
      return { success: true, message: "Development Mock Success" };
    }
    throw error;
  }
};

export const upvoteAnswer = async (answerId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const upvoteAnswerFunction = httpsCallable(functions, 'upvoteAnswer');
    const result = await upvoteAnswerFunction({ answerId });
    return result.data as any;
  } catch (error: any) {
    const isDemoProject = db.app.options.projectId === 'demo-project';
    const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

    if (isDemoProject && !useEmulators && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ upvoteAnswer Cloud Function failed. Returning mock success for demo.');
      return { success: true, message: "Development Mock Success" };
    }
    throw error;
  }
};

export const hasUserUpvoted = async (userId: string, targetId: string, targetType: 'question' | 'answer'): Promise<boolean> => {
  try {
    if (!db || typeof db !== 'object') {
      console.error('Firestore not initialized');
      return false;
    }

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
    await deleteDoc(doc(getFollowsRef(), existingFollow.id));
    await updateUserStats(followerId, { followingCount: -1 });
    await updateUserStats(followingId, { followersCount: -1 });
    return false;
  } else {
    await addDoc(getFollowsRef(), {
      followerId,
      followingId,
      createdAt: Timestamp.fromDate(new Date())
    });
    await updateUserStats(followerId, { followingCount: 1 });
    await updateUserStats(followingId, { followersCount: 1 });
    return true;
  }
};

export const isUserFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const follow = await getFollowRelationship(followerId, followingId);
  return !!follow;
};

const getFollowRelationship = async (followerId: string, followingId: string): Promise<Follow | null> => {
  const q = query(
    getFollowsRef(),
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
  const q = query(getFollowsRef(), where('followingId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => (docSnap.data() as any).followerId);
};

export const getFollowing = async (userId: string): Promise<string[]> => {
  const q = query(getFollowsRef(), where('followerId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => (docSnap.data() as any).followingId);
};

// ============================================================================
// LEADERBOARD
// ============================================================================

export const generateLeaderboard = async (): Promise<{ success: boolean; leaderboard?: LeaderboardEntry[]; message?: string }> => {
  // REQUIREMENT 7: This function should only be called by background processes or manually
  const isDemoProject = db.app.options.projectId === 'demo-project';
  const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

  if (isDemoProject && !useEmulators && process.env.NODE_ENV === 'development') {
    return {
      success: true,
      leaderboard: [
        { userId: 'u1', name: 'Arjun Reddy', totalUpvotesReceived: 125, answersCount: 42, postsCount: 12, reputation: 125042, rank: 1 },
        { userId: 'u2', name: 'Priya Sharma', totalUpvotesReceived: 98, answersCount: 35, postsCount: 8, reputation: 98035, rank: 2 },
        { userId: 'u3', name: 'Siddharth Malhotra', totalUpvotesReceived: 85, answersCount: 28, postsCount: 15, reputation: 85028, rank: 3 },
        { userId: 'u4', name: 'Ananya Iyer', totalUpvotesReceived: 72, answersCount: 22, postsCount: 5, reputation: 72022, rank: 4 },
        { userId: 'u5', name: 'Vikram Singh', totalUpvotesReceived: 65, answersCount: 18, postsCount: 10, reputation: 65018, rank: 5 }
      ],
      message: "Development Mock Data (Demo Project Mode)"
    };
  }

  try {
    const generateLeaderboardFunction = httpsCallable(functions, 'generateLeaderboard');
    const result = await generateLeaderboardFunction({});
    const data = result.data as any;

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
  // REQUIREMENT 7 & 15: Direct Read ONLY
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

  // Only if direct read fails and we are in dev, show the mock data directly without calling cloud function
  if (process.env.NODE_ENV === 'development') {
    return [
      { userId: 'u1', name: 'Arjun Reddy', totalUpvotesReceived: 125, answersCount: 42, postsCount: 12, reputation: 125042, rank: 1 },
      { userId: 'u2', name: 'Priya Sharma', totalUpvotesReceived: 98, answersCount: 35, postsCount: 8, reputation: 98035, rank: 2 },
      { userId: 'u3', name: 'Siddharth Malhotra', totalUpvotesReceived: 85, answersCount: 28, postsCount: 15, reputation: 85028, rank: 3 },
      { userId: 'u4', name: 'Ananya Iyer', totalUpvotesReceived: 72, answersCount: 22, postsCount: 5, reputation: 72022, rank: 4 },
      { userId: 'u5', name: 'Vikram Singh', totalUpvotesReceived: 65, answersCount: 18, postsCount: 10, reputation: 65018, rank: 5 }
    ];
  }

  return [];
};

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

export const searchQuestions = async (searchTerm: string, category?: string): Promise<PostWithDetails[]> => {
  // For simplicity but following limit requirements, we fetch limited set and filter locally
  const allQuestions = await getQuestions({ category, limit: 10 });
  return allQuestions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    question.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const subscribeToQuestions = (callback: (questions: PostWithDetails[]) => void, options: { category?: string; limit?: number } = {}) => {
  let q = query(getQuestionsRef(), orderBy('createdAt', 'desc'));

  if (options.category && options.category !== 'All') {
    q = query(q, where('category', '==', options.category));
  }

  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  return onSnapshot(q, async (querySnapshot) => {
    const docs = querySnapshot.docs;
    const authorIds = docs.map(doc => doc.data().createdBy);
    const authorsMap = await getBatchProfiles(authorIds);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const questions: PostWithDetails[] = await Promise.all(docs.map(async (questionDoc) => {
      const question = questionDoc.data();
      const authorProfile = authorsMap[question.createdBy];
      const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };
      const answersCount = question.answersCount || 0;
      const userUpvoted = currentUser ? await hasUserUpvoted(currentUser.uid, questionDoc.id, 'question') : false;

      const safeDate = (timestamp: any) => {
        if (!timestamp) return new Date();
        if (typeof timestamp.toDate === 'function') return timestamp.toDate();
        return new Date(timestamp);
      };

      return {
        id: questionDoc.id,
        title: question.title,
        description: question.description,
        authorName: author.name,
        author,
        authorId: question.createdBy,
        createdByRole: question.createdByRole || 'student',
        category: question.category || 'General',
        tags: question.tags || [],
        upvotes: (question.upvotesCount || question.upvotes || 0),
        answersCount,
        status: answersCount > 0 ? 'answered' : 'open',
        createdAt: safeDate(question.createdAt),
        updatedAt: safeDate(question.updatedAt || question.createdAt),
        views: 0,
        answers: [],
        userUpvoted,
        isTrending: (question.upvotesCount || question.upvotes || 0) > 5 || answersCount > 2
      } as PostWithDetails;
    }));

    callback(questions);
  });
};

export const subscribeToPost = (postId: string, callback: (post: PostWithDetails) => void) => {
  return onSnapshot(doc(getPostsRef(), postId), async (docSnap) => {
    if (docSnap.exists()) {
      const post = await getPost(postId);
      if (post) callback(post);
    }
  });
};

export const subscribeToAnswers = (postId: string, callback: (answers: AnswerWithDetails[]) => void) => {
  const q = query(
    getAnswersRef(),
    where('questionId', '==', postId),
    orderBy('createdAt', 'asc'),
    limit(20)
  );

  return onSnapshot(q, async (querySnapshot) => {
    const docs = querySnapshot.docs;
    const authorIds = docs.map(doc => doc.data().createdBy);
    const authorsMap = await getBatchProfiles(authorIds);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const answers: AnswerWithDetails[] = docs.map((answerDoc) => {
      const answerData = answerDoc.data();
      const authorProfile = authorsMap[answerData.createdBy];
      const author = authorProfile ? { name: authorProfile.name, avatar: '' } : { name: 'Unknown User', avatar: '' };

      // We can't do async inside map for onSnapshot efficiently without Promise.all
      // but for upvote status we'll just check if it's in the data if the cloud function stores it
      // or we can just accept that real-time upvotes for specific user might need another listener

      return {
        id: answerDoc.id,
        postId: postId,
        content: answerData.content,
        authorName: author.name,
        author,
        authorId: answerData.createdBy,
        createdByRole: answerData.createdByRole || 'student',
        upvotes: answerData.upvotesCount || 0,
        isAccepted: false,
        createdAt: answerData.createdAt?.toDate() || new Date(),
        updatedAt: answerData.createdAt?.toDate() || new Date(),
        userUpvoted: false // This would need separate handling
      };
    });
    callback(answers);
  });
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile) => void) => {
  return onSnapshot(doc(getUsersRef(), userId), (docSnap) => {
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
