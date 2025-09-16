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
import SimpleHealthCard from '../../components/SimpleHealthCard';
import SimpleLabTestsCard from '../../components/SimpleLabTestsCard';
import UserAvatar from '@/components/UserAvatar';
import Greeting from '@/components/Greeting';

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

  // Debug logging for walkthrough
  console.log('🏠 MainDashboard loaded for user:', userEmail?.substring(0, 10) + '...');
  // --- Daily Completion for Streak Calendar ---
  const [dailyCompletion, setDailyCompletion] = useState<Record<string, number>>({});
  const router = useRouter();
  const { isDarkMode } = useTheme();
  useEffect(() => {
    if (!userEmail) return;
    const today = new Date();
    goalsApi
      .getDailyCompletion(userEmail, today.getMonth() + 1, today.getFullYear())
      .then((completionData) => {
        setDailyCompletion(completionData);
      })
      .catch(() => setDailyCompletion({}));
  }, [userEmail]);

  // --- Streak Modal State and Logic ---
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
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
  const { goals, markCompletion, todaysItems } = useGoals({ userEmail });
  const [showAllTodayItems, setShowAllTodayItems] = useState(false);

  // Determine the key for today's day name used in schedules
  const dayKey = useMemo(() => {
    const day = new Date().getDay(); // 0=Sun..6=Sat
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day] || 'monday';
  }, []);

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

  type TodayItem = {
    id: string;
    title: string;
    start_time?: string;
    end_time?: string;
    goalTitle?: string;
  };

  // Helper to format time into HH:MM
  const formatTimeHM = (t?: string): string => {
    if (!t) return '';
    const parts = `${t}`.trim().split(':');
    if (parts.length >= 2) {
      const hh = (parts[0] ?? '0').padStart(2, '0');
      const mm = (parts[1] ?? '0').padStart(2, '0');
      return `${hh}:${mm}`;
    }
    const h = parts[0];
    if (h && /^\d{1,2}$/.test(h)) return `${h.padStart(2, '0')}:00`;
    return t;
  };

  const toggleItemCompleted = async (id: string) => {
    const actionItem = todaysItems.find((item) => item.id === id);
    if (!actionItem) return;

    const isComplete = actionItem.complete;
    markCompletion(id, !isComplete)
      .then(() => {
        console.log(`✅ Successfully marked action item ${id} as ${!isComplete ? 'completed' : 'not completed'}`);
        // loadTodaysItems();
      })
      .catch((error) => {
        console.error('Failed to mark completion:', error);
      });
  };

  return (
    <SafeAreaView style={{ backgroundColor: isDarkMode ? '#111827' : '#fff' }}>
      <View>
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
                <Greeting name={userName || 'User'} />
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
                        <StreakCalendar isDarkMode={isDarkMode} dailyCompletion={dailyCompletion} />
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
                      {renderStreakAchievements(streak, isDarkMode)}
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
          </View>
        </View>
      </View>

      <ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {/* Health Score and Quick Actions Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 32,
              minHeight: width * 0.4, // Ensure consistent height
            }}
          >
            {/* Health Card - Left Side */}
            <View style={{ width: '48%', paddingRight: 8 }}>
              {/* Health Card - iOS only */}
              {Platform.OS === 'ios' && (
                <SimpleHealthCard
                  isDarkMode={isDarkMode}
                  onPress={() => router.push('/dashboard/health')}
                  width={width * 0.44}
                  height={width * 0.4}
                />
              )}

              {/* Android Alternative - Chat and Appointment Buttons */}
              {Platform.OS === 'android' && (
                <View style={{ flex: 1, gap: 12 }}>
                  {/* Chat with Evra Button */}
                  <TouchableOpacity
                    onPress={() => router.push('/dashboard/chat')}
                    style={{
                      flex: 1,
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      borderRadius: 16,
                      padding: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0.3 : 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                    }}
                  >
                    <Heart size={24} color={isDarkMode ? '#34d399' : '#059669'} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        marginTop: 8,
                        textAlign: 'center',
                      }}
                    >
                      Chat with Evra
                    </Text>
                  </TouchableOpacity>

                  {/* Book Appointment Button */}
                  <TouchableOpacity
                    onPress={() => {
                      // Add appointment booking logic here
                      console.log('Book Appointment pressed');
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      borderRadius: 16,
                      padding: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0.3 : 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                    }}
                  >
                    <Target size={24} color={isDarkMode ? '#34d399' : '#059669'} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        marginTop: 8,
                        textAlign: 'center',
                      }}
                    >
                      Book Appointment
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Health Score - Right Side */}
            <View className="items-center justify-center" style={{ width: '48%', paddingLeft: 8 }}>
              <CopilotStep
                text="📊 Health Score - Your overall health score is calculated based on your daily activities, goal completion, and health metrics. Higher scores mean better health habits!"
                order={1}
                name="healthScore"
              >
                <WalkthroughableView
                  style={{
                    alignItems: 'center',
                    padding: 20,
                    borderRadius: 16,
                    minHeight: width * 0.4,
                    justifyContent: 'center',
                  }}
                >
                  {/* Liquid Gauge for Health Score */}
                  <LiquidGauge
                    value={72}
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
                    Health Score
                  </Text>
                </WalkthroughableView>
              </CopilotStep>
            </View>
          </View>
          {/* Today's Action Items (collapsible) */}
          <View style={{ marginBottom: 24 }}>
            <CopilotStep
              text="✅ Today's Action Items - Complete your daily health tasks to stay on track with your goals. Tap the checkboxes to mark items as done and build your streak!"
              order={2}
              name="todayItems"
            >
              <WalkthroughableView
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  width: '100%',
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    }}
                  >
                    Today&apos;s Action Items
                  </Text>
                </View>
                {todaysItems.length === 0 ? (
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                    }}
                  >
                    No scheduled items for today.
                  </Text>
                ) : (
                  (showAllTodayItems ? todaysItems : todaysItems.slice(0, 3)).map((it) => (
                    <View
                      key={it.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                        paddingVertical: 4,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          flex: 1,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => toggleItemCompleted(it.id)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                            marginRight: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: it.complete ? (isDarkMode ? '#10b981' : '#059669') : 'transparent',
                          }}
                          activeOpacity={0.7}
                        >
                          {it.complete && (
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 16,
                                fontWeight: 'bold',
                              }}
                            >
                              ✓
                            </Text>
                          )}
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '500',
                              color: it.complete
                                ? isDarkMode
                                  ? '#6b7280'
                                  : '#6b7280'
                                : isDarkMode
                                  ? '#f3f4f6'
                                  : '#1f2937',
                              textDecorationLine: it.complete ? 'line-through' : 'none',
                            }}
                          >
                            {it.title}
                          </Text>
                          {it.goalTitle && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                marginTop: 2,
                              }}
                            >
                              {it.goalTitle}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                          }}
                        >
                          {it.start_time && it.end_time
                            ? `${formatTimeHM(it.start_time)} - ${formatTimeHM(it.end_time)}`
                            : formatTimeHM(it.start_time) || formatTimeHM(it.end_time) || ''}
                        </Text>
                      </View>
                    </View>
                  ))
                )}

                {todaysItems.length > 3 && (
                  <TouchableOpacity
                    onPress={() => setShowAllTodayItems((v) => !v)}
                    style={{
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: isDarkMode ? '#064e3b' : '#e6f4f1',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isDarkMode ? '#34d399' : '#114131',
                      }}
                    >
                      {showAllTodayItems ? 'Show less' : `Show all (${todaysItems.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </WalkthroughableView>
            </CopilotStep>
          </View>

          {/* Weekly Goals Summary (from goals endpoint) */}
          <View style={{ marginBottom: 24 }}>
            <CopilotStep
              text="🎯 Weekly Goals - Monitor your progress towards weekly health goals and stay motivated. Track completion percentages and see how you're doing each week!"
              order={3}
              name="weeklyGoals"
            >
              <WalkthroughableView
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 8 }}>
                      <Target size={20} color={isDarkMode ? '#34d399' : '#114131'} />
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      }}
                    >
                      Weekly Goals
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: isDarkMode ? '#064e3b' : '#e6f4f1',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isDarkMode ? '#34d399' : '#114131',
                      }}
                    >
                      {goals ? goals.length : 0}
                    </Text>
                  </View>
                </View>
                {(goals || []).length === 0 ? (
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                    }}
                  >
                    No goals yet
                  </Text>
                ) : (
                  <View>
                    {(goals as any[]).slice(0, 5).map((goal: any) => {
                      return (
                        <View
                          key={goal.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 16,
                            paddingVertical: 4,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            {/* Circular Progress Ring */}
                            <View style={{ marginRight: 12 }}>
                              <CircularProgressRing
                                size={44}
                                strokeWidth={3}
                                progress={goal.completion_percentage || 0}
                                color={
                                  goal.completion_percentage >= 80
                                    ? '#10b981' // Green for high completion
                                    : goal.completion_percentage >= 50
                                      ? '#f59e0b' // Yellow for medium completion
                                      : '#ef4444' // Red for low completion
                                }
                                backgroundColor={isDarkMode ? '#374151' : '#e5e7eb'}
                                showPercentage={false}
                                textColor={isDarkMode ? '#d1d5db' : '#374151'}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '500',
                                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                                  marginBottom: 2,
                                }}
                              >
                                {goal.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                                }}
                              >
                                {goal.completion_percentage?.toFixed(0)}% completed this week
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: goal.completed
                                  ? isDarkMode
                                    ? '#34d399'
                                    : '#10b981'
                                  : isDarkMode
                                    ? '#4b5563'
                                    : '#94a3b8',
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                marginTop: 4,
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                              }}
                            >
                              {goal.completed ? 'Done' : 'Active'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </WalkthroughableView>
            </CopilotStep>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StreakCalendarProps = {
  isDarkMode: boolean;
  dailyCompletion: Record<string, number>;
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

export function StreakCalendar({ isDarkMode, dailyCompletion }: StreakCalendarProps) {
  // Map dailyCompletion (YYYY-MM-DD) to day number for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
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
        {today.toLocaleString('default', { month: 'long' })} {year}
      </Text>
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
