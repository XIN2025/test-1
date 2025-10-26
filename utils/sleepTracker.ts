/**
 * Sleep Tracking Utilities
 *
 * Provides Apple Health-like sleep tracking with:
 * - Interval merging to handle overlapping sleep segments
 * - Session detection to group related sleep periods
 * - Realistic sleep duration calculations
 */

export interface SleepInterval {
  start: number;
  end: number;
}

export interface SleepSample {
  startDate: string;
  endDate: string;
  value: number;
}

export interface SleepSession {
  samples: SleepSample[];
  totalDuration: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Helper function to merge overlapping time intervals
 * This prevents double-counting overlapping sleep segments
 */
export function mergeOverlappingIntervals(intervals: SleepInterval[]): SleepInterval[] {
  if (intervals.length === 0) return [];

  // Sort by start time
  const sorted = intervals.sort((a, b) => a.start - b.start);
  const merged: SleepInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    // If current interval overlaps with last merged, extend it
    if (current.start <= lastMerged.end) {
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      // No overlap, add as new interval
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Helper function to group samples into sleep sessions
 * Groups sleep samples that are within a reasonable time gap (default 3 hours)
 */
export function groupIntoSessions(samples: SleepSample[], maxGapHours = 3): SleepSession[] {
  if (samples.length === 0) return [];

  const sorted = [...samples].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const sessions: SleepSession[] = [];
  const maxGapMs = maxGapHours * 60 * 60 * 1000;

  let currentSession: SleepSample[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastSample = currentSession[currentSession.length - 1];

    const gap = new Date(current.startDate).getTime() - new Date(lastSample.endDate).getTime();

    if (gap <= maxGapMs) {
      // Part of same session
      currentSession.push(current);
    } else {
      // Finish current session and start new one
      sessions.push(createSleepSession(currentSession));
      currentSession = [current];
    }
  }

  // Add the last session
  if (currentSession.length > 0) {
    sessions.push(createSleepSession(currentSession));
  }

  return sessions;
}

/**
 * Create a sleep session from a group of samples
 */
function createSleepSession(samples: SleepSample[]): SleepSession {
  const intervals = samples.map((s) => ({
    start: new Date(s.startDate).getTime(),
    end: new Date(s.endDate).getTime(),
  }));

  const merged = mergeOverlappingIntervals(intervals);
  const totalDuration = merged.reduce((sum, interval) => sum + (interval.end - interval.start), 0);

  const startTimes = samples.map((s) => new Date(s.startDate).getTime());
  const endTimes = samples.map((s) => new Date(s.endDate).getTime());

  return {
    samples,
    totalDuration,
    startTime: new Date(Math.min(...startTimes)),
    endTime: new Date(Math.max(...endTimes)),
  };
}

/**
 * Get the primary sleep session (longest duration)
 */
export function getPrimarySleepSession(sessions: SleepSession[]): SleepSession | null {
  if (sessions.length === 0) return null;

  return sessions.reduce((longest, current) => (current.totalDuration > longest.totalDuration ? current : longest));
}

/**
 * Calculate total sleep duration from all sessions
 */
export function getTotalSleepDuration(sessions: SleepSession[]): number {
  return sessions.reduce((total, session) => total + session.totalDuration, 0);
}

/**
 * Get sleep metrics with Apple Health-like behavior
 */
export function calculateSleepMetrics(samples: SleepSample[]): {
  totalHours: number;
  primarySessionHours: number;
  sessionCount: number;
  latestEndTime: Date;
} {
  if (samples.length === 0) {
    return {
      totalHours: 0,
      primarySessionHours: 0,
      sessionCount: 0,
      latestEndTime: new Date(),
    };
  }

  // Group into sessions (3-hour max gap between sleep periods)
  const sessions = groupIntoSessions(samples, 3);

  // Get primary sleep session (longest)
  const primarySession = getPrimarySleepSession(sessions);

  // Calculate total sleep across all sessions
  const totalDuration = getTotalSleepDuration(sessions);

  // Find latest end time
  const latestEndTime = new Date(Math.max(...samples.map((s) => new Date(s.endDate).getTime())));

  return {
    totalHours: totalDuration / (1000 * 60 * 60),
    primarySessionHours: primarySession ? primarySession.totalDuration / (1000 * 60 * 60) : 0,
    sessionCount: sessions.length,
    latestEndTime,
  };
}

/**
 * Get Apple Health-style sleep tracking date range
 * Previous day 12 PM to current day 11:59 AM
 */
export function getSleepTrackingDateRange(): { startDate: Date; endDate: Date } {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Previous day at 12:00 PM (noon) in local timezone
  const startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12, 0, 0, 0);

  // Current day at 11:59 AM in local timezone
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 59, 59, 999);

  return { startDate, endDate };
}
