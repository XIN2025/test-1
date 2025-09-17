import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FlaskConical, RefreshCw, Calendar, ChevronRight, Upload } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import { labReportsApi, LabReportSummary } from '../../../services/labReportsApi';
import { useAuth } from '../../../context/AuthContext';

export default function LabTestsPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<LabReportSummary[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message: string;
  } | null>(null);
  const userEmail = user?.email || '';

  const fetchReports = async () => {
    if (!userEmail) return;
    try {
      const data = await labReportsApi.getAll(userEmail);
      console.log(data);
      setReports(data);
    } catch (error: any) {
      Alert.alert('Failed to load lab reports', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [userEmail]);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      // Validate extension and size if available
      const isPdf = asset.mimeType === 'application/pdf' || asset.name?.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        Alert.alert('Invalid file', 'Please select a PDF file.');
        return;
      }

      // Start async upload process
      const fileName = asset.name || 'lab-report.pdf';
      setUploadProgress({
        fileName,
        status: 'uploading',
        message: 'Uploading lab report...',
      });

      try {
        const response = await labReportsApi.uploadPdf(asset, userEmail);
        console.log(response);

        // Update to processing status
        setUploadProgress({
          fileName,
          status: 'processing',
          message: 'Processing lab report... This may take a few minutes.',
        });

        // Start polling for completion (you can implement this based on your API)
        // For now, we'll simulate the processing time
        setTimeout(() => {
          setUploadProgress({
            fileName,
            status: 'completed',
            message: 'Lab report processed successfully!',
          });

          // Hide progress after a few seconds and refresh reports
          setTimeout(() => {
            setUploadProgress(null);
            fetchReports();
          }, 3000);
        }, 5000);
      } catch (error: any) {
        setUploadProgress({
          fileName,
          status: 'failed',
          message: error?.message || 'Upload failed. Please try again.',
        });

        setTimeout(() => {
          setUploadProgress(null);
        }, 5000);
      }
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Please try again.');
    }
  };

  const handleTestPress = (report: LabReportSummary) => {
    const title = report.test_title || report.test_description;
    router.push(`/dashboard/lab-tests/${report.id}?testName=${encodeURIComponent(title)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColor = useMemo(() => (isDarkMode ? '#34d399' : '#059669'), [isDarkMode]);

  // Upload Progress Banner component
  const UploadProgressBanner = () => {
    if (!uploadProgress) return null;

    const getStatusColor = () => {
      switch (uploadProgress.status) {
        case 'uploading':
        case 'processing':
          return isDarkMode ? '#3b82f6' : '#1d4ed8';
        case 'completed':
          return isDarkMode ? '#10b981' : '#059669';
        case 'failed':
          return isDarkMode ? '#ef4444' : '#dc2626';
        default:
          return isDarkMode ? '#6b7280' : '#4b5563';
      }
    };

    const getBackgroundColor = () => {
      switch (uploadProgress.status) {
        case 'uploading':
        case 'processing':
          return isDarkMode ? '#1e3a8a' : '#dbeafe';
        case 'completed':
          return isDarkMode ? '#064e3b' : '#d1fae5';
        case 'failed':
          return isDarkMode ? '#7f1d1d' : '#fee2e2';
        default:
          return isDarkMode ? '#374151' : '#f3f4f6';
      }
    };

    return (
      <View
        style={{
          backgroundColor: getBackgroundColor(),
          borderRadius: 12,
          padding: 12,
          marginHorizontal: 16,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {(uploadProgress.status === 'uploading' || uploadProgress.status === 'processing') && (
          <ActivityIndicator size="small" color={getStatusColor()} />
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              color: getStatusColor(),
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 2,
            }}
          >
            {uploadProgress.fileName}
          </Text>
          <Text
            style={{
              color: getStatusColor(),
              fontSize: 12,
              opacity: 0.8,
            }}
          >
            {uploadProgress.message}
          </Text>
        </View>
      </View>
    );
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
          {reports.length <= 0 && (
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

        {reports.length > 0 ? (
          <TouchableOpacity
            onPress={handleUpload}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={20} color={isDarkMode ? '#34d399' : '#059669'} />
          </TouchableOpacity>
        ) : (
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
        )}
      </View>

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
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
        {/* Upload Progress Banner */}
        <UploadProgressBanner />

        <View style={{ padding: 16 }}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator size="large" color={isDarkMode ? '#34d399' : '#059669'} />
            </View>
          ) : reports.length === 0 ? (
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
                Upload PDF lab reports to view your results and track your health metrics over time.
              </Text>

              <TouchableOpacity
                onPress={handleUpload}
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
                <Upload size={20} color="#ffffff" />
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: '600',
                  }}
                >
                  Upload Lab Tests
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
                  {reports.length} test{reports.length !== 1 ? 's' : ''} available
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {reports.map((report) => (
                  <TouchableOpacity
                    key={report.id}
                    onPress={() => handleTestPress(report)}
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
                          {report.test_title || report.test_description}
                        </Text>

                        {report.test_description ? (
                          <Text
                            style={{
                              fontSize: 14,
                              color: isDarkMode ? '#d1d5db' : '#4b5563',
                              lineHeight: 20,
                              marginBottom: 8,
                            }}
                            numberOfLines={2}
                          >
                            {report.test_description}
                          </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Calendar size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                          <Text
                            style={{
                              fontSize: 14,
                              color: isDarkMode ? '#9ca3af' : '#6b7280',
                              marginLeft: 6,
                            }}
                          >
                            {formatDate(report.test_date)}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: statusColor,
                              marginRight: 6,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: statusColor,
                              textTransform: 'capitalize',
                            }}
                          >
                            completed
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isDarkMode ? '#9ca3af' : '#6b7280',
                              marginLeft: 12,
                            }}
                          >
                            {report.properties_count} item{report.properties_count !== 1 ? 's' : ''}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
