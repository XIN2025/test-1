import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FlaskConical, RefreshCw, Calendar, ChevronRight, Upload } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import { labReportsApi, LabReportSummary } from '../../../services/labReportsApi';
import { useAuth } from '../../../context/AuthContext';
import Header from '@/components/ui/Header';
import { commonStylesDark, commonStylesLight, shadow } from '@/utils/commonStyles';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const UploadButton = ({ handleUpload }: { handleUpload: () => void }) => {
  return (
    <TouchableOpacity
      onPress={handleUpload}
      style={{
        backgroundColor: '#f97316',
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
      <Upload size={16} color="#ffffff" style={{ marginRight: 8 }} />
      <Text
        style={{
          color: '#ffffff',
          fontSize: 14,
          fontWeight: '600',
        }}
      >
        Upload Lab Tests
      </Text>
    </TouchableOpacity>
  );
};

const EmptyState = ({ handleUpload }: { handleUpload: () => void }) => {
  const { isDarkMode } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        marginBottom: 60,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
          borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
          borderWidth: 2,
        }}
      >
        <FlaskConical size={40} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
      </View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          textAlign: 'center',
        }}
      >
        No Tests Found
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Upload PDF lab reports to view your results and track your health metrics over time.
      </Text>
      <UploadButton handleUpload={handleUpload} />
    </View>
  );
};

const ReportCard = ({
  report,
  handleTestPress,
}: {
  report: LabReportSummary;
  handleTestPress: (report: LabReportSummary) => void;
}) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity
      key={report.id}
      onPress={() => handleTestPress(report)}
      style={(isDarkMode ? commonStylesDark : commonStylesLight).pressableCard}
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
                backgroundColor: isDarkMode ? '#34d399' : '#059669',
                marginRight: 6,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: isDarkMode ? '#34d399' : '#059669',
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
  );
};

// Upload Progress Banner component
const UploadProgressBanner = ({
  uploadProgress,
}: {
  uploadProgress: {
    fileName: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message: string;
  };
}) => {
  const { isDarkMode } = useTheme();

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

  const fetchReports = React.useCallback(async () => {
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
  }, [userEmail]);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [userEmail, fetchReports]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }} edges={['top', 'bottom']}>
      <Header
        title="Lab Tests"
        subtitle="Connect to Labcorp"
        showBackButton
        rightIcons={[
          {
            icon: RefreshCw,
            onPress: onRefresh,
            variant: 'secondary',
            accessibilityLabel: 'Refresh',
          },
        ]}
      />

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={isDarkMode ? '#34d399' : '#059669'} />
        </View>
      ) : reports.length === 0 && !uploadProgress ? (
        <EmptyState handleUpload={handleUpload} />
      ) : (
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
          }}
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
          <View style={{ height: '100%', backgroundColor: isDarkMode ? '#111827' : '#f9fafb', gap: 24, padding: 16 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
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

            {uploadProgress ? (
              <UploadProgressBanner uploadProgress={uploadProgress} />
            ) : (
              <UploadButton handleUpload={handleUpload} />
            )}

            <View style={{ gap: 12 }}>
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} handleTestPress={handleTestPress} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
