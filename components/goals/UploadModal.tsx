import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { AlertCircle, CheckCircle, X } from 'lucide-react-native';
import DeleteFileButton from './DeleteFileButton';
import { goalsApi } from '@/services/goalsApi';
import { DocumentPickerAsset } from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { UploadedFile, UploadProgress } from '@/app/dashboard/goals';

interface UploadModalProps {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  isDarkMode: boolean;
  uploadProgress: UploadProgress | null;
  setUploadProgress: React.Dispatch<React.SetStateAction<UploadProgress | null>>;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  uploadingFileId: string | null;
  setUploadingFileId: (fileId: string | null) => void;
  setUploadingUploadId: (uploadId: string | null) => void;
  userEmail: string;
  generatingPlan: boolean;
  pickDocument: () => Promise<DocumentPickerAsset | null>;
  uploadMonitorActiveRef: React.RefObject<boolean>;
  dedupeFiles: (files: UploadedFile[]) => UploadedFile[];
}

const UploadModal: React.FC<UploadModalProps> = ({
  showUploadModal,
  setShowUploadModal,
  isDarkMode,
  uploadProgress,
  setUploadProgress,
  uploadedFiles,
  setUploadedFiles,
  isUploading,
  setIsUploading,
  uploadingFileId,
  setUploadingFileId,
  setUploadingUploadId,
  userEmail,
  generatingPlan,
  pickDocument,
  uploadMonitorActiveRef,
  dedupeFiles,
}) => {
  const { user } = useAuth();

  const uploadFileToServer = async (file: DocumentPickerAsset) => {
    try {
      if (!userEmail) {
        console.error('User email missing. Context:', { userEmail, user });
        throw new Error('User email is required for document upload');
      }

      // For all uploads, pass the file info and userEmail
      return await goalsApi.uploadDocument(
        file.file || {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        },
        userEmail,
      );
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  };

  return (
    <Modal visible={showUploadModal} transparent animationType="fade" onRequestClose={() => setShowUploadModal(false)}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <View
          className={`mx-4 w-full max-w-md rounded-xl p-5 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
          style={{ elevation: 20 }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Manage Documents
            </Text>
            <TouchableOpacity onPress={() => setShowUploadModal(false)} className="p-1">
              <X size={20} color={isDarkMode ? '#d1d5db' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {/* Note: Only PDF files can be uploaded */}
          <View className="mb-3">
            <Text className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              Only PDF files can be uploaded.
            </Text>
          </View>

          {uploadProgress && (
            <View
              className={`mb-4 rounded-lg border p-3 ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <View className="mb-2 flex-row items-center">
                {uploadProgress.status === 'processing' ? (
                  <ActivityIndicator
                    size="small"
                    color={isDarkMode ? '#34d399' : '#059669'}
                    style={{ marginRight: 8 }}
                  />
                ) : uploadProgress.status === 'completed' ? (
                  <CheckCircle size={18} color={isDarkMode ? '#34d399' : '#059669'} style={{ marginRight: 8 }} />
                ) : (
                  <AlertCircle size={18} color={isDarkMode ? '#f87171' : '#ef4444'} style={{ marginRight: 8 }} />
                )}
                <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {uploadProgress.status === 'processing'
                    ? 'Processing Document'
                    : uploadProgress.status === 'completed'
                      ? 'Upload Complete'
                      : 'Upload Failed'}
                </Text>
              </View>
              <Text className={`mb-2 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {uploadProgress.filename}
              </Text>
              <View className={`mb-2 h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <View
                  className="h-2"
                  style={{
                    width: `${uploadProgress.percentage}%`,
                    backgroundColor:
                      uploadProgress.status === 'failed'
                        ? isDarkMode
                          ? '#f87171'
                          : '#ef4444'
                        : isDarkMode
                          ? '#34d399'
                          : '#059669',
                  }}
                />
              </View>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {uploadProgress.message}
              </Text>
              {uploadProgress.status === 'completed' && (
                <View className={`mt-2 rounded-md p-2 ${isDarkMode ? 'bg-emerald-950/50' : 'bg-green-50'}`}>
                  <Text className={`text-xs ${isDarkMode ? 'text-emerald-300' : 'text-green-800'}`}>
                    Extracted {uploadProgress.entitiesCount} entities & {uploadProgress.relationshipsCount}{' '}
                    relationships
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="mb-4 max-h-56">
            <Text className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Uploaded Files
            </Text>
            {uploadedFiles.length === 0 && !uploadProgress && (
              <View className={`items-center rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No documents uploaded yet.
                </Text>
              </View>
            )}
            <ScrollView>
              {uploadedFiles.map((file) => (
                <View
                  key={file.name}
                  className={`mb-2 flex-row items-center justify-between rounded-lg px-3 py-2 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}
                >
                  <View className="mr-2 flex-1">
                    <Text
                      className={`text-xs font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <Text className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(file.size / 1024).toFixed(1)} KB · {file.type}
                    </Text>
                  </View>
                  <DeleteFileButton
                    onDelete={async () => {
                      try {
                        if (file.upload_id) {
                          await goalsApi.deleteUploadedFile(file.upload_id);
                        }
                        const files = await goalsApi.getUploadedFiles(userEmail);
                        setUploadedFiles(
                          files.map((f) => ({
                            id: f.id,
                            upload_id: f.upload_id,
                            name: f.filename,
                            type: f.extension,
                            size: f.size,
                            status: f.status,
                            entities_count: f.entities_count,
                            relationships_count: f.relationships_count,
                          })),
                        );
                      } catch (err) {
                        Alert.alert('Error', 'Failed to delete file');
                        throw err; // Re-throw to trigger error state in button
                      }
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View className="flex-row justify-end gap-2 space-x-3">
            <TouchableOpacity
              onPress={() => setShowUploadModal(false)}
              className={`rounded-lg px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Text className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                // Custom upload handler to check PDF type before uploading
                try {
                  const file = await pickDocument();
                  if (!file) return;

                  // Check for PDF by mimeType or extension
                  const isPdf =
                    (file.mimeType && file.mimeType.toLowerCase() === 'application/pdf') ||
                    (file.name && file.name.toLowerCase().endsWith('.pdf'));

                  if (!isPdf) {
                    if (Platform.OS === 'web') {
                      window.alert('Only PDF files can be uploaded. Please select a PDF document.');
                    } else {
                      Alert.alert('Invalid File', 'Only PDF files can be uploaded. Please select a PDF document.');
                    }
                    return;
                  }

                  // Check if file is already being uploaded
                  if (uploadingFileId === file.name) {
                    Alert.alert(
                      'Upload in Progress',
                      'This file is already being uploaded. Please wait for it to complete.',
                    );
                    return;
                  }

                  // Check if file is already uploaded
                  if (uploadedFiles.some((f) => f.name === file.name)) {
                    Alert.alert('File Already Uploaded', 'This file has already been uploaded.');
                    return;
                  }

                  // Test if backend is reachable
                  const isBackendReachable = await goalsApi.testBackendConnection();
                  if (!isBackendReachable) {
                    console.error('Backend not reachable');
                    Alert.alert(
                      'Connection Error',
                      'Cannot connect to the backend server. Please make sure the API server is running.',
                    );
                    return;
                  }

                  // Step 2: Start upload process
                  setIsUploading(true);
                  setUploadingFileId(file.name);
                  setUploadingUploadId('temp-id');
                  setUploadProgress({
                    uploadId: 'temp-id',
                    filename: file.name,
                    percentage: 5,
                    message: 'Preparing file for upload...',
                    status: 'processing',
                    entitiesCount: 0,
                    relationshipsCount: 0,
                  });

                  // Step 3: Simulate file preparation
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  setUploadProgress((prev: UploadProgress | null) =>
                    prev
                      ? {
                          ...prev,
                          message: 'Reading file content...',
                          percentage: 10,
                        }
                      : null,
                  );

                  // Step 4: Upload file to server
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  setUploadProgress((prev: UploadProgress | null) =>
                    prev
                      ? {
                          ...prev,
                          message: 'Uploading file to server...',
                          percentage: 15,
                        }
                      : null,
                  );

                  const { upload_id } = await uploadFileToServer(file);

                  setUploadingUploadId(upload_id);
                  setUploadProgress((prev: UploadProgress | null) =>
                    prev
                      ? {
                          ...prev,
                          uploadId: upload_id,
                          message: 'File uploaded successfully, starting analysis...',
                          percentage: 25,
                        }
                      : null,
                  );

                  // Step 5: Monitor progress with enhanced messaging
                  if (uploadMonitorActiveRef.current) {
                    console.log('Upload monitor already active, skipping new interval');
                    return;
                  }
                  uploadMonitorActiveRef.current = true;
                  const progressInterval = setInterval(async () => {
                    try {
                      const progress = await goalsApi.monitorUploadProgress(upload_id);

                      // Enhanced progress messages based on percentage
                      let enhancedMessage = progress.message;
                      if (progress.percentage <= 30) {
                        enhancedMessage = 'Extracting text from document...';
                      } else if (progress.percentage <= 50) {
                        enhancedMessage = 'Analyzing document structure...';
                      } else if (progress.percentage <= 70) {
                        enhancedMessage = 'Identifying medical entities...';
                      } else if (progress.percentage <= 90) {
                        enhancedMessage = 'Extracting relationships and connections...';
                      } else if (progress.percentage < 100) {
                        enhancedMessage = 'Finalizing analysis...';
                      }

                      setUploadProgress((prev: UploadProgress | null) =>
                        prev
                          ? {
                              ...prev,
                              percentage: progress.percentage,
                              message: enhancedMessage,
                              status: progress.status,
                              entitiesCount: progress.entities_count || 0,
                              relationshipsCount: progress.relationships_count || 0,
                            }
                          : null,
                      );

                      // Stop monitoring if completed or failed
                      if (progress.status === 'completed' || progress.status === 'failed') {
                        clearInterval(progressInterval);
                        setIsUploading(false);
                        setUploadingFileId(null);
                        setUploadingUploadId(null);
                        uploadMonitorActiveRef.current = false;

                        if (progress.status === 'completed') {
                          // Show completion message briefly
                          setUploadProgress((prev: UploadProgress | null) =>
                            prev
                              ? ({
                                  ...prev,
                                  message: 'Analysis complete! Document processed successfully.',
                                  percentage: 100,
                                } as UploadProgress)
                              : null,
                          );

                          // Refresh uploaded files list from backend
                          try {
                            if (!userEmail) {
                              console.warn('User email is undefined, skipping file refresh');
                              return;
                            }
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
                            console.warn('Failed to refresh uploaded files', err);
                          }

                          Alert.alert('Success', 'Document uploaded and analyzed successfully!');
                        } else {
                          Alert.alert('Error', 'Document processing failed. Please try again.');
                        }

                        // Clear progress after a delay
                        setTimeout(() => {
                          setUploadProgress(null);
                        }, 3000);
                      }
                    } catch (error) {
                      console.error('Progress monitoring error:', error);
                      clearInterval(progressInterval);
                      setIsUploading(false);
                      setUploadingFileId(null);
                      setUploadingUploadId(null);
                      setUploadProgress(null);
                      uploadMonitorActiveRef.current = false;
                      Alert.alert('Error', 'Failed to monitor upload progress. Please try again.');
                    }
                  }, 1000); // Check progress every second
                } catch (error) {
                  console.error('Upload error:', error);
                  setIsUploading(false);
                  setUploadingFileId(null);
                  setUploadingUploadId(null);
                  setUploadProgress(null);
                  Alert.alert(
                    'Error',
                    `Upload failed: ${
                      error instanceof Error ? error.message : 'Unknown error'
                    }. Please check if the backend server is running and try again.`,
                  );
                }
              }}
              disabled={isUploading || generatingPlan}
              className={`rounded-lg px-4 py-2 ${
                isUploading
                  ? isDarkMode
                    ? 'bg-emerald-900'
                    : 'bg-emerald-300'
                  : isDarkMode
                    ? 'bg-emerald-700'
                    : 'bg-emerald-600'
              }`}
            >
              <Text className="text-sm font-medium text-white">{isUploading ? 'Uploading...' : 'Upload Document'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UploadModal;
