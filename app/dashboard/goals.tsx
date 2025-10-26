import ActionItemScheduleModal from '@/components/goals/ActionItemScheduleModal';
import AddGoalModal from '@/components/goals/AddGoalModal';
import EmptyGoals from '@/components/goals/EmptyGoals';
import GoalCard from '@/components/goals/Goal';
import LoadingScreen from '@/components/goals/LoadingScreen';
import PreferencesModal from '@/components/goals/PreferencesModal';
import UploadModal from '@/components/goals/UploadModal';
import { Card } from '@/components/ui/card';
import Header from '@/components/ui/Header';
import WeeklyReflection from '@/components/WeeklyReflection';
import { useAuth } from '@/context/AuthContext';
import { useGoalsContext } from '@/context/GoalsContext';
import { useTheme } from '@/context/ThemeContext';
import { goalsApi } from '@/services/goalsApi';
import { ActionItem, Goal, GoalCategory, GoalFormData, GoalPriority } from '@/types/goals';
import { PillarTimePreferences, PillarType, TimePreference } from '@/types/preferences';
import { formatDate } from '@/utils/date';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BookOpen, Plus, Star, Target } from 'lucide-react-native';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatingPlanGoalIds, setGeneratingPlanGoalIds] = useState<string[]>([]);

  const { goals, loading, createGoal, updateGoalProgress, saveWeeklyReflection, loadGoals, deleteGoal, refreshGoals } =
    useGoalsContext();

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

  const handleAddGoal = async () => {
    if (!formData.title?.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (addingGoal) return;

    setAddingGoal(true);

    try {
      await createGoal({
        title: formData.title,
        description: formData.description,
        priority: formData.priority || 'medium',
        category: formData.category || 'health',
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
    } finally {
      setAddingGoal(false);
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

  const GeneratingBanner = () =>
    generatingPlanGoalIds.length > 0 ? (
      <View
        className={`mx-4 mb-1 mt-3 flex-row items-center rounded-lg border px-3 py-2 ${
          isDarkMode ? 'border-emerald-900 bg-emerald-950/50' : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <ActivityIndicator size="small" color={isDarkMode ? '#34d399' : '#059669'} />
        <Text
          className={`ml-2 flex-1 text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}
          numberOfLines={2}
        >
          Generating plan… You can come back later once it&apos;s ready.
        </Text>
      </View>
    ) : null;

  const openPreferences = async () => {
    setShowPreferencesModal(true);
    setPreferencesLoading(true);
    try {
      const existing = await goalsApi.getTimePreferences(userEmail);
      if (existing?.preferences) {
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

    setGeneratingPlan(true);

    const defaultPreferences: PillarTimePreferences = {
      user_email: userEmail,
      preferences: {
        [PillarType.HEALTH]: {
          preferred_time: '07:00',
          duration_minutes: 45,
          days_of_week: [1, 3, 5],
          reminder_before_minutes: 15,
        },
        [PillarType.FITNESS]: {
          preferred_time: '08:00',
          duration_minutes: 60,
          days_of_week: [0, 2, 4],
          reminder_before_minutes: 15,
        },
        [PillarType.NUTRITION]: {
          preferred_time: '12:00',
          duration_minutes: 30,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          reminder_before_minutes: 15,
        },
        [PillarType.MENTAL]: {
          preferred_time: '18:00',
          duration_minutes: 30,
          days_of_week: [0, 2, 4, 6],
          reminder_before_minutes: 15,
        },
        [PillarType.PERSONAL]: {
          preferred_time: '20:00',
          duration_minutes: 45,
          days_of_week: [1, 3, 5],
          reminder_before_minutes: 15,
        },
      },
    };

    if (generatingPlanGoalIds.includes(goalId)) {
      return;
    }
    setGeneratingPlanGoalIds((prev) => (prev.includes(goalId) ? prev : [...prev, goalId]));

    try {
      console.log(`Generating plan for goal ${goalId}:`, goal);

      const { actionItems } = await goalsApi.generatePlan(goalId, userEmail, [defaultPreferences]);

      console.log('Plan generation response:', { actionItems });

      if (!actionItems) {
        throw new Error('Plan generation returned incomplete data');
      }

      await refreshGoals();
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
      setGeneratingPlan(false);
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

    loadGoals();
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

  if (loading && goals.length === 0) {
    return <LoadingScreen weekStart={weekStart} weekEnd={weekEnd} />;
  }

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']}
      style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}
    >
      <View>
        <Header
          title="Weekly Goals"
          subtitle={formatDate(weekStart) + ' - ' + formatDate(weekEnd)}
          leftIcon={{ icon: Target }}
          rightIcons={[
            {
              icon: Star,
              onPress: openPreferences,
              variant: 'secondary',
              accessibilityLabel: 'Open Preferences',
            },
            {
              icon: BookOpen,
              onPress: () => setShowUploadModal(true),
              variant: 'secondary',
              accessibilityLabel: 'Upload Plan',
            },
            {
              icon: Plus,
              onPress: () => setShowAddGoal(true),
              variant: 'secondary',
              accessibilityLabel: 'Add Goal',
            },
          ]}
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

            {loading && goals.length > 0 && generatingPlanGoalIds.length === 0 && (
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

            <View style={{ paddingHorizontal: 16, gap: 16 }}>
              {!loading && goals.length === 0 && <EmptyGoals setShowAddGoal={setShowAddGoal} />}

              {goals.map((goal: any) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={async () => {
                    await deleteGoal(goal.id);
                  }}
                  onGeneratePlan={handleGeneratePlan}
                  onProgressUpdate={handleUpdateProgress}
                  onSelectActionItem={setSelectedActionItem}
                  generatingPlanGoalIds={generatingPlanGoalIds}
                />
              ))}

              {new Date().getDay() === 0 && (
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
            </View>
          </View>
        </ScrollView>

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

        {selectedActionItem && (
          <ActionItemScheduleModal
            selectedActionItem={selectedActionItem}
            setSelectedActionItem={setSelectedActionItem}
          />
        )}

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
