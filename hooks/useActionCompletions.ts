import { useState, useEffect, useCallback } from 'react';
import { goalsApi } from '../services/goalsApi';

export interface ActionCompletionStats {
  goal_id: string;
  week_start: string;
  week_end: string;
  total_scheduled_days: number;
  completed_days: number;
  overall_completion_percentage: number;
  daily_stats: Array<{
    date: string;
    total_scheduled_items: number;
    completed_items: number;
    completion_percentage: number;
    action_items: string[];
  }>;
}

export const useActionCompletions = (userEmail: string) => {
  const [completionStats, setCompletionStats] = useState<Record<string, ActionCompletionStats>>({});
  const [todaysItems, setTodaysItems] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return monday.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const loadCompletionStats = useCallback(
    async (weekStart?: string) => {
      if (!userEmail) return;

      setLoading(true);
      setError(null);

      try {
        const week = weekStart || getCurrentWeekStart();
        const stats = await goalsApi.getAllGoalsCompletionStats(userEmail, week);
        setCompletionStats(stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load completion stats';
        setError(message);
        console.error('Error loading completion stats:', err);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const markCompletion = useCallback(
    async (actionItemId: string, completed: boolean = true) => {
      if (!actionItemId) {
        setError('Action item ID is required');
        return false;
      }

      console.log(`Marking action item ${actionItemId} as ${completed ? 'completed' : 'not completed'}`);

      const weekDayIndex = new Date().getDay() - 1;

      try {
        const res = await goalsApi.markActionItemCompletion(actionItemId, weekDayIndex, completed);
        if (res.success) {
          return true;
        }
        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark completion';
        setError(message);
        console.error('Error marking completion:', err);
        return false;
      }
    },
    [userEmail],
  );

  const getGoalCompletionPercentage = useCallback(
    (goalId: string): number => {
      const stats = completionStats[goalId];
      return stats ? stats.overall_completion_percentage : 0;
    },
    [completionStats],
  );

  const getTodayCompletionForGoal = useCallback(
    (goalId: string) => {
      const stats = completionStats[goalId];
      if (!stats) return null;

      const today = new Date().toISOString().split('T')[0];
      const todayStats = stats.daily_stats.find((day) => {
        const statsDate = new Date(day.date).toISOString().split('T')[0];
        return statsDate === today;
      });
      return todayStats || null;
    },
    [completionStats],
  );

  const loadTodaysItems = useCallback(async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const items = await goalsApi.getTodaysActionItems(userEmail);
      console.log("Today's action items:", items);
      setTodaysItems(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load today's action items";
      setError(message);
      console.error("Error loading today's action items:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Load initial completion stats
  useEffect(() => {
    // loadCompletionStats();
    loadTodaysItems();
  }, [loadTodaysItems]);

  return {
    completionStats,
    loading,
    error,
    todaysItems,
    loadCompletionStats,
    markCompletion,
    getGoalCompletionPercentage,
    getTodayCompletionForGoal,
    loadTodaysItems,
  };
};
