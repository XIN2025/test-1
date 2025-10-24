import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import Constants from 'expo-constants';

const WEBSOCKET_URL = `${Constants.expoConfig?.extra?.API_BASE_URL?.replace('http', 'ws')}/chat/transcribe-stream`;

const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6,
  bufferSize: 4096,
  wavFile: 'audio.wav',
};

export const useRawAudioTranscription = (onTranscriptReceived: (transcript: string, isFinal: boolean) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'Microphone Permission',
          message: 'We need microphone access for voice input',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startTranscription = useCallback(async () => {
    if (isRecordingRef.current) {
      console.log('⚠️ Already recording');
      return;
    }

    console.log('🎤 Requesting permissions...');
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone permission');
      return;
    }

    try {
      console.log('🔌 Connecting to WebSocket...');
      const ws = new WebSocket(WEBSOCKET_URL);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsRecording(true);
        isRecordingRef.current = true;

        LiveAudioStream.init(AUDIO_CONFIG);

        LiveAudioStream.on('data', (base64Data: string) => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
              JSON.stringify({
                type: 'audio',
                data: base64Data,
              }),
            );
            console.log(`📡 Sent RAW audio: ${base64Data.length} chars`);
          }
        });

        LiveAudioStream.start();
        console.log('✅ RAW audio streaming started');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          console.error('❌ Server error:', msg.error);
          Alert.alert('Error', msg.error);
          stopTranscription(false);
        } else if (msg.text) {
          console.log(`📝 Transcript (${msg.is_final ? 'FINAL' : 'interim'}): "${msg.text}"`);
          onTranscriptReceived(msg.text, msg.is_final);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        Alert.alert('Connection Error', 'Could not connect to transcription service');
        stopTranscription(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        if (isRecordingRef.current) {
          stopTranscription(false);
        }
      };
    } catch (error) {
      console.error('❌ Error starting:', error);
      Alert.alert('Error', 'Could not start recording');
    }
  }, [onTranscriptReceived]);

  const stopTranscription = useCallback(async (sendMessage = true) => {
    if (!isRecordingRef.current) return;
    console.log('🛑 Stopping...');

    setIsRecording(false);
    isRecordingRef.current = false;

    try {
      LiveAudioStream.stop();
      console.log('✅ Audio stream stopped');
    } catch (error) {
      console.error('❌ Error stopping:', error);
    }

    if (websocketRef.current) {
      if (sendMessage && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: 'stop' }));
      }
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        LiveAudioStream.stop();
      }
    };
  }, []);

  return { isRecording, startTranscription, stopTranscription };
};
