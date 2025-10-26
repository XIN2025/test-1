import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Activity, AlertCircle, CheckCircle, TrendingUp, TrendingDown, FileX } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { labReportsApi, LabReportDetail, LabReportDetailProperty } from '../../../services/labReportsApi';
import { useAuth } from '../../../context/AuthContext';
import { Accordion } from '../../../components/ui/Accordion';
import Header from '@/components/ui/Header';
import { commonStylesDark, commonStylesLight } from '@/utils/commonStyles';

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return 'Date not available';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return 'Date not available';
  }
};

const cleanDescription = (description: string | null | undefined): string => {
  if (!description) {
    return '';
  }

  return description
    .replace(/[%&<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'normal':
      return <CheckCircle size={12} color="#059669" />;
    case 'high':
      return <TrendingUp size={12} color="#dc2626" />;
    case 'low':
      return <TrendingDown size={12} color="#d97706" />;
    case 'critical':
      return <AlertCircle size={12} color="#dc2626" />;
    default:
      return <Activity size={12} color="#6b7280" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal':
      return '#059669';
    case 'high':
      return '#dc2626';
    case 'low':
      return '#d97706';
    case 'critical':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

const getStatusBackground = (status: string, isDarkMode: boolean) => {
  switch (status) {
    case 'normal':
      return isDarkMode ? '#064e3b' : '#f0fdf4';
    case 'high':
      return isDarkMode ? '#7f1d1d' : '#fef2f2';
    case 'low':
      return isDarkMode ? '#92400e' : '#fffbeb';
    case 'critical':
      return isDarkMode ? '#7f1d1d' : '#fef2f2';
    default:
      return isDarkMode ? '#374151' : '#f9fafb';
  }
};

const TestCard = ({ item }: { item: LabReportDetailProperty }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={(isDarkMode ? commonStylesDark : commonStylesLight).displayCard}>
      {/* Item Header */}
      <View className="flex-col items-start justify-between gap-2">
        <Text className="text-xl font-medium" style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
          {item.property_name}
        </Text>

        <View className="flex-row items-end gap-1">
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
            }}
          >
            {item.value}
          </Text>
          {item.unit && (
            <Text
              style={{
                fontSize: 16,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
                marginBottom: 2,
              }}
            >
              {item.unit}
            </Text>
          )}
        </View>

        {item.reference_range && (
          <Text
            style={{
              fontSize: 14,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            Reference range: {item.reference_range}
          </Text>
        )}

        <View
          className="flex-row items-center self-start rounded-full px-3 py-1.5"
          style={{
            backgroundColor: getStatusBackground(item.status, isDarkMode),
          }}
        >
          {getStatusIcon(item.status)}
          <Text
            className="text-capitalize ml-2 text-xs font-medium"
            style={{
              color: getStatusColor(item.status),
              textTransform: 'capitalize',
            }}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Details Accordion */}
      <Accordion title="Details" isDarkMode={isDarkMode}>
        <Text
          style={{
            fontSize: 14,
            color: isDarkMode ? '#d1d5db' : '#4b5563',
            lineHeight: 20,
          }}
        >
          {cleanDescription(item.property_description) || 'No additional details provided.'}
        </Text>
      </Accordion>
    </View>
  );
};

const Tests = ({ report }: { report: LabReportDetail }) => {
  const { isDarkMode } = useTheme();
  return (
    <FlatList
      renderItem={({ item }) => <TestCard item={item} />}
      data={report?.properties}
      keyExtractor={(item, index) => `${item.property_name}-${index}`}
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
      }}
      contentContainerClassName="p-4 gap-3"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={() => (
        <Text className="mb-2 text-2xl font-bold" style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
          Test Results
        </Text>
      )}
    />
  );
};

const FailedState = () => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <FileX size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        Test Results Loading Failed!
      </Text>
      <Text style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: 8, textAlign: 'center' }}>
        The test results for this report were not found.
      </Text>
    </View>
  );
};

export default function LabTestDetailsPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { testId, testName } = useLocalSearchParams<{ testId: string; testName: string }>();
  const { user } = useAuth();
  const userEmail = user?.email || '';
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<LabReportDetail | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!testId || !userEmail) {
        setLoading(false);
        return;
      }
      try {
        const data = await labReportsApi.getById(testId as string, userEmail);
        setReport(data);
      } catch (error: any) {
        Alert.alert('Failed to load report', error?.message || 'Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [testId, userEmail]);

  if (!loading && !report) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }}
        edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              textAlign: 'center',
            }}
          >
            Test not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 16,
              backgroundColor: isDarkMode ? '#059669' : '#059669',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }}
      edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']}
    >
      <Header
        title={testName}
        subtitle={loading ? 'Loading Date...' : formatDate(report?.test_date)}
        subtitleIcon={Calendar}
        showBackButton
      />

      {loading ? (
        <View className="flex-1 items-center justify-center gap-2">
          <ActivityIndicator size="large" color={isDarkMode ? '#34d399' : '#059669'} />
          <Text className="text-xl text-gray-500">Loading Report...</Text>
        </View>
      ) : report ? (
        <Tests report={report} />
      ) : (
        <FailedState />
      )}
    </SafeAreaView>
  );
}
