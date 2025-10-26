import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useGoals } from '../hooks/useGoals';
import { Goal, GoalCreate, GoalUpdate, GoalStats } from '../types/goals';

interface GoalsContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  stats: GoalStats | null;
  todaysItems: any[];
  createGoal: (goalData: Omit<GoalCreate, 'user_email'>) => Promise<Goal>;
  updateGoal: (goalId: string, updateData: GoalUpdate) => Promise<Goal>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateGoalProgress: (goalId: string, newValue: number) => Promise<Goal>;
  addGoalNote: (goalId: string, note: string) => Promise<Goal>;
  saveWeeklyReflection: (reflectionData: any) => Promise<any>;
  getWeeklyReflection: (weekStart: string) => Promise<any>;
  getWeeklyProgress: (weekStart: string) => Promise<any>;
  getCurrentWeekGoals: () => Promise<any>;
  getGoalCompletionPercentage: (goalId: string) => Promise<number>;
  markCompletion: (actionItemId: string, completed: boolean) => Promise<boolean>;
  loadTodaysItems: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadStats: () => Promise<void>;
  refreshGoals: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const useGoalsContext = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsContext must be used within a GoalsProvider');
  }
  return context;
};

interface GoalsProviderProps {
  children: React.ReactNode;
}

export const GoalsProvider: React.FC<GoalsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const userEmail = user?.email || '';

  const goalsHook = useGoals({ userEmail, autoLoad: true });

  const goalsHookRef = useRef(goalsHook);
  goalsHookRef.current = goalsHook;

  const refreshGoals = useCallback(async () => {
    try {
      await goalsHookRef.current.loadGoals();
      await goalsHookRef.current.loadTodaysItems();
      await goalsHookRef.current.loadStats();
    } catch (error) {
      console.error('❌ Error refreshing goals:', error);
    }
  }, []);

  const contextValue: GoalsContextType = {
    ...goalsHook,
    refreshGoals,
  };

  return <GoalsContext.Provider value={contextValue}>{children}</GoalsContext.Provider>;
};
