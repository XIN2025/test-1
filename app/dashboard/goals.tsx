import { CircularProgressRing } from '@/components/CircularProgressRing';
import GoalProgressTracker from '@/components/goals/GoalProgressTracker';
import ActionItemCard from '@/components/goals/ActionItemCard';
import ActionItemScheduleModal from '@/components/goals/ActionItemScheduleModal';
import EmptyGoals from '@/components/goals/EmptyGoals';
import GoalsHeader from '@/components/goals/GoalsHeader';
import LoadingScreen from '@/components/goals/LoadingScreen';
import PreferencesModal from '@/components/goals/PreferencesModal';
import HabitGoalIntegration from '@/components/HabitGoalIntegration';
import { Card } from '@/components/ui/card';
import WeeklyGoalsSummary from '@/components/WeeklyGoalsSummary';
import WeeklyReflection from '@/components/WeeklyReflection';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGoals } from '@/hooks/useGoals';
import { goalsApi } from '@/services/goalsApi';
import { ActionItem, Goal, GoalCategory, GoalFormData, GoalPriority } from '@/types/goals';
import { PillarTimePreferences, PillarType, TimePreference } from '@/types/preferences';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, Trash } from 'lucide-react-native';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddGoalModal from '@/components/goals/AddGoalModal';
import UploadModal from '@/components/goals/UploadModal';

// Extend the Goal interface to include action_plan
interface ExtendedGoal extends Goal {
  action_plan?: {
    goal_id: string;
    goal_title: string;
    action_items: ActionItem[];
    total_estimated_time_per_week: string;
    health_adaptations: string[];
    created_at: string;
    user_email: string;
    id: string;
  };
  weekly_schedule?: {
    start_date: string;
    end_date: string;
    daily_schedules: {
      [key: string]: {
        date: string;
        time_slots: {
          start_time: string;
          end_time: string;
          duration: string;
          pillar: string;
          action_item: string;
          frequency: string | null;
          priority: string | null;
          health_notes: string[];
        }[];
        total_duration: string;
        pillars_covered: string[];
      };
    };
    total_weekly_hours: number;
    pillar_distribution: {
      [key: string]: number;
    };
    health_adaptations: string[];
    schedule_notes: string[];
    goal_id: string;
    user_email: string;
    created_at: string;
    id: string;
  };
}

export interface UploadedFile {
  id: string;
  upload_id: string;
  name: string;
  type: string;
  size: number;
  status: string;
  entities_count: number;
  relationships_count: number;
}

export interface UploadProgress {
  uploadId: string;
  filename: string;
  percentage: number;
  message: string;
  status: 'processing' | 'completed' | 'failed';
  entitiesCount: number;
  relationshipsCount: number;
}

export default function GoalsScreen() {
  const { user } = useAuth();
  const userEmail = user?.email || '';
  const userName = user?.name || '';

  useEffect(() => {
    console.log('Current user context:', {
      userEmail,
      userName,
    });
  }, [userEmail, userName]);

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatingPlan] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatingPlanGoalIds, setGeneratingPlanGoalIds] = useState<string[]>([]);

  // Use the goals hook for backend integration
  const { goals, loading, createGoal, updateGoalProgress, saveWeeklyReflection, loadGoals, deleteGoal } = useGoals({
    userEmail,
  }) as {
    goals: ExtendedGoal[];
    loading: boolean;
    createGoal: Function;
    updateGoal: Function;
    updateGoalProgress: Function;
    addGoalNote: Function;
    saveWeeklyReflection: Function;
    loadGoals: Function;
    deleteGoal: Function;
  };

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Form state for adding/editing goals
  const [formData, setFormData] = useState<Partial<GoalFormData>>({
    title: '',
    description: '',
    priority: 'medium' as GoalPriority,
    category: 'health' as GoalCategory,
    dueDate: new Date(),
  });

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health':
        return '❤️';
      case 'fitness':
        return '💪';
      case 'nutrition':
        return '🥗';
      case 'mental':
        return '🧠';
      case 'personal':
        return '⭐';
      default:
        return '🎯';
    }
  };

  const handleAddGoal = async () => {
    if (!formData.title?.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    try {
      await createGoal({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
      });

      setShowAddGoal(false);
      setShowSuggestions(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'health',
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create goal');
    }
  };

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    try {
      await updateGoalProgress(goalId, newValue);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update progress');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        return file;
      }
      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
      return null;
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
  const [, setUploadingUploadId] = useState<string | null>(null);
  const uploadMonitorActiveRef = useRef(false);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dedupeFiles = useCallback((files: typeof uploadedFiles) => {
    const map = new Map<string, any>();
    files.forEach((f) => map.set(f.upload_id || f.id || f.name, f));
    return Array.from(map.values());
  }, []);

  // Fetch existing uploaded files when modal is opened
  useEffect(() => {
    const fetchFiles = async () => {
      if (!showUploadModal) return;
      try {
        const files = await goalsApi.getUploadedFiles(userEmail);
        const mapped = files.map((f: any) => ({
          id: f.id,
          upload_id: f.upload_id,
          name: f.filename,
          type: f.extension,
          size: f.size,
          status: f.status,
          entities_count: f.entities_count,
          relationships_count: f.relationships_count,
        }));
        setUploadedFiles(dedupeFiles(mapped));
      } catch (err) {
        console.warn('Failed to load uploaded files', err);
      }
    };
    fetchFiles();
  }, [showUploadModal, userEmail, dedupeFiles]);

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
        uploadIntervalRef.current = null;
      }
      uploadMonitorActiveRef.current = false;
    };
  }, []);

  // Preferences state
  const emptyPref: TimePreference = {
    preferred_time: '07:00',
    duration_minutes: 30,
    days_of_week: [1, 3, 5],
    reminder_before_minutes: 10,
  } as TimePreference;
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [timePreferences, setTimePreferences] = useState<Record<string, TimePreference>>({
    [PillarType.HEALTH]: { ...emptyPref },
    [PillarType.FITNESS]: { ...emptyPref, preferred_time: '08:00' },
    [PillarType.NUTRITION]: {
      ...emptyPref,
      preferred_time: '12:00',
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
    },
    [PillarType.MENTAL]: { ...emptyPref, preferred_time: '18:00' },
    [PillarType.PERSONAL]: { ...emptyPref, preferred_time: '20:00' },
  });

  // Inline banner to inform user while plan is being generated
  const GeneratingBanner = () =>
    generatingPlanGoalIds.length > 0 ? (
      <View
        className={`mx-4 mb-1 mt-3 flex-row items-center rounded-lg border px-3 py-2 ${
          isDarkMode ? 'border-emerald-900 bg-emerald-950/50' : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <ActivityIndicator size="small" color={isDarkMode ? '#34d399' : '#059669'} />
        <Text className={`ml-2 text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>
          Generating plan… You can come back later once it is ready, as creating a detailed plan may take a while.
        </Text>
      </View>
    ) : null;

  const openPreferences = async () => {
    setShowPreferencesModal(true);
    setPreferencesLoading(true);
    try {
      const existing = await goalsApi.getTimePreferences(userEmail);
      if (existing?.preferences) {
        // existing.preferences keys are dynamic
        setTimePreferences((prev) => ({ ...prev, ...existing.preferences }));
      }
    } catch (e) {
      console.warn('Failed to load preferences', e);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const updatePrefField = (pillar: PillarType, field: keyof TimePreference, value: any) => {
    setTimePreferences((prev) => ({
      ...prev,
      [pillar]: { ...(prev[pillar] || emptyPref), [field]: value },
    }));
  };

  const toggleDay = (pillar: PillarType, day: number) => {
    setTimePreferences((prev) => {
      const p = prev[pillar] || emptyPref;
      const exists = p.days_of_week.includes(day);
      const days = exists ? p.days_of_week.filter((d: number) => d !== day) : [...p.days_of_week, day];
      return { ...prev, [pillar]: { ...p, days_of_week: days.sort() } };
    });
  };

  const savePreferences = async () => {
    try {
      setPreferencesLoading(true);
      await goalsApi.setTimePreferences({
        user_email: userEmail,
        preferences: timePreferences,
      });
      Alert.alert('Success', 'Preferences saved');
      setShowPreferencesModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleGeneratePlan = async (goalId: string, goal: ExtendedGoal) => {
    if (generatingPlan) return;

    // Default preferences - replace with actual preferences if needed
    const defaultPreferences: PillarTimePreferences = {
      user_email: userEmail,
      preferences: {
        [PillarType.HEALTH]: {
          preferred_time: '07:00',
          duration_minutes: 45,
          days_of_week: [1, 3, 5], // Tue, Thu, Sat
          reminder_before_minutes: 15,
        },
        [PillarType.FITNESS]: {
          preferred_time: '08:00',
          duration_minutes: 60,
          days_of_week: [0, 2, 4], // Mon, Wed, Fri
          reminder_before_minutes: 15,
        },
        [PillarType.NUTRITION]: {
          preferred_time: '12:00',
          duration_minutes: 30,
          days_of_week: [0, 1, 2, 3, 4, 5, 6], // Every day
          reminder_before_minutes: 15,
        },
        [PillarType.MENTAL]: {
          preferred_time: '18:00',
          duration_minutes: 30,
          days_of_week: [0, 2, 4, 6], // Mon, Wed, Fri, Sun
          reminder_before_minutes: 15,
        },
        [PillarType.PERSONAL]: {
          preferred_time: '20:00',
          duration_minutes: 45,
          days_of_week: [1, 3, 5], // Tue, Thu, Sat
          reminder_before_minutes: 15,
        },
      },
    };

    if (generatingPlanGoalIds.includes(goalId)) {
      return;
    }
    setGeneratingPlanGoalIds((prev) => (prev.includes(goalId) ? prev : [...prev, goalId]));

    try {
      // Debug log
      console.log(`Generating plan for goal ${goalId}:`, goal);

      // Generate the plan (returns { actionPlan, weeklySchedule })
      const { actionItems } = await goalsApi.generatePlan(goalId, userEmail, [defaultPreferences]);

      console.log('Plan generation response:', { actionItems });

      // Defensive checks
      if (!actionItems) {
        throw new Error('Plan generation returned incomplete data');
      }

      // Debug logs
      console.log('Action items:', actionItems);

      // Reload all goals so the specific goal reflects new action items
      try {
        await loadGoals();
      } catch (reloadErr) {
        console.warn('Goals reload after plan generation failed:', reloadErr);
      }

      // Success – we already set expectations above, so no extra modal needed
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert(
        isDarkMode ? 'Error' : 'Error',
        error instanceof Error ? error.message : 'Failed to generate plan',
        undefined,
        {
          cancelable: true,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
      );
    } finally {
      setGeneratingPlanGoalIds((prev) => prev.filter((id) => id !== goalId));
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeek(newDate);

    // Load goals for the new week
    const { start } = getWeekDates(newDate);
    loadGoals(start.toISOString());
  };

  const handleSaveReflection = async (reflection: string, rating: number, nextWeekGoals: string[]) => {
    try {
      const { start, end } = getWeekDates(currentWeek);
      await saveWeeklyReflection({
        week_start: start.toISOString(),
        week_end: end.toISOString(),
        rating,
        reflection,
        next_week_goals: nextWeekGoals,
      });
      setShowReflection(false);
      Alert.alert('Success', 'Weekly reflection saved successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save reflection');
    }
  };

  const { start: weekStart, end: weekEnd } = getWeekDates(currentWeek);
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const { isDarkMode } = useTheme();

  // Show enhanced loading screen while initial load
  if (loading && goals.length === 0) {
    return <LoadingScreen weekStart={weekStart} weekEnd={weekEnd} />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
      <View>
        <GoalsHeader
          weekStart={weekStart}
          weekEnd={weekEnd}
          openPreferences={openPreferences}
          setShowUploadModal={setShowUploadModal}
          setShowAddGoal={setShowAddGoal}
        />
        <ScrollView
          style={{
            height: '100%',
            backgroundColor: isDarkMode ? '#111827' : '#F0FDF4',
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingTop: 16, gap: 16 }}>
            <GeneratingBanner />

            {/* Show loading indicator while refreshing (when goals exist) */}
            {loading && goals.length > 0 && (
              <View
                style={{
                  backgroundColor: isDarkMode ? '#1e40af' : '#dbeafe',
                  borderRadius: 12,
                  padding: 12,
                  marginHorizontal: 16,
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="small" color={isDarkMode ? '#60a5fa' : '#1d4ed8'} />
                <Text
                  style={{
                    color: isDarkMode ? '#93c5fd' : '#1e40af',
                    marginLeft: 12,
                    fontSize: 13,
                    fontWeight: '500',
                  }}
                >
                  Refreshing goals...
                </Text>
              </View>
            )}

            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {/* Week Navigation (hidden) */}
              {false && (
                <Card className="border-0">
                  <View className="flex-row items-center justify-between p-4">
                    <TouchableOpacity onPress={() => handleWeekChange('prev')} className="p-2">
                      <ChevronLeft size={20} color="#059669" />
                    </TouchableOpacity>
                    <View className="items-center">
                      <Text className="font-semibold text-gray-800">Week of {formatDate(weekStart)}</Text>
                      <Text className="text-sm text-gray-600">
                        {completedGoals}/{totalGoals} goals completed
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleWeekChange('next')} className="p-2">
                      <ChevronRight size={20} color="#059669" />
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {/* Progress Overview (hidden) */}
              {false && (
                <Card className="border-0">
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center">
                      <BarChart3 size={20} color="#059669" className="mr-2" />
                      <Text className="text-lg font-semibold text-gray-800">Weekly Progress</Text>
                    </View>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-sm text-gray-600">Completion Rate</Text>
                      <Text className="text-sm font-semibold text-gray-800">{completionRate.toFixed(0)}%</Text>
                    </View>
                    <View className="h-3 rounded-full bg-gray-200">
                      <View
                        className="h-3 rounded-full"
                        style={{
                          backgroundColor: '#114131',
                          width: `${completionRate}%`,
                        }}
                      />
                    </View>
                    <View className="mt-3 flex-row justify-between">
                      <View className="items-center">
                        <Text className="text-2xl font-bold" style={{ color: '#114131' }}></Text>
                        <Text className="text-xs text-gray-600">Completed</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-gray-400"></Text>
                        <Text className="text-xs text-gray-600">Remaining</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-blue-600"></Text>
                        <Text className="text-xs text-gray-600">Total</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              )}

              {/* Goals Summary (hidden) */}
              {false && goals && goals.length > 0 && (
                <WeeklyGoalsSummary
                  goals={goals.map((goal) => ({
                    id: goal.id,
                    title: goal.title,
                    currentValue: goal.current_value || 0,
                    targetValue: goal.target_value || 1,
                    completed: goal.completed,
                    category: goal.category,
                  }))}
                  onViewAll={() => {
                    // Scroll to goals list or show all goals
                    console.log('View all goals');
                  }}
                />
              )}

              {/* Empty State */}
              {!loading && goals.length === 0 && <EmptyGoals setShowAddGoal={setShowAddGoal} />}

              {/* Goals List */}
              {goals.map((goal: any) => (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View>
                    <View style={{ marginBottom: 16 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 20, marginRight: 8 }}>{getCategoryIcon(goal.category)}</Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: '600',
                              flex: 1,
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            }}
                          >
                            {goal.title}
                          </Text>
                          {/* Circular Progress Ring */}
                          <View style={{ marginLeft: 10 }}>
                            <CircularProgressRing
                              size={54}
                              strokeWidth={4}
                              progress={goal.completion_percentage || 0}
                              color={
                                goal.completion_percentage >= 80
                                  ? '#10b981'
                                  : goal.completion_percentage >= 50
                                    ? '#f59e0b'
                                    : '#ef4444'
                              }
                              backgroundColor={isDarkMode ? '#374151' : '#e5e7eb'}
                              showPercentage={true}
                              textColor={isDarkMode ? '#d1d5db' : '#374151'}
                            />
                          </View>
                          {/* Delete Button */}
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert(
                                'Delete Goal',
                                'Are you sure you want to delete this goal?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => deleteGoal(goal.id),
                                  },
                                ],
                                { cancelable: true },
                              );
                            }}
                            style={{
                              marginLeft: 12,
                              padding: 6,
                              borderRadius: 8,
                              backgroundColor: isDarkMode ? '#ef4444' : '#fee2e2',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            activeOpacity={0.7}
                          >
                            <Trash size={20} color={isDarkMode ? '#fff' : '#ef4444'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {!(goal.action_items && goal.action_items.length > 0) && (
                        <TouchableOpacity
                          onPress={() => handleGeneratePlan(goal.id, goal)}
                          disabled={generatingPlanGoalIds.includes(goal.id)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: '#10b981',
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: generatingPlanGoalIds.includes(goal.id) ? 0.5 : 1,
                            marginBottom: 8,
                          }}
                          activeOpacity={0.7}
                        >
                          {generatingPlanGoalIds.includes(goal.id) ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <View style={{ marginRight: 8 }}>
                              <BarChart3 size={18} color="#ffffff" />
                            </View>
                          )}
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 14,
                              fontWeight: '600',
                            }}
                          >
                            {generatingPlanGoalIds.includes(goal.id) ? 'Generating…' : 'Generate Plan'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color:
                              goal.priority === 'high' ? '#ef4444' : goal.priority === 'medium' ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {goal.priority.toUpperCase()} PRIORITY
                        </Text>
                      </View>
                    </View>

                    {/* Action Items */}
                    {(goal.action_items?.length ?? 0) > 0 && (
                      <View className="mt-4">
                        <Text
                          className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
                        >
                          Action Items
                        </Text>
                        <View>
                          {goal.action_items?.map((item: any) => (
                            <ActionItemCard key={item.id} item={item} onPress={() => setSelectedActionItem(item)} />
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Use GoalProgressTracker component for measurable goals */}
                    {goal.target_value && (
                      <GoalProgressTracker
                        goalId={goal.id}
                        title=""
                        currentValue={goal.current_value || 0}
                        targetValue={goal.target_value}
                        unit={goal.unit || ''}
                        onProgressUpdate={handleUpdateProgress}
                        showQuickActions={true}
                      />
                    )}
                  </View>
                </View>
              ))}

              {/* Weekend Reflection */}
              {new Date().getDay() === 0 && ( // Sunday
                <Card className="border-0 bg-blue-50">
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center">
                      <BookOpen size={20} color="#3b82f6" className="mr-2" />
                      <Text className="text-lg font-semibold text-blue-800">Weekly Reflection</Text>
                    </View>
                    <Text className="mb-3 text-sm text-blue-700">
                      Take a moment to reflect on your week and plan for the next one.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowReflection(true)}
                      className="self-start rounded-lg bg-blue-600 px-4 py-2"
                    >
                      <Text className="font-medium text-white">Start Reflection</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {/* Habit Integration (hidden) */}
              {false && goals.length > 0 && (
                <HabitGoalIntegration
                  goalId={goals[0].id}
                  goalTitle={goals[0].title}
                  suggestedHabits={[
                    'Set a daily reminder',
                    'Track progress in the morning',
                    'Review goals before bed',
                    'Celebrate small wins',
                  ]}
                  completedHabits={['Set a daily reminder']}
                  onHabitToggle={(habit) => {
                    // Handle habit toggle
                    console.log('Habit toggled:', habit);
                  }}
                />
              )}
            </View>
          </View>
        </ScrollView>

        {/* Add Goal Modal */}
        {showAddGoal && (
          <AddGoalModal
            showAddGoal={showAddGoal}
            setShowAddGoal={setShowAddGoal}
            setShowSuggestions={setShowSuggestions}
            formData={formData}
            setFormData={setFormData}
            showSuggestions={showSuggestions}
            handleAddGoal={handleAddGoal}
          />
        )}

        {/* Weekly Reflection Modal */}
        {showReflection && (
          <WeeklyReflection
            weekStart={weekStart}
            weekEnd={weekEnd}
            completedGoals={completedGoals}
            totalGoals={totalGoals}
            onSave={handleSaveReflection}
            onClose={() => setShowReflection(false)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Action Item Schedule Modal */}
        {selectedActionItem && (
          <ActionItemScheduleModal
            selectedActionItem={selectedActionItem}
            setSelectedActionItem={setSelectedActionItem}
          />
        )}

        {/* Preferences Modal */}
        {showPreferencesModal && (
          <PreferencesModal
            isDarkMode={isDarkMode}
            preferencesLoading={preferencesLoading}
            timePreferences={timePreferences}
            updatePrefField={updatePrefField}
            toggleDay={toggleDay}
            savePreferences={savePreferences}
            showPreferencesModal={showPreferencesModal}
            setShowPreferencesModal={setShowPreferencesModal}
          />
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            uploadMonitorActiveRef={uploadMonitorActiveRef}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            generatingPlan={generatingPlan}
            uploadingFileId={uploadingFileId}
            setUploadingFileId={setUploadingFileId}
            setUploadingUploadId={setUploadingUploadId}
            userEmail={userEmail}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
            showUploadModal={showUploadModal}
            setShowUploadModal={setShowUploadModal}
            isDarkMode={isDarkMode}
            pickDocument={pickDocument}
            dedupeFiles={dedupeFiles}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
