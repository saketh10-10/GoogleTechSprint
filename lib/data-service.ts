/**
 * Optimized Data Service Layer
 * Handles all Firestore queries with caching and batching
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getCachedData, setCachedData } from './cache';

interface DashboardMetrics {
  todaysEvents: number;
  attendanceMarked: number;
  roomsAllocated: number;
  openIssues: number;
}

interface TodayOverview {
  upcomingEvents: any[];
  todayAllocations: any[];
  activeQRSession: any | null;
}

export class DataService {
  /**
   * Get events with caching and limit
   */
  static async getEvents(maxResults = 50, useCache = true) {
    const cacheKey = `events_${maxResults}`;
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const q = query(
        collection(db, 'events'),
        orderBy('date', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get today's events only
   */
  static async getTodayEvents(useCache = true) {
    const cacheKey = 'events_today';
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      const q = query(
        collection(db, 'events'),
        where('date', '>=', todayTimestamp),
        orderBy('date', 'asc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching today events:', error);
      return [];
    }
  }

  /**
   * Get dashboard metrics with batched queries
   * Most optimized - fetches all metrics in parallel
   */
  static async getDashboardMetrics(useCache = true): Promise<DashboardMetrics> {
    const cacheKey = 'dashboard_metrics';
    
    if (useCache) {
      const cached = getCachedData<DashboardMetrics>(cacheKey, 2 * 60 * 1000); // 2 min cache
      if (cached) return cached;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Parallel batched queries
      const [eventsSnap, attendanceSnap, allocationsSnap, issuesSnap] =
        await Promise.all([
          getDocs(
            query(
              collection(db, 'events'),
              where('date', '>=', todayTimestamp),
              limit(100)
            )
          ),
          getDocs(query(collection(db, 'attendance'), limit(500))),
          getDocs(query(collection(db, 'allocations'), limit(200))),
          getDocs(
            query(
              collection(db, 'posts'),
              where('status', '==', 'open'),
              limit(100)
            )
          ),
        ]);

      // Calculate today's events
      const todaysEvents = eventsSnap.docs.filter((doc) => {
        const eventDate = doc.data().date?.toDate();
        return eventDate && eventDate.toDateString() === today.toDateString();
      }).length;

      // Calculate attendance percentage
      const totalAttendance = attendanceSnap.size;
      const markedToday = attendanceSnap.docs.filter((doc) => {
        const markedAt = doc.data().markedAt?.toDate();
        return markedAt && markedAt.toDateString() === today.toDateString();
      }).length;
      const attendancePercentage =
        totalAttendance > 0
          ? Math.round((markedToday / totalAttendance) * 100)
          : 0;

      // Calculate rooms allocated today
      const roomsAllocatedToday = allocationsSnap.docs.filter((doc) => {
        const allocDate = doc.data().createdAt?.toDate();
        return allocDate && allocDate.toDateString() === today.toDateString();
      }).length;

      const metrics = {
        todaysEvents,
        attendanceMarked: attendancePercentage,
        roomsAllocated: roomsAllocatedToday,
        openIssues: issuesSnap.size,
      };

      setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        todaysEvents: 0,
        attendanceMarked: 0,
        roomsAllocated: 0,
        openIssues: 0,
      };
    }
  }

  /**
   * Get today's overview data (events, allocations)
   */
  static async getTodayOverview(useCache = true): Promise<TodayOverview> {
    const cacheKey = 'today_overview';
    
    if (useCache) {
      const cached = getCachedData<TodayOverview>(cacheKey, 3 * 60 * 1000); // 3 min cache
      if (cached) return cached;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Parallel queries
      const [eventsSnap, allocationsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'events'),
            where('date', '>=', todayTimestamp),
            orderBy('date', 'asc'),
            limit(5)
          )
        ),
        getDocs(query(collection(db, 'allocations'), limit(100))),
      ]);

      const upcomingEvents = eventsSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        date: doc.data().date?.toDate() || new Date(),
        venue: doc.data().venue || 'TBD',
        time: doc.data().time,
      }));

      const todayAllocations = allocationsSnap.docs
        .filter((doc) => {
          const allocDate = doc.data().createdAt?.toDate();
          return (
            allocDate && allocDate.toDateString() === today.toDateString()
          );
        })
        .slice(0, 3)
        .map((doc) => ({
          id: doc.id,
          roomNumber: doc.data().roomNumber || 'N/A',
          section: doc.data().section || 'N/A',
          subject: doc.data().subject || 'General',
        }));

      // Detect active QR session
      const now = new Date();
      const activeEvent = upcomingEvents.find((event) => {
        const timeDiff = Math.abs(now.getTime() - event.date.getTime());
        return timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
      });

      const overview = {
        upcomingEvents: upcomingEvents.slice(0, 3),
        todayAllocations,
        activeQRSession: activeEvent || null,
      };

      setCachedData(cacheKey, overview);
      return overview;
    } catch (error) {
      console.error('Error fetching today overview:', error);
      return {
        upcomingEvents: [],
        todayAllocations: [],
        activeQRSession: null,
      };
    }
  }

  /**
   * Get open issues from IssueHub
   */
  static async getOpenIssues(maxResults = 20, useCache = true) {
    const cacheKey = `issues_open_${maxResults}`;
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching open issues:', error);
      return [];
    }
  }

  /**
   * Get room allocations
   */
  static async getAllocations(maxResults = 50, useCache = true) {
    const cacheKey = `allocations_${maxResults}`;
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const q = query(
        collection(db, 'allocations'),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching allocations:', error);
      return [];
    }
  }
}
