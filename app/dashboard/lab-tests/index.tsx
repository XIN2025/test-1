import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FlaskConical, Plus, RefreshCw, Calendar, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { mockLabTestsData, mockEmptyLabTestsData } from '../../../utils/mockLabTests';
import { LabTest } from '../../../types/labTests';

export default function LabTestsPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const labTestsData = isConnected ? mockLabTestsData : mockEmptyLabTestsData;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleConnectToLabcorp = () => {
    // Simulate connection
    setIsConnected(true);
  };

  const handleTestPress = (test: LabTest) => {
    router.push(`/dashboard/lab-tests/${test.id}?testName=${encodeURIComponent(test.name)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return isDarkMode ? '#34d399' : '#059669';
      case 'pending':
        return isDarkMode ? '#fbbf24' : '#d97706';
      case 'in_progress':
        return isDarkMode ? '#60a5fa' : '#2563eb';
      default:
        return isDarkMode ? '#9ca3af' : '#6b7280';
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

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
            }}
          >
            Lab Tests
          </Text>
          {isConnected && (
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? '#34d399' : '#059669',
                fontWeight: '500',
              }}
            >
              Connected to Labcorp
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={refreshing}
        >
          <RefreshCw
            size={20}
            color={isDarkMode ? '#34d399' : '#059669'}
            style={{
              transform: [{ rotate: refreshing ? '180deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? '#34d399' : '#059669']}
            tintColor={isDarkMode ? '#34d399' : '#059669'}
          />
        }
      >
        {!isConnected ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                borderWidth: 2,
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                borderStyle: 'solid',
              }}
            >
              <FlaskConical size={48} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              No Tests Found
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 40,
                paddingHorizontal: 20,
              }}
            >
              Connect to Labcorp to view your lab test results and track your health metrics over time.
            </Text>

            <TouchableOpacity
              onPress={handleConnectToLabcorp}
              style={{
                backgroundColor: '#f97316',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#ffffff" />
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                Connect to Labcorp
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  marginBottom: 8,
                }}
              >
                Your Lab Tests
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}
              >
                {labTestsData.tests.length} test{labTestsData.tests.length !== 1 ? 's' : ''} available
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {labTestsData.tests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  onPress={() => handleTestPress(test)}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 2,
                    borderColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                    borderStyle: 'solid',
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '600',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          marginBottom: 4,
                        }}
                      >
                        {test.name}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Calendar size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <Text
                          style={{
                            fontSize: 14,
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            marginLeft: 6,
                          }}
                        >
                          {formatDate(test.date)}
                        </Text>
                      </View>

                      {test.summary && (
                        <Text
                          style={{
                            fontSize: 14,
                            color: isDarkMode ? '#d1d5db' : '#4b5563',
                            lineHeight: 20,
                            marginBottom: 8,
                          }}
                        >
                          {test.summary}
                        </Text>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getStatusColor(test.status),
                            marginRight: 6,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: getStatusColor(test.status),
                            textTransform: 'capitalize',
                          }}
                        >
                          {test.status.replace('_', ' ')}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            marginLeft: 12,
                          }}
                        >
                          {test.items.length} item{test.items.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
