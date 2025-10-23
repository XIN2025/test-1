import { CircularProgressRing } from '@/components/CircularProgressRing';
import { LiquidGauge } from 'react-native-liquid-gauge';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGoals } from '@/hooks/useGoals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, Flame, Heart, Target } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CopilotProvider, CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';
import { goalsApi } from '../../services/goalsApi';
import PlatformHealthCard from '../../components/health/PlatformHealthCard';
import SimpleLabTestsCard from '../../components/SimpleLabTestsCard';
import CriticalRiskAlertsCard from '../../components/CriticalRiskAlertsCard';
import UserAvatar from '@/components/UserAvatar';
import Greeting from '@/components/Greeting';
import { healthAlertsApi } from '../../services/healthAlertsApi';
import { CriticalRiskAlert } from '../../types/criticalRiskAlerts';
import { healthScoreApi } from '../../services/healthScoreApi';
import TodaysActionItems from '@/components/main/TodaysActionItems';
import { commonStylesDark, commonStylesLight, shadow } from '@/utils/commonStyles';
import WeeklyGoals from '@/components/main/WeeklyGoals';

const { width } = Dimensions.get('window');

// Create walkthroughable components
const WalkthroughableView = walkthroughable(View);

// --- Helper function to render streak achievements ---
function renderStreakAchievements(streak: number | null, isDarkMode: boolean) {
  // Define milestones and their labels
  const milestones = [
    { weeks: 1, label: 'First Streak!' },
    { weeks: 2, label: '2 Weeks!' },
    { weeks: 4, label: '1 Month Streak!' },
    { weeks: 8, label: '2 Months!' },
    { weeks: 12, label: '3 Months!' },
    { weeks: 24, label: '6 Months!' },
    { weeks: 52, label: '1 Year!' },
  ];
  if (streak == null) {
    return (
      <Text
        style={{
          color: isDarkMode ? '#e5e7eb' : '#374151',
          fontSize: 15,
          textAlign: 'center',
        }}
      >
        Achievements will appear here as you build your streak!
      </Text>
    );
  }
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Text
        style={{
          color: isDarkMode ? '#fbbf24' : '#f59e42',
          fontWeight: 'bold',
          fontSize: 16,
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        {`Current Streak: ${streak} week${streak > 1 ? 's' : ''}`}
      </Text>
      {/* List all achievements, tagging unlocked/locked */}
      {milestones.map((m) => {
        const unlocked = streak >= m.weeks;
        return (
          <View
            key={m.weeks}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              opacity: unlocked ? 1 : 0.5,
            }}
          >
            <View style={{ marginRight: 8 }}>
              <Flame
                size={22}
                color={unlocked ? (isDarkMode ? '#fbbf24' : '#f59e42') : isDarkMode ? '#64748b' : '#cbd5e1'}
              />
            </View>
            <Text
              style={{
                color: unlocked ? (isDarkMode ? '#fbbf24' : '#f59e42') : isDarkMode ? '#64748b' : '#64748b',
                fontWeight: unlocked ? 'bold' : 'normal',
                fontSize: 15,
              }}
            >
              {m.label}
            </Text>
            <Text
              style={{
                color: unlocked ? (isDarkMode ? '#22c55e' : '#059669') : isDarkMode ? '#64748b' : '#64748b',
                fontSize: 13,
                marginLeft: 8,
                fontWeight: 'bold',
              }}
            >
              {unlocked ? 'Unlocked' : 'Locked'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MainDashboard() {
  const { user, markAsReturningUser } = useAuth();
  const { start, copilotEvents } = useCopilot();
  const userEmail = user?.email || '';
  const userName = user?.name || '';

  const [dailyCompletion, setDailyCompletion] = useState<Record<string, number>>({});
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [calendarMonth, setCalendarMonth] = useState<number | null>(null);
  const [calendarYear, setCalendarYear] = useState<number | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    goalsApi
      .getDailyCompletion(userEmail, today.getMonth() + 1, today.getFullYear())
      .then((completionData) => {
        setDailyCompletion(completionData);
      })
      .catch(() => setDailyCompletion({}));
  }, [userEmail]);

  const handlePrevDailyCompletion = () => {
    const currentDate = new Date(calendarYear || new Date().getFullYear(), calendarMonth || new Date().getMonth(), 1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    setCalendarMonth(currentDate.getMonth());
    setCalendarYear(currentDate.getFullYear());

    console.log('📅 Sending to API:', {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userEmail,
    });

    goalsApi
      .getDailyCompletion(userEmail, currentDate.getMonth() + 1, currentDate.getFullYear())
      .then((completionData) => {
        console.log('📊 Received completion data:', completionData);
        setDailyCompletion(completionData);
      })
      .catch(() => setDailyCompletion({}));
  };

  const handleNextDailyCompletion = () => {
    const currentDate = new Date(calendarYear || new Date().getFullYear(), calendarMonth || new Date().getMonth(), 1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    setCalendarMonth(currentDate.getMonth());
    setCalendarYear(currentDate.getFullYear());
    goalsApi
      .getDailyCompletion(userEmail, currentDate.getMonth() + 1, currentDate.getFullYear())
      .then((completionData) => {
        setDailyCompletion(completionData);
      })
      .catch(() => setDailyCompletion({}));
  };

  // --- Streak Modal State and Logic ---
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [totalStreakCount, setTotalStreakCount] = useState<number | null>(null);
  const [streakLoading, setStreakLoading] = useState(false);
  const [streakError, setStreakError] = useState<string | null>(null);
  const [streakTab, setStreakTab] = useState<'calendar' | 'achievements'>('calendar');
  const fetchStreak = useCallback(async () => {
    if (!userEmail) return;
    setStreakLoading(true);
    setStreakError(null);
    try {
      const stats = await goalsApi.getGoalStats(userEmail, 12);
      setStreak(stats?.weekly_streak ?? 0);
      setTotalStreakCount(stats?.total_weekly_streak_count ?? 0);
    } catch {
      setStreakError('Failed to load streak');
    } finally {
      setStreakLoading(false);
    }
  }, [userEmail]);
  const openStreakModal = () => {
    setShowStreakModal(true);
    fetchStreak();
  };
  const closeStreakModal = () => setShowStreakModal(false);
  const { loadTodaysItems } = useGoals({ userEmail });
  const [healthScore, setHealthScore] = useState<number>(0);
  const [healthScoreLoading, setHealthScoreLoading] = useState<boolean>(false);

  const loadHealthScore = useCallback(async () => {
    if (!userEmail) return;
    setHealthScoreLoading(true);
    try {
      const score = await healthScoreApi.getHealthScore(userEmail);
      setHealthScore(typeof score === 'number' ? Math.max(0, Math.min(100, Math.round(score))) : 0);
    } catch (e) {
      console.error('Failed to load health score:', e);
      setHealthScore(0);
    } finally {
      setHealthScoreLoading(false);
    }
  }, [userEmail]);
  // Critical Risk Alerts state
  const [criticalRiskAlerts, setCriticalRiskAlerts] = useState<CriticalRiskAlert[]>([]);

  // Load critical risk alerts
  const loadCriticalRiskAlerts = useCallback(async () => {
    if (!userEmail) return;
    try {
      const alerts = await healthAlertsApi.getActiveAlerts(userEmail);
      setCriticalRiskAlerts(alerts);
    } catch (error) {
      console.error('Failed to load critical risk alerts:', error);
      setCriticalRiskAlerts([]);
    }
  }, [userEmail]);

  // Refresh goals data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userEmail) {
        loadCriticalRiskAlerts();
        loadHealthScore();
        loadTodaysItems?.();
      }
    }, [userEmail, loadCriticalRiskAlerts, loadHealthScore, loadTodaysItems]),
  );
  // Removed local demo tasks; weekly goals are now sourced from API via useGoals

  // Per-user storage key for walkthrough completion
  const walkthroughStorageKey = useMemo(() => `dashboardWalkthroughSeen:${userEmail || 'guest'}`, [userEmail]);

  // Check if walkthrough should be shown and setup copilot events
  useEffect(() => {
    const checkWalkthrough = async () => {
      try {
        if (!userEmail) {
          console.log('❌ No user email, skipping walkthrough check');
          return;
        }

        console.log('🔍 Checking walkthrough conditions for:', userEmail);

        // Check if we should show walkthrough from AsyncStorage
        const walkthroughTrigger = await AsyncStorage.getItem(`showWalkthrough:${userEmail}`);
        console.log('📱 Walkthrough trigger from storage:', walkthroughTrigger);

        // Only show walkthrough if coming from register flow
        const shouldShowWalkthrough = walkthroughTrigger === 'register';
        console.log('🎯 Should show walkthrough (register only):', shouldShowWalkthrough);

        if (!shouldShowWalkthrough) {
          console.log('❌ Not showing walkthrough - not from register flow');
          return;
        }

        // Clear the trigger so it only shows once
        await AsyncStorage.removeItem(`showWalkthrough:${userEmail}`);

        const seen = await AsyncStorage.getItem(walkthroughStorageKey);
        console.log('💾 Walkthrough seen before:', !!seen, 'Storage key:', walkthroughStorageKey);

        if (!seen) {
          console.log('🚀 Starting copilot walkthrough');
          // Start the copilot walkthrough with a small delay to ensure components are mounted
          setTimeout(() => {
            start();
          }, 500);
        } else {
          console.log('❌ Walkthrough already seen before');
        }
      } catch (error) {
        console.log('❌ Error checking walkthrough status:', error);
      }
    };

    // Setup copilot event handlers
    if (copilotEvents) {
      copilotEvents.on('stepChange', (step: any) => {
        console.log(`🎯 Current copilot step: ${step.name} (order: ${step.order})`);
        console.log('📏 Step measurements:', step);
      });

      copilotEvents.on('start', () => {
        console.log('🚀 Copilot walkthrough started');
        console.log('📍 Available steps should be: healthScore, todayItems, weeklyGoals');
      });

      copilotEvents.on('stop', async () => {
        console.log('✅ Copilot walkthrough completed');
        try {
          await AsyncStorage.setItem(walkthroughStorageKey, 'true');
          console.log('💾 Walkthrough completion saved to storage');

          // Mark user as returning user after completing onboarding
          await markAsReturningUser();
          console.log('👤 User marked as returning user');
        } catch (error) {
          console.log('❌ Error saving walkthrough completion:', error);
        }
      });
    }

    checkWalkthrough();
  }, [walkthroughStorageKey, userEmail, start, copilotEvents, markAsReturningUser]);

  // Note: We now use AsyncStorage for walkthrough triggers instead of URL parameters
  // This avoids issues with tab navigation clearing parameters

  // Health score calculation (currently using hardcoded value for testing)
  // const healthScore = useMemo(() => {
  //   if (!goals || goals.length === 0) return 0;
  //
  //   // Calculate average completion percentage across all goals
  //   const totalGoals = (goals as any[]).length;
  //   const totalCompletion = (goals as any[]).reduce((sum, goal) => {
  //     return sum + getGoalCompletionPercentage(goal.id);
  //   }, 0);
  //
  //   const averageCompletion = totalCompletion / totalGoals;
  //
  //   // Add bonus points for streak
  //   const streakBonus = Math.min((streak || 0) * 2, 20); // Up to 20 bonus points for streak
  //
  //   // Cap at 100
  //   return Math.min(Math.round(averageCompletion + streakBonus), 100);
  // }, [goals, getGoalCompletionPercentage, streak]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
      {/* Fixed Header */}
      <View className={`z-10 px-4 py-4 shadow-sm ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <UserAvatar
              showBorder={true}
              onPress={() => router.push('/dashboard/profile')}
              className={`${isDarkMode ? 'bg-emerald-900' : 'bg-emerald-800'}`}
              userName={userName}
            />
            <View>
              <Greeting name={userName || 'Superstar'} />
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Ready for a healthy day?
              </Text>
            </View>
          </View>
          <View className="flex flex-row items-center gap-4">
            <Pressable onPress={openStreakModal} accessibilityLabel="Show Streak">
              <Flame size={22} color={isDarkMode ? '#fbbf24' : '#f59e42'} />
            </Pressable>
            <Pressable onPress={() => start()} accessibilityLabel="Start App Tour">
              <Target size={20} color={isDarkMode ? '#9ca3af' : '#64748b'} />
            </Pressable>
            <Pressable accessibilityLabel="Notifications">
              <Bell size={20} color={isDarkMode ? '#9ca3af' : '#64748b'} />
            </Pressable>
          </View>
          {/* Streak Modal */}
          <Modal visible={showStreakModal} animationType="slide" transparent onRequestClose={closeStreakModal}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  borderRadius: 16,
                  padding: 28,
                  minWidth: 340,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {/* Tabs */}
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 18,
                    width: '100%',
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: 2,
                      borderBottomColor:
                        streakTab === 'calendar' ? (isDarkMode ? '#fbbf24' : '#f59e42') : 'transparent',
                    }}
                    onPress={() => setStreakTab('calendar')}
                  >
                    <Text
                      style={{
                        color:
                          streakTab === 'calendar'
                            ? isDarkMode
                              ? '#fbbf24'
                              : '#f59e42'
                            : isDarkMode
                              ? '#e5e7eb'
                              : '#374151',
                        fontWeight: 'bold',
                        fontSize: 16,
                      }}
                    >
                      Calendar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: 2,
                      borderBottomColor:
                        streakTab === 'achievements' ? (isDarkMode ? '#fbbf24' : '#f59e42') : 'transparent',
                    }}
                    onPress={() => setStreakTab('achievements')}
                  >
                    <Text
                      style={{
                        color:
                          streakTab === 'achievements'
                            ? isDarkMode
                              ? '#fbbf24'
                              : '#f59e42'
                            : isDarkMode
                              ? '#e5e7eb'
                              : '#374151',
                        fontWeight: 'bold',
                        fontSize: 16,
                      }}
                    >
                      Achievements
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {streakTab === 'calendar' ? (
                  <>
                    <Flame size={40} color={isDarkMode ? '#fbbf24' : '#f59e42'} />
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: 'bold',
                        marginTop: 12,
                        color: isDarkMode ? '#fbbf24' : '#f59e42',
                      }}
                    >
                      {streakLoading ? 'Loading...' : streakError ? streakError : `🔥 ${streak ?? 0} week streak!`}
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        marginTop: 8,
                        textAlign: 'center',
                        maxWidth: 260,
                      }}
                    >
                      {streak && streak > 0
                        ? `You've completed your goals for ${streak} consecutive week${
                            streak > 1 ? 's' : ''
                          }! Keep it up!`
                        : 'Complete your goals each week to build your streak.'}
                    </Text>
                    {/* Calendar Streak View */}
                    <View style={{ marginTop: 24, marginBottom: 16 }}>
                      <Text
                        style={{
                          color: isDarkMode ? '#fbbf24' : '#f59e42',
                          fontWeight: 'bold',
                          fontSize: 16,
                          marginBottom: 8,
                          textAlign: 'center',
                        }}
                      >
                        Weekly Streak Calendar
                      </Text>
                      <StreakCalendar
                        isDarkMode={isDarkMode}
                        dailyCompletion={dailyCompletion}
                        currentMonth={calendarMonth}
                        currentYear={calendarYear}
                        handlePrevDailyCompletion={handlePrevDailyCompletion}
                        handleNextDailyCompletion={handleNextDailyCompletion}
                      />
                    </View>
                  </>
                ) : (
                  <View
                    style={{
                      alignItems: 'center',
                      width: 260,
                      minHeight: 260,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: isDarkMode ? '#fbbf24' : '#f59e42',
                        marginBottom: 12,
                        textAlign: 'center',
                      }}
                    >
                      Streak Achievements
                    </Text>
                    {renderStreakAchievements(totalStreakCount, isDarkMode)}
                  </View>
                )}

                <TouchableOpacity
                  onPress={closeStreakModal}
                  style={{
                    marginTop: 8,
                    backgroundColor: isDarkMode ? '#059669' : '#e6f4f1',
                    paddingVertical: 10,
                    paddingHorizontal: 32,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isDarkMode ? '#fff' : '#059669',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* --- Streak Calendar Component --- */}
          {/*
              Dummy data: Array of last 12 weeks, true = streak, false = missed
              You can replace this with real data if available.
            */}
          {/*
              Place this at the bottom of your file, outside the MainDashboard component:
            */}
          {/*
            Example usage:
              <StreakCalendar isDarkMode={isDarkMode} />
            */}
          {/* --- End Streak Calendar Component --- */}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#111827' : '#F0FDF4',
        }}
        contentContainerStyle={{ padding: 16, gap: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Health Score and Quick Actions Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 8,
          }}
        >
          {/* Health Card - Platform specific (iOS HealthKit / Android Health Connect) */}
          <PlatformHealthCard
            isDarkMode={isDarkMode}
            onPress={() => router.push('/dashboard/health')}
            width={width * 0.44}
            height={width * 0.4}
          />

          {/* Health Score - Right Side */}
          <View className="items-center justify-center">
            <CopilotStep
              text="📊 Health Score - Your overall health score is calculated based on your daily activities, goal completion, and health metrics. Higher scores mean better health habits!"
              order={1}
              name="healthScore"
            >
              <WalkthroughableView
                style={{
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  borderRadius: 16,
                  minHeight: width * 0.4,
                  justifyContent: 'center',
                }}
              >
                {/* Liquid Gauge for Health Score */}
                <LiquidGauge
                  value={healthScore}
                  width={width * 0.35}
                  height={width * 0.35}
                  config={{
                    circleColor: '#f97316',
                    textColor: isDarkMode ? '#fff' : '#1f2937',
                    waveTextColor: isDarkMode ? '#1f2937' : '#fff',
                    waveColor: '#f97316',
                    circleThickness: 0.08,
                    textVertPosition: 0.5,
                    waveAnimateTime: 3000,
                    waveRiseTime: 1500,
                    waveHeight: 0.08,
                    waveCount: 2,
                    textSize: 1.2,
                    waveRise: true,
                    waveAnimate: true,
                    waveHeightScaling: true,
                    valueCountUp: true,
                    textSuffix: '',
                    toFixed: 0,
                  }}
                />

                {/* Label below */}
                <Text
                  style={{
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    fontSize: 12,
                    fontWeight: '500',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {healthScoreLoading ? 'Loading…' : 'Health Score'}
                </Text>
              </WalkthroughableView>
            </CopilotStep>
          </View>
        </View>

        {/* View Full Health Data Button - Platform specific */}
        <TouchableOpacity
          onPress={() => router.push('/dashboard/health')}
          style={{
            backgroundColor: isDarkMode ? '#059669' : '#059669',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            ...shadow.card,
          }}
          activeOpacity={0.8}
        >
          <Heart size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            View Full Health Data
          </Text>
        </TouchableOpacity>

        {/* Lab Tests Card */}
        <SimpleLabTestsCard isDarkMode={isDarkMode} onPress={() => router.push('/dashboard/lab-tests')} />

        {/* Critical Risk Alerts Card */}
        {criticalRiskAlerts.length > 0 && (
          <CriticalRiskAlertsCard
            isDarkMode={isDarkMode}
            alerts={criticalRiskAlerts}
            loadCriticalRiskAlert={loadCriticalRiskAlerts}
            width={width - 32}
            onAlertPress={(alert) => {
              // Handle alert press - could navigate to detailed view
              console.log('Alert pressed:', alert);
            }}
          />
        )}

        {/* Today's Action Items (collapsible) */}
        <CopilotStep
          text="✅ Today's Action Items - Complete your daily health tasks to stay on track with your goals. Tap the checkboxes to mark items as done and build your streak!"
          order={2}
          name="todayItems"
        >
          <WalkthroughableView style={isDarkMode ? commonStylesDark.displayCard : commonStylesLight.displayCard}>
            <TodaysActionItems />
          </WalkthroughableView>
        </CopilotStep>

        {/* Weekly Goals Summary (from goals endpoint) */}
        <CopilotStep
          text="🎯 Weekly Goals - Monitor your progress towards weekly health goals and stay motivated. Track completion percentages and see how you're doing each week!"
          order={3}
          name="weeklyGoals"
        >
          <WalkthroughableView style={isDarkMode ? commonStylesDark.displayCard : commonStylesLight.displayCard}>
            <WeeklyGoals />
          </WalkthroughableView>
        </CopilotStep>
      </ScrollView>
    </SafeAreaView>
  );
}

type StreakCalendarProps = {
  isDarkMode: boolean;
  dailyCompletion: Record<string, number>;
  currentMonth: number | null;
  currentYear: number | null;
  handlePrevDailyCompletion: () => void;
  handleNextDailyCompletion: () => void;
};

/**
 * Renders a 12-week streak calendar with colored circles for each week.
 * Replace the dummy data with real streak data if available.
 */
/**
 * Renders a 6-row monthly calendar where each day shows a colored circle
 * representing the number of action items completed that day.
 * The more completed, the more "filled" the color (green for high, yellow for medium, gray for none).
 * Expects real completion data via AsyncStorage or props if available.
 */

export function StreakCalendar({
  isDarkMode,
  dailyCompletion,
  currentMonth,
  currentYear,
  handlePrevDailyCompletion,
  handleNextDailyCompletion,
}: StreakCalendarProps & {
  currentMonth: number | null;
  currentYear: number | null;
  handlePrevDailyCompletion: () => void;
  handleNextDailyCompletion: () => void;
}) {
  // Map dailyCompletion (YYYY-MM-DD) to day number for current month
  const today = new Date();
  const month = currentMonth !== null ? currentMonth : today.getMonth();
  const year = currentYear !== null ? currentYear : today.getFullYear();
  const completedPerDay = useMemo(() => {
    const map: Record<number, number> = {};
    Object.entries(dailyCompletion).forEach(([date, count]) => {
      const d = new Date(date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        map[d.getDate()] = count as number;
      }
    });
    return map;
  }, [dailyCompletion, month, year]);

  // Get first day of the month (0=Sun..6=Sat)
  const firstDay = new Date(year, month, 1).getDay();
  // Get number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build calendar grid: 6 rows of 7 days (to fit all months)
  const calendar: { day: number | null }[][] = [];
  let day = 1;
  for (let row = 0; row < 6; row++) {
    const week: { day: number | null }[] = [];
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDay) || day > daysInMonth) {
        week.push({ day: null });
      } else {
        week.push({ day });
        day++;
      }
    }
    calendar.push(week);
  }

  // Helper: get color for a given completed count
  function getDayColor(count: number) {
    if (count >= 4) return isDarkMode ? '#22d3ee' : '#059669'; // teal/green for high
    if (count >= 2) return isDarkMode ? '#fbbf24' : '#f59e42'; // yellow/orange for medium
    if (count === 1) return isDarkMode ? '#a3e635' : '#84cc16'; // lime for low
    return isDarkMode ? '#334155' : '#e5e7eb'; // gray for none
  }

  // Helper: get text color for a given completed count
  function getTextColor(count: number) {
    if (count > 0) return isDarkMode ? '#1e293b' : '#fff';
    return isDarkMode ? '#64748b' : '#64748b';
  }

  // Helper: get border color for a given completed count
  function getBorderColor(count: number) {
    if (count >= 4) return isDarkMode ? '#22d3ee' : '#059669';
    if (count >= 2) return isDarkMode ? '#fbbf24' : '#f59e42';
    if (count === 1) return isDarkMode ? '#a3e635' : '#84cc16';
    return isDarkMode ? '#64748b' : '#cbd5e1';
  }

  // Helper: get size for a given completed count
  function getCircleSize(count: number) {
    if (count >= 4) return 32;
    if (count >= 2) return 28;
    if (count === 1) return 24;
    return 22;
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Month and year */}
      <Text
        style={{
          color: isDarkMode ? '#fbbf24' : '#f59e42',
          fontWeight: 'bold',
          fontSize: 17,
          marginBottom: 6,
        }}
      >
        {/* Month navigation */}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity
          onPress={handlePrevDailyCompletion}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 66, 0.1)',
          }}
        >
          <Text style={{ color: isDarkMode ? '#fbbf24' : '#f59e42', fontSize: 16, fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              color: isDarkMode ? '#fbbf24' : '#f59e42',
              fontWeight: 'bold',
              fontSize: 17,
            }}
          >
            {currentMonth !== null && currentYear !== null
              ? `${new Date(currentYear, currentMonth).toLocaleString('default', {
                  month: 'long',
                })} ${currentYear}`
              : `${today.toLocaleString('default', { month: 'long' })} ${year}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextDailyCompletion}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 66, 0.1)',
          }}
        >
          <Text style={{ color: isDarkMode ? '#fbbf24' : '#f59e42', fontSize: 16, fontWeight: 'bold' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <Text
            key={d}
            style={{
              width: 36,
              textAlign: 'center',
              color: isDarkMode ? '#fbbf24' : '#f59e42',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            {d}
          </Text>
        ))}
      </View>
      {/* Calendar grid */}
      {calendar.map((week, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: 6 }}>
          {week.map((cell, colIdx) => {
            const count = cell.day ? (completedPerDay[cell.day] ?? 0) : 0;
            const isToday =
              cell.day && today.getDate() === cell.day && today.getMonth() === month && today.getFullYear() === year;
            return (
              <View
                key={colIdx}
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cell.day ? (
                  <View
                    style={{
                      width: getCircleSize(count),
                      height: getCircleSize(count),
                      borderRadius: getCircleSize(count) / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: getDayColor(count),
                      borderWidth: isToday ? 2.5 : 1.5,
                      borderColor: isToday ? (isDarkMode ? '#38bdf8' : '#0ea5e9') : getBorderColor(count),
                      shadowColor: isToday ? (isDarkMode ? '#38bdf8' : '#0ea5e9') : undefined,
                      shadowOpacity: isToday ? 0.5 : 0,
                      shadowRadius: isToday ? 6 : 0,
                      elevation: isToday ? 4 : 0,
                    }}
                  >
                    <Text
                      style={{
                        color: getTextColor(count),
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    >
                      {cell.day}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: 22, height: 22 }} />
                )}
              </View>
            );
          })}
        </View>
      ))}
      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: isDarkMode ? '#22d3ee' : '#059669',
            marginRight: 4,
            borderWidth: 1,
            borderColor: isDarkMode ? '#22d3ee' : '#059669',
          }}
        />
        <Text
          style={{
            color: isDarkMode ? '#22d3ee' : '#059669',
            fontSize: 12,
            marginRight: 10,
          }}
        >
          4+ completed
        </Text>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: isDarkMode ? '#fbbf24' : '#f59e42',
            marginRight: 4,
            borderWidth: 1,
            borderColor: isDarkMode ? '#fbbf24' : '#f59e42',
          }}
        />
        <Text
          style={{
            color: isDarkMode ? '#fbbf24' : '#f59e42',
            fontSize: 12,
            marginRight: 10,
          }}
        >
          2-3 completed
        </Text>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: isDarkMode ? '#a3e635' : '#84cc16',
            marginRight: 4,
            borderWidth: 1,
            borderColor: isDarkMode ? '#a3e635' : '#84cc16',
          }}
        />
        <Text
          style={{
            color: isDarkMode ? '#a3e635' : '#84cc16',
            fontSize: 12,
            marginRight: 10,
          }}
        >
          1 completed
        </Text>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
            marginRight: 4,
            borderWidth: 1,
            borderColor: isDarkMode ? '#64748b' : '#cbd5e1',
          }}
        />
        <Text
          style={{
            color: isDarkMode ? '#64748b' : '#64748b',
            fontSize: 12,
          }}
        >
          0 completed
        </Text>
      </View>
    </View>
  );
}

// Export MainDashboard wrapped with CopilotProvider for better positioning
export default function MainDashboardWithCopilot() {
  return (
    <CopilotProvider
      overlay="svg"
      animated={true}
      verticalOffset={Platform.OS === 'ios' ? -10 : 0}
      animationDuration={400}
      backdropColor="rgba(0, 0, 0, 0.8)"
      arrowColor="#10b981"
      arrowSize={8}
      margin={12}
      stopOnOutsideClick={false}
      androidStatusBarVisible={true}
      labels={{
        skip: 'Skip Tour',
        previous: 'Previous',
        next: 'Next',
        finish: 'Got it!',
      }}
    >
      <MainDashboard />
    </CopilotProvider>
  );
}
