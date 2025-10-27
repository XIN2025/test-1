import { useCallback, useEffect, useState, useRef } from 'react';
import { goalsApi } from '../services/goalsApi';
import { Goal, GoalCreate, GoalStats, GoalUpdate, WeeklyReflection } from '../types/goals';

interface UseGoalsOptions {
  userEmail: string;
  autoLoad?: boolean;
}

export const useGoals = ({ userEmail, autoLoad = true }: UseGoalsOptions) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [todaysItems, setTodaysItems] = useState<any[]>([]);
  const actionItemsLoadedRef = useRef(false);
  const loadGoals = useCallback(async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const goalsData = await goalsApi.getUserGoals(userEmail);

      setGoals(goalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const getGoalCompletionPercentage = useCallback(async (goalId: string): Promise<number> => {
    const actionItems = await goalsApi.getGoalActionItems(goalId);
    console.log('actionItems', actionItems);
    if (!actionItems || actionItems.length === 0) return 0;
    const totalItems = actionItems.length;
    console.log('totalItems', totalItems);

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalCompletedSlots = 0;
    let totalPossibleSlots = 0;

    actionItems.forEach((item) => {
      const weeklySchedule = item.weekly_schedule || {};
      console.log(`📋 Processing item ${item.id}:`, {
        title: item.title,
        weeklySchedule,
      });

      weekdays.forEach((day) => {
        const scheduleForDay = weeklySchedule[day];

        if (scheduleForDay) {
          totalPossibleSlots++;
          if (scheduleForDay.complete) {
            totalCompletedSlots++;
          }
        }
      });
    });

    const completionPercentage =
      totalPossibleSlots > 0 ? Math.round((totalCompletedSlots / totalPossibleSlots) * 100) : 0;

    console.log(`✅ Completion: ${totalCompletedSlots}/${totalPossibleSlots} = ${completionPercentage}%`);
    return completionPercentage;
  }, []);

  const loadActionItemsAndCompletion = useCallback(
    async (currentGoals: Goal[]) => {
      if (actionItemsLoadedRef.current) return;

      try {
        actionItemsLoadedRef.current = true;

        const updatedGoals = await Promise.all(
          currentGoals.map(async (goal) => {
            console.log('Loading action items for goal:', goal.id);
            const actionItems = await goalsApi.getGoalActionItems(goal.id);
            const completionPercentage = await getGoalCompletionPercentage(goal.id);
            console.log(`Goal ${goal.id} - Completion Percentage: ${completionPercentage}%`);
            return { ...goal, action_items: actionItems, completion_percentage: completionPercentage } as Goal;
          }),
        );

        setGoals(updatedGoals);
      } catch (err) {
        actionItemsLoadedRef.current = false;
        const message = err instanceof Error ? err.message : 'Failed to load action items';
        setError(message);
      }
    },
    [getGoalCompletionPercentage],
  );

  const loadTodaysItems = useCallback(async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const items = await goalsApi.getTodaysActionItems(userEmail);
      console.log("Today's action items:", items);

      const normalized = (items || []).map((it: any) => ({
        ...it,
        start_time: it.start_time ?? it.startTime,
        end_time: it.end_time ?? it.endTime,
        completed: it.completed ?? it.complete ?? false,
      }));
      setTodaysItems(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load today's action items";
      setError(message);
      console.error("Error loading today's action items:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const markCompletion = useCallback(
    async (actionItemId: string, completed: boolean = true) => {
      if (!actionItemId) {
        setError('Action item ID is required');
        return false;
      }

      console.log(`Marking action item ${actionItemId} as ${completed ? 'completed' : 'not completed'}`);

      const actionItem = todaysItems.find((item) => item.id === actionItemId);
      if (actionItem) {
        actionItem.completed = completed;
        actionItem.complete = completed;
        setTodaysItems([...todaysItems]);
      }

      const weekDayIndex = (new Date().getDay() + 6) % 7;

      try {
        const res = await goalsApi.markActionItemCompletion(actionItemId, weekDayIndex, completed);
        console.log('markActionItemCompletion response:', res);
        if (res.success) {
          const actionItem = todaysItems.find((item) => item.id === actionItemId);
          if (actionItem) {
            actionItem.completed = completed;
            actionItem.complete = completed;
            setTodaysItems([...todaysItems]);

            const goalId = actionItem.goal_id;

            if (goalId) {
              try {
                // Recalculate completion percentage for the goal
                const updatedCompletionPercentage = await getGoalCompletionPercentage(goalId);
                console.log(`✅ Updated completion percentage: ${updatedCompletionPercentage}%`);

                setGoals((prevGoals) =>
                  prevGoals.map((goal) =>
                    goal.id === goalId ? { ...goal, completion_percentage: updatedCompletionPercentage } : goal,
                  ),
                );
              } catch (error) {
                console.error('Error recalculating completion percentage:', error);
              }
            }
          }
          return true;
        }

        if (actionItem) {
          actionItem.completed = !completed;
          actionItem.complete = !completed;
          setTodaysItems([...todaysItems]);
        }
        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark completion';
        setError(message);
        console.error('Error marking completion:', err);

        if (actionItem) {
          actionItem.completed = !completed;
          actionItem.complete = !completed;
          setTodaysItems([...todaysItems]);
        }
        return false;
      }
    },
    [todaysItems, getGoalCompletionPercentage],
  );

  const loadStats = useCallback(
    async (weeks: number = 4) => {
      if (!userEmail) return;

      try {
        const statsData = await goalsApi.getGoalStats(userEmail, weeks);
        if (statsData && 'goal_progress' in statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);

        setStats(null);
      }
    },
    [userEmail],
  );

  const createGoal = useCallback(
    async (goalData: Omit<GoalCreate, 'user_email'>) => {
      if (!userEmail) throw new Error('User email is required');

      setLoading(true);
      setError(null);

      try {
        const newGoal = await goalsApi.createGoal({
          ...goalData,
          user_email: userEmail,
        });
        setGoals((prev) => [newGoal, ...prev]);
        return newGoal;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create goal';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const updateGoal = useCallback(
    async (goalId: string, updateData: GoalUpdate) => {
      setLoading(true);
      setError(null);

      try {
        const updatedGoal = await goalsApi.updateGoal(goalId, updateData, userEmail);
        setGoals((prev) => prev.map((goal) => (goal.id === goalId ? updatedGoal : goal)));
        return updatedGoal;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update goal';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      setLoading(true);
      setError(null);

      try {
        await goalsApi.deleteGoal(goalId, userEmail);
        setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const updateGoalProgress = useCallback(
    async (goalId: string, currentValue: number, note?: string) => {
      setLoading(true);
      setError(null);

      try {
        const updatedGoal = await goalsApi.updateGoalProgress(
          goalId,
          { goal_id: goalId, current_value: currentValue, note },
          userEmail,
        );
        setGoals((prev) => prev.map((goal) => (goal.id === goalId ? updatedGoal : goal)));
        return updatedGoal;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update goal progress';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const addGoalNote = useCallback(
    async (goalId: string, note: string) => {
      setLoading(true);
      setError(null);

      try {
        const updatedGoal = await goalsApi.addGoalNote(goalId, { goal_id: goalId, note }, userEmail);
        setGoals((prev) => prev.map((goal) => (goal.id === goalId ? updatedGoal : goal)));
        return updatedGoal;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add note';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const saveWeeklyReflection = useCallback(
    async (reflectionData: Omit<WeeklyReflection, 'user_email'>) => {
      if (!userEmail) throw new Error('User email is required');

      setLoading(true);
      setError(null);

      try {
        const result = await goalsApi.saveWeeklyReflection({
          ...reflectionData,
          user_email: userEmail,
        });
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save reflection';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userEmail],
  );

  const getWeeklyReflection = useCallback(
    async (weekStart: string) => {
      if (!userEmail) return null;

      try {
        return await goalsApi.getWeeklyReflection(userEmail, weekStart);
      } catch (err) {
        console.error('Failed to get weekly reflection:', err);
        return null;
      }
    },
    [userEmail],
  );

  const getWeeklyProgress = useCallback(
    async (weekStart: string) => {
      if (!userEmail) return null;

      try {
        return await goalsApi.getWeeklyProgress(userEmail, weekStart);
      } catch (err) {
        console.error('Failed to get weekly progress:', err);
        return null;
      }
    },
    [userEmail],
  );

  const getCurrentWeekGoals = useCallback(async () => {
    if (!userEmail) return null;

    try {
      return await goalsApi.getCurrentWeekGoals(userEmail);
    } catch (err) {
      console.error('Failed to get current week goals:', err);
      return null;
    }
  }, [userEmail]);

  useEffect(() => {
    if (autoLoad && userEmail) {
      loadGoals();
      loadTodaysItems();
    }
  }, [userEmail, autoLoad, loadGoals, loadTodaysItems, loadStats]);

  useEffect(() => {
    if (
      goals.length > 0 &&
      !actionItemsLoadedRef.current &&
      goals.some((g) => !('action_items' in g) || g.action_items == null || g.completion_percentage == null)
    ) {
      loadActionItemsAndCompletion(goals);
    }
  }, [goals, loadActionItemsAndCompletion]);

  const refreshGoalsAndCompletion = useCallback(async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      actionItemsLoadedRef.current = false;

      const goalsData = await goalsApi.getUserGoals(userEmail);

      const updatedGoals = await Promise.all(
        goalsData.map(async (goal) => {
          console.log('Refreshing action items for goal:', goal.id);
          const actionItems = await goalsApi.getGoalActionItems(goal.id);
          const completionPercentage = await getGoalCompletionPercentage(goal.id);
          console.log(`Goal ${goal.id} - Completion Percentage: ${completionPercentage}%`);
          return { ...goal, action_items: actionItems, completion_percentage: completionPercentage } as Goal;
        }),
      );

      setGoals(updatedGoals);

      await loadTodaysItems();

      await loadStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh goals';
      setError(message);
      console.error('Error refreshing goals:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, getGoalCompletionPercentage, loadTodaysItems, loadStats]);

  return {
    goals,
    todaysItems,
    loading,
    error,
    stats,
    loadGoals,
    loadStats,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    addGoalNote,
    saveWeeklyReflection,
    getWeeklyReflection,
    getWeeklyProgress,
    getCurrentWeekGoals,
    getGoalCompletionPercentage,
    markCompletion,
    loadTodaysItems,
    refreshGoalsAndCompletion,
  };
};
