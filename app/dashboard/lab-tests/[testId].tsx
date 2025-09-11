import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Activity, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { mockLabTestsData } from '../../../utils/mockLabTests';
import { LabTestItem } from '../../../types/labTests';
import { Accordion } from '../../../components/ui/Accordion';

export default function LabTestDetailsPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { testId, testName } = useLocalSearchParams<{ testId: string; testName: string }>();

  const test = mockLabTestsData.tests.find((t) => t.id === testId);

  if (!test) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }} edges={['top']}>
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle size={20} color="#059669" />;
      case 'high':
        return <TrendingUp size={20} color="#dc2626" />;
      case 'low':
        return <TrendingDown size={20} color="#d97706" />;
      case 'critical':
        return <AlertCircle size={20} color="#dc2626" />;
      default:
        return <Activity size={20} color="#6b7280" />;
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

  const getStatusBackground = (status: string) => {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={isDarkMode ? '#f3f4f6' : '#374151'} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
            }}
          >
            {decodeURIComponent(testName || test.name)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Calendar size={12} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                marginLeft: 4,
              }}
            >
              {formatDate(test.date)}
            </Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Test Summary */}
        {test.summary && (
          <View
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                marginBottom: 8,
              }}
            >
              Test Summary
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDarkMode ? '#d1d5db' : '#4b5563',
                lineHeight: 20,
              }}
            >
              {test.summary}
            </Text>
          </View>
        )}

        {/* Test Items */}
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: 16,
            }}
          >
            Test Results
          </Text>

          <View style={{ gap: 12 }}>
            {test.items.map((item: LabTestItem) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Item Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 20,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: '700',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          marginRight: 8,
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
                          }}
                        >
                          {item.unit}
                        </Text>
                      )}
                    </View>

                    {item.normalRange && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          marginBottom: 8,
                        }}
                      >
                        Normal range: {item.normalRange}
                      </Text>
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: getStatusBackground(item.status),
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        alignSelf: 'flex-start',
                      }}
                    >
                      {getStatusIcon(item.status)}
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: getStatusColor(item.status),
                          marginLeft: 6,
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.status}
                      </Text>
                    </View>
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
                    {item.details}
                  </Text>
                  {item.lastUpdated && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        marginTop: 12,
                        fontStyle: 'italic',
                      }}
                    >
                      Last updated:{' '}
                      {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </Accordion>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
