import { Card } from '@/components/ui/card';
import Header from '@/components/ui/Header';
import { useTheme } from '@/context/ThemeContext';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Dumbbell,
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar?: string;
    badge?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  category: string;
  tags?: string[];
}

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isJoined: boolean;
  recentActivity: string;
}

interface HealthChallenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  duration: string;
  progress: number;
  isJoined: boolean;
  category: string;
}

interface FitnessActivity {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'cardio' | 'strength' | 'flexibility';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories: number;
  participants: number;
  isJoined: boolean;
  instructor: string;
  rating: number;
}

const tabs = {
  Posts: {
    title: 'Community Hub',
    subtitle: 'Connect with others on similar journeys',
    icon: MessageCircle,
  },
  Groups: {
    title: 'Support Groups',
    subtitle: 'Join condition-specific communities',
    icon: Users,
  },
  Challenges: {
    title: 'Health Challenges',
    subtitle: 'Achieve goals together',
    icon: Award,
  },
  Fitness: {
    title: 'Fitness Activities',
    subtitle: 'Stay active and healthy',
    icon: Dumbbell,
  },
};

export default function HealthHubPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'Posts' | 'Groups' | 'Challenges' | 'Fitness'>('Posts');

  const postFilters = [
    { id: 'all', name: 'All Posts', icon: MessageCircle },
    { id: 'diabetes', name: 'Diabetes', icon: Activity },
    { id: 'hypertension', name: 'Hypertension', icon: Heart },
    { id: 'mental-health', name: 'Mental Health', icon: Users },
    { id: 'chronic-pain', name: 'Chronic Pain', icon: TrendingUp },
  ];

  const groupCategories = [
    { id: 'all', name: 'All', icon: Users },
    { id: 'support', name: 'Support Groups', icon: Heart },
    { id: 'condition', name: 'Condition-Specific', icon: Activity },
    { id: 'treatment', name: 'Treatment Journey', icon: BookOpen },
  ];

  const fitnessCategories = [
    { id: 'all', name: 'All Activities', icon: Dumbbell },
    { id: 'workout', name: 'Workouts', icon: Activity },
    { id: 'cardio', name: 'Cardio', icon: Heart },
    { id: 'strength', name: 'Strength', icon: TrendingUp },
    { id: 'flexibility', name: 'Flexibility', icon: Users },
  ];

  const communityPosts: CommunityPost[] = [
    {
      id: '1',
      author: {
        name: 'Maria Rodriguez',
        badge: 'Type 2 Diabetes Warrior',
      },
      content:
        'Just hit my 6-month milestone managing my diabetes! My A1C dropped from 9.2 to 6.8. For anyone newly diagnosed - it gets easier with the right support and routine. Happy to share what worked for me! 💪',
      timestamp: '2 hours ago',
      likes: 47,
      comments: 12,
      isLiked: false,
      category: 'diabetes',
      tags: ['diabetes', 'milestone', 'support', 'management'],
    },
    {
      id: '2',
      author: {
        name: 'James Thompson',
        badge: 'Hypertension Advocate',
      },
      content:
        "Sharing my blood pressure tracking journey. Started with 160/95, now consistently at 125/80 after 8 months of lifestyle changes and medication. Don't give up - small changes add up! �",
      timestamp: '4 hours ago',
      likes: 63,
      comments: 18,
      isLiked: true,
      category: 'hypertension',
      tags: ['blood-pressure', 'tracking', 'lifestyle', 'medication'],
    },
    {
      id: '3',
      author: {
        name: 'Dr. Sarah Kim',
        badge: 'Mental Health Specialist',
      },
      content:
        "Reminder: Managing chronic conditions affects mental health too. It's normal to feel overwhelmed sometimes. Connecting with others who understand your journey can make a huge difference. You're not alone. 🤝",
      timestamp: '6 hours ago',
      likes: 89,
      comments: 25,
      isLiked: false,
      category: 'mental-health',
      tags: ['mental-health', 'chronic-illness', 'support', 'community'],
    },
    {
      id: '4',
      author: {
        name: 'Lisa Chen',
        badge: 'Chronic Pain Fighter',
      },
      content:
        "Found some relief with gentle yoga and meditation for my fibromyalgia. It's not a cure, but it helps with both pain management and stress. What techniques have helped you cope with chronic pain?",
      timestamp: '8 hours ago',
      likes: 34,
      comments: 15,
      isLiked: false,
      category: 'chronic-pain',
      tags: ['fibromyalgia', 'pain-management', 'yoga', 'meditation'],
    },
  ];

  const communityGroups: CommunityGroup[] = [
    {
      id: '1',
      name: 'Type 2 Diabetes Support Circle',
      description:
        'A supportive community for people managing Type 2 diabetes - sharing experiences, tips, and encouragement',
      memberCount: 2847,
      category: 'support',
      isJoined: true,
      recentActivity: '12 new posts today',
    },
    {
      id: '2',
      name: 'Hypertension Management Hub',
      description:
        'Connect with others managing high blood pressure - share monitoring tips, lifestyle changes, and success stories',
      memberCount: 1692,
      category: 'condition',
      isJoined: false,
      recentActivity: 'New discussion 3 hours ago',
    },
    {
      id: '3',
      name: 'Mental Health & Chronic Illness',
      description: 'Safe space for discussing the mental health aspects of living with chronic conditions',
      memberCount: 3421,
      category: 'support',
      isJoined: true,
      recentActivity: 'Support session tomorrow',
    },
    {
      id: '4',
      name: 'Fibromyalgia Warriors',
      description: 'Connecting people with fibromyalgia to share coping strategies and find understanding',
      memberCount: 1156,
      category: 'condition',
      isJoined: false,
      recentActivity: 'Pain management tips shared',
    },
    {
      id: '5',
      name: 'Heart Disease Recovery',
      description: 'Support group for those recovering from heart attacks, surgeries, or managing heart disease',
      memberCount: 987,
      category: 'treatment',
      isJoined: true,
      recentActivity: 'Recovery milestone celebrated',
    },
  ];

  const healthChallenges: HealthChallenge[] = [
    {
      id: '1',
      title: 'Blood Sugar Stability Challenge',
      description: 'Track and stabilize blood glucose levels for 30 days with community support',
      participants: 1456,
      duration: '30 days',
      progress: 67,
      isJoined: true,
      category: 'diabetes',
    },
    {
      id: '2',
      title: 'Heart-Healthy Habits',
      description: 'Build sustainable habits for cardiovascular health - exercise, diet, and stress management',
      participants: 892,
      duration: '21 days',
      progress: 0,
      isJoined: false,
      category: 'hypertension',
    },
    {
      id: '3',
      title: 'Mental Wellness Check-ins',
      description: 'Daily mindfulness and mood tracking for better mental health awareness',
      participants: 634,
      duration: '14 days',
      progress: 42,
      isJoined: true,
      category: 'mental-health',
    },
    {
      id: '4',
      title: 'Gentle Movement for Pain Relief',
      description: 'Low-impact exercises and stretches designed for chronic pain management',
      participants: 378,
      duration: '28 days',
      progress: 25,
      isJoined: false,
      category: 'chronic-pain',
    },
  ];

  const fitnessActivities: FitnessActivity[] = [
    {
      id: '1',
      title: 'Morning Yoga Flow',
      description:
        'Start your day with gentle stretches and mindful breathing to improve flexibility and reduce stress',
      type: 'flexibility',
      duration: '30 minutes',
      difficulty: 'beginner',
      calories: 120,
      participants: 1247,
      isJoined: true,
      instructor: 'Sarah Johnson',
      rating: 4.8,
    },
    {
      id: '2',
      title: 'HIIT Cardio Blast',
      description: 'High-intensity interval training to boost metabolism and improve cardiovascular health',
      type: 'cardio',
      duration: '25 minutes',
      difficulty: 'intermediate',
      calories: 280,
      participants: 892,
      isJoined: false,
      instructor: 'Mike Chen',
      rating: 4.6,
    },
    {
      id: '3',
      title: 'Strength Training Basics',
      description: 'Learn proper form and build muscle with bodyweight exercises perfect for beginners',
      type: 'strength',
      duration: '45 minutes',
      difficulty: 'beginner',
      calories: 200,
      participants: 634,
      isJoined: true,
      instructor: 'Emma Rodriguez',
      rating: 4.9,
    },
    {
      id: '4',
      title: 'Pilates Core Workout',
      description: 'Strengthen your core and improve posture with controlled movements and breathing',
      type: 'workout',
      duration: '35 minutes',
      difficulty: 'intermediate',
      calories: 180,
      participants: 456,
      isJoined: false,
      instructor: 'Lisa Park',
      rating: 4.7,
    },
    {
      id: '5',
      title: 'Advanced CrossFit',
      description: 'Challenge yourself with complex movements combining strength, cardio, and agility',
      type: 'workout',
      duration: '60 minutes',
      difficulty: 'advanced',
      calories: 450,
      participants: 234,
      isJoined: false,
      instructor: 'David Kim',
      rating: 4.5,
    },
    {
      id: '6',
      title: 'Meditation & Stretching',
      description: 'End your day with calming stretches and guided meditation for better sleep',
      type: 'flexibility',
      duration: '20 minutes',
      difficulty: 'beginner',
      calories: 50,
      participants: 1789,
      isJoined: true,
      instructor: 'Anna Thompson',
      rating: 4.9,
    },
  ];

  const filteredPosts =
    selectedFilter === 'all' ? communityPosts : communityPosts.filter((p) => p.category === selectedFilter);

  const filteredGroups =
    selectedFilter === 'all' ? communityGroups : communityGroups.filter((g) => g.category === selectedFilter);

  const filteredChallenges =
    selectedFilter === 'all' ? healthChallenges : healthChallenges.filter((c) => c.category === selectedFilter);

  const filteredFitnessActivities =
    selectedFilter === 'all' ? fitnessActivities : fitnessActivities.filter((f) => f.type === selectedFilter);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        color={i < Math.floor(rating) ? '#fbbf24' : '#d1d5db'}
        fill={i < Math.floor(rating) ? '#fbbf24' : 'none'}
      />
    ));
  };

  const { isDarkMode } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
      <Header
        title={tabs[activeTab].title}
        subtitle={tabs[activeTab].subtitle}
        leftIcon={{
          icon: tabs[activeTab].icon,
          accessibilityLabel: tabs[activeTab].title,
        }}
        tabs={Object.keys(tabs)}
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab as keyof typeof tabs)}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={{
          height: '100%',
          backgroundColor: isDarkMode ? '#111827' : '#F0FDF4',
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
          {activeTab === 'Posts' ? (
            /* Post Filters */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
                {postFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => setSelectedFilter(filter.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: selectedFilter === filter.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                      backgroundColor: selectedFilter === filter.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                    }}
                    activeOpacity={0.7}
                  >
                    <filter.icon
                      size={14}
                      color={selectedFilter === filter.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: selectedFilter === filter.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                      }}
                    >
                      {filter.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : activeTab === 'Fitness' ? (
            /* Fitness Categories */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
                {fitnessCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedFilter(category.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: selectedFilter === category.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                      backgroundColor: selectedFilter === category.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                    }}
                    activeOpacity={0.7}
                  >
                    <category.icon
                      size={14}
                      color={selectedFilter === category.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: selectedFilter === category.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                      }}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            /* Group Categories */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
                {groupCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedFilter(category.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: selectedFilter === category.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                      backgroundColor: selectedFilter === category.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                    }}
                    activeOpacity={0.7}
                  >
                    <category.icon
                      size={14}
                      color={selectedFilter === category.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: selectedFilter === category.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                      }}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {activeTab === 'Posts' ? (
            <>
              {/* Community Posts */}
              {filteredPosts.map((post) => (
                <View
                  key={post.id}
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
                  {/* Post Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.5)' : '#d1fae5',
                      }}
                    >
                      <Users size={22} color={isDarkMode ? '#34d399' : '#059669'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          marginBottom: 2,
                        }}
                      >
                        {post.author.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 13,
                            color: isDarkMode ? '#34d399' : '#059669',
                            fontWeight: '500',
                          }}
                        >
                          {post.author.badge}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            marginLeft: 8,
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                          }}
                        >
                          • {post.timestamp}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Post Content */}
                  <Text
                    style={{
                      fontSize: 15,
                      lineHeight: 22,
                      marginBottom: 12,
                      color: isDarkMode ? '#d1d5db' : '#374151',
                    }}
                  >
                    {post.content}
                  </Text>

                  {/* Tags */}
                  {post.tags && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginBottom: 16,
                      }}
                    >
                      {post.tags.map((tag) => (
                        <Text
                          key={tag}
                          style={{
                            fontSize: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginRight: 8,
                            marginBottom: 4,
                            backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                            color: isDarkMode ? '#d1d5db' : '#6b7280',
                          }}
                        >
                          #{tag}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Engagement */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                      activeOpacity={0.7}
                    >
                      <Heart
                        size={20}
                        color={post.isLiked ? '#ef4444' : isDarkMode ? '#9ca3af' : '#64748b'}
                        fill={post.isLiked ? '#ef4444' : 'none'}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          marginLeft: 6,
                          fontWeight: '500',
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                        }}
                      >
                        {post.likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={20} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                      <Text
                        style={{
                          fontSize: 14,
                          marginLeft: 6,
                          fontWeight: '500',
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                        }}
                      >
                        {post.comments}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 12 }} activeOpacity={0.7}>
                      <Share2 size={20} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Empty State */}
              {filteredPosts.length === 0 && (
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="items-center p-8">
                    <MessageCircle size={48} color={isDarkMode ? '#374151' : '#d1d5db'} className="mb-4" />
                    <Text className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      No Posts Found
                    </Text>
                    <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Be the first to share your experience in this condition category!
                    </Text>
                  </View>
                </Card>
              )}
            </>
          ) : activeTab === 'Groups' ? (
            <>
              {/* Community Groups */}
              {filteredGroups.map((group) => (
                <Card key={group.id} className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {group.name}
                        </Text>
                        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {group.description}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className={`rounded-lg px-4 py-2 ${
                          group.isJoined
                            ? isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                            : isDarkMode
                              ? 'bg-emerald-600'
                              : 'bg-emerald-600'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            group.isJoined ? (isDarkMode ? 'text-gray-300' : 'text-gray-700') : 'text-white'
                          }`}
                        >
                          {group.isJoined ? 'Joined' : 'Join'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Users size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {group.memberCount.toLocaleString()} members
                        </Text>
                      </View>
                      <Text className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {group.recentActivity}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          ) : activeTab === 'Challenges' ? (
            <>
              {/* Health Challenges */}
              {filteredChallenges.map((challenge) => (
                <Card key={challenge.id} className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {challenge.title}
                        </Text>
                        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {challenge.description}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className={`rounded-lg px-4 py-2 ${
                          challenge.isJoined
                            ? isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                            : isDarkMode
                              ? 'bg-emerald-600'
                              : 'bg-emerald-600'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            challenge.isJoined ? (isDarkMode ? 'text-gray-300' : 'text-gray-700') : 'text-white'
                          }`}
                        >
                          {challenge.isJoined ? 'Joined' : 'Join'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Challenge Progress */}
                    {challenge.isJoined && challenge.progress > 0 && (
                      <View className="mb-3">
                        <View className="mb-1 flex-row items-center justify-between">
                          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Progress</Text>
                          <Text className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {challenge.progress}%
                          </Text>
                        </View>
                        <View className={`h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <View
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${challenge.progress}%` }}
                          />
                        </View>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Users size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {challenge.participants} participants
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Calendar size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {challenge.duration}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          ) : (
            <>
              {/* Fitness Activities */}
              {filteredFitnessActivities.map((activity) => (
                <Card key={activity.id} className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {activity.title}
                        </Text>
                        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.description}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className={`rounded-lg px-4 py-2 ${
                          activity.isJoined
                            ? isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                            : isDarkMode
                              ? 'bg-emerald-600'
                              : 'bg-emerald-600'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            activity.isJoined ? (isDarkMode ? 'text-gray-300' : 'text-gray-700') : 'text-white'
                          }`}
                        >
                          {activity.isJoined ? 'Joined' : 'Join'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Activity Details */}
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Calendar size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.duration}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Activity size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.calories} cal
                        </Text>
                      </View>
                    </View>

                    {/* Difficulty and Rating */}
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Difficulty:</Text>
                        <Text
                          className={`ml-1 text-sm font-medium ${
                            activity.difficulty === 'beginner'
                              ? isDarkMode
                                ? 'text-green-400'
                                : 'text-green-600'
                              : activity.difficulty === 'intermediate'
                                ? isDarkMode
                                  ? 'text-yellow-400'
                                  : 'text-yellow-600'
                                : isDarkMode
                                  ? 'text-red-400'
                                  : 'text-red-600'
                          }`}
                        >
                          {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        {renderStars(activity.rating)}
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ({activity.rating})
                        </Text>
                      </View>
                    </View>

                    {/* Instructor and Participants */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Users size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                        <Text className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.participants} participants
                        </Text>
                      </View>
                      <Text className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        by {activity.instructor}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}

              {/* Empty State */}
              {filteredFitnessActivities.length === 0 && (
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="items-center p-8">
                    <Dumbbell size={48} color={isDarkMode ? '#374151' : '#d1d5db'} className="mb-4" />
                    <Text className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      No Activities Found
                    </Text>
                    <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No fitness activities available in this category yet!
                    </Text>
                  </View>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
