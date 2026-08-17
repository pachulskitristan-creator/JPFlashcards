// services/ttsService.ts
//
// PLAYS THROUGH SILENT MODE: by default, expo-speech routes audio
// through iOS's "ambient" audio session category, which respects the
// hardware mute switch — same reason a lot of apps go silent when
// muted. Other apps that DO play through silent mode (Spotify,
// YouTube, etc.) explicitly configure their audio session to the
// "Playback" category instead. We do the same thing here via
// expo-audio's setAudioModeAsync({ playsInSilentMode: true }),
// configured once per app session before the first speak() call.
//
// If you tap the speaker and hear NOTHING, and also see NO alert pop
// up on your phone from this file — that means speak() genuinely
// completed successfully with no error. In that case, first check the
// separate "Ringer and Alerts" volume in Settings > Sounds & Haptics
// (independent from media volume) — but with the fix below, it should
// no longer matter whether the phone is physically muted.
//
// If an alert DOES pop up, that tells us the real error message —
// paste it back and we can fix the actual cause.

import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync } from 'expo-audio';

let audioModeConfigured = false;

async function ensureSilentModePlayback(): Promise<void> {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeConfigured = true;
    console.log('[TTS] Audio mode configured to play through silent mode.');
  } catch (e) {
    // Not fatal — speech will still work, it just won't override the mute switch.
    console.warn('[TTS] Could not configure silent-mode playback:', e);
  }
}

export async function speakJapanese(text: string): Promise<void> {
  if (!text) return;

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  await ensureSilentModePlayback();

  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
  } catch (e) {
    console.warn('[TTS] isSpeakingAsync/stop threw (usually safe to ignore):', e);
  }

  console.log('[TTS] calling Speech.speak with:', text);

  Speech.speak(text, {
    language: 'ja-JP',
    pitch: 1.0,
    rate: 0.85,
    onStart: () => console.log('[TTS] onStart fired — audio should be playing now'),
    onDone: () => console.log('[TTS] onDone fired — finished successfully'),
    onStopped: () => console.log('[TTS] onStopped fired'),
    onError: (error) => {
      console.warn('[TTS] onError fired:', error);
      if (__DEV__) {
        Alert.alert('TTS Error', JSON.stringify(error, null, 2));
      }
    },
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
