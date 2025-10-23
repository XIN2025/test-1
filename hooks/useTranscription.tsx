import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const RECORDING_OPTIONS = {
  isMeteringEnabled: true,
  android: {
    extension: '.3gp',
    outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
    audioEncoder: Audio.AndroidAudioEncoder.AMR_NB,
    sampleRate: 8000,
    numberOfChannels: 1,
    bitRate: 12200,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const WEBSOCKET_URL = `${Constants.expoConfig?.extra?.API_BASE_URL?.replace('http', 'ws')}/chat/transcribe-stream`;

export const useTranscription = (onTranscriptReceived: (transcript: string, isFinal: boolean) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendAudioChunk = useCallback(async (uri: string) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not open, skipping audio chunk.');
      return;
    }
    try {
      const audioData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (audioData && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        console.log(`📤 Sent audio chunk of size: ${audioData.length}`);
        websocketRef.current.send(JSON.stringify({ type: 'audio', data: audioData }));
      }
    } catch (error) {
      console.error('❌ Error reading or sending audio chunk:', error);
    }
  }, []);

  const startTranscription = useCallback(async () => {
    console.log('🎤 Requesting microphone permissions...');
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permissions required', 'Please grant microphone permissions in your settings.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🔌 Connecting to transcription WebSocket...');
      const ws = new WebSocket(WEBSOCKET_URL);
      websocketRef.current = ws;

      ws.onopen = async () => {
        console.log('✅ WebSocket connected');
        setIsRecording(true);
        setTranscript('');

        console.log('🎙️ Starting audio recording...');
        const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
        recordingRef.current = recording;
        console.log('✅ Recording started');

        intervalRef.current = setInterval(async () => {
          try {
            if (!recordingRef.current || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
              return;
            }

            const uri = recordingRef.current.getURI();
            await recordingRef.current.stopAndUnloadAsync();

            if (uri) {
              await sendAudioChunk(uri);
            }

            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
              const { recording: newRecording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
              recordingRef.current = newRecording;
            }
          } catch (error) {
            console.error('❌ Error in recording cycle:', error);

            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, 1000);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.error) {
          console.error('❌ Error from server:', message.error);
          Alert.alert('Transcription Error', message.error);
          stopTranscription(false);
        } else if (message.text) {
          onTranscriptReceived(message.text, message.is_final);
          if (message.is_final) {
            setTranscript((prev) => prev + message.text + ' ');
          }
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        Alert.alert('Connection Error', 'Could not connect to the transcription service.');
        stopTranscription();
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        stopTranscription(false);
      };
    } catch (error) {
      console.error('❌ Error starting transcription:', error);
      Alert.alert('Error', 'Could not start recording.');
    }
  }, [onTranscriptReceived, sendAudioChunk]);

  const stopTranscription = useCallback(
    async (sendMessage = true) => {
      if (!isRecording) return;
      console.log('🛑 Stopping transcription...');
      setIsRecording(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      try {
        if (recordingRef.current) {
          const uri = recordingRef.current.getURI();
          await recordingRef.current.stopAndUnloadAsync();

          if (uri && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            await sendAudioChunk(uri);
          }
          console.log('✅ Recording stopped and unloaded');
        }
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
      } finally {
        recordingRef.current = null;
      }

      if (websocketRef.current) {
        if (sendMessage && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({ type: 'stop' }));
        }
        if (websocketRef.current.readyState !== WebSocket.CLOSED) {
          websocketRef.current.close();
        }
      }
      websocketRef.current = null;
    },
    [isRecording, sendAudioChunk],
  );

  return { isRecording, transcript, startTranscription, stopTranscription };
};
