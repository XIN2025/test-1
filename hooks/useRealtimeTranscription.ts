import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

export const useRealtimeTranscription = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false); // Prevent multiple simultaneous starts

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:8000';
  const WS_BASE_URL = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

  const startListening = async () => {
    // Prevent multiple simultaneous starts
    if (isStartingRef.current || isListeningRef.current) {
      console.log('⚠️ Already starting or listening, ignoring...');
      return;
    }

    isStartingRef.current = true;

    try {
      console.log('🎤 Requesting microphone permissions...');
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice input');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Connect to WebSocket first
      console.log('🔌 Connecting to transcription WebSocket...');
      const ws = new WebSocket(`${WS_BASE_URL}/chat/transcribe-stream`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('✅ WebSocket connected');

        // Start recording after WebSocket is connected
        try {
          console.log('🎙️ Starting audio recording...');
          const { recording } = await Audio.Recording.createAsync({
            android: {
              extension: '.m4a',
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 128000,
            },
            ios: {
              extension: '.wav',
              audioQuality: Audio.IOSAudioQuality.HIGH,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {
              mimeType: 'audio/webm',
              bitsPerSecond: 128000,
            },
          });

          recordingRef.current = recording;
          setIsListening(true);
          isListeningRef.current = true;
          isStartingRef.current = false; // Successfully started
          console.log('✅ Recording started');

          // Start streaming audio chunks periodically
          startStreamingAudio();
        } catch (err) {
          console.error('❌ Failed to start recording', err);
          isStartingRef.current = false;
          ws.close();
          Alert.alert('Error', 'Failed to start recording. Please try again.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📝 Received transcription:', data);

          if (data.is_final) {
            // Final transcript
            setTranscript((prev) => prev + (prev ? ' ' : '') + data.text);
            setInterimTranscript('');
          } else {
            // Interim/partial transcript
            setInterimTranscript(data.text || '');
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        isStartingRef.current = false;
        stopListening();
        Alert.alert('Connection Error', 'Failed to connect to transcription service. Please try again.');
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        isListeningRef.current = false;
        setIsListening(false);
      };
    } catch (err) {
      console.error('❌ Failed to start listening', err);
      isStartingRef.current = false;
      Alert.alert('Error', 'Failed to start voice input. Please try again.');
    }
  };

  const startStreamingAudio = async () => {
    // Record and send audio in 1-second chunks
    const recordAndSendChunk = async () => {
      try {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        // Stop current recording
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();

          if (uri) {
            // Read the audio file as base64
            const audioBase64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Send audio chunk to WebSocket
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'audio',
                  data: audioBase64,
                }),
              );
              console.log('📤 Sent audio chunk:', audioBase64.substring(0, 50) + '...');
            }
          }

          recordingRef.current = null;
        }

        // Start new recording for next chunk
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isListeningRef.current) {
          const { recording } = await Audio.Recording.createAsync({
            android: {
              extension: '.m4a',
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 128000,
            },
            ios: {
              extension: '.wav',
              audioQuality: Audio.IOSAudioQuality.HIGH,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {
              mimeType: 'audio/webm',
              bitsPerSecond: 128000,
            },
          });

          recordingRef.current = recording;
        }
      } catch (err) {
        console.error('❌ Error in chunk recording:', err);
        // If we fail to create new recording, stop the whole process
        stopListening();
      }
    };

    // Send chunks every 1 second
    streamIntervalRef.current = setInterval(recordAndSendChunk, 1000);
  };

  const stopListening = useCallback(async () => {
    console.log('🛑 Stopping transcription...');

    // Set flags to false first
    isListeningRef.current = false;
    isStartingRef.current = false;
    setIsListening(false);

    // Clear streaming interval
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    // Stop recording and send final chunk
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();

        // Send final chunk
        if (uri && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const audioBase64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              data: audioBase64,
            }),
          );
          console.log('📤 Sent final audio chunk');
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        recordingRef.current = null;
      } catch (err) {
        console.error('❌ Error stopping recording:', err);
      }
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    console.log('✅ Transcription stopped');
  }, []);

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  // Get combined transcript (final + interim)
  const getFullTranscript = () => {
    if (interimTranscript) {
      return transcript + (transcript ? ' ' : '') + interimTranscript;
    }
    return transcript;
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: getFullTranscript(),
    startListening,
    stopListening,
    resetTranscript,
  };
};
