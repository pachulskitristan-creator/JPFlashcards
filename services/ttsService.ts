// services/ttsService.ts
// Native Japanese text-to-speech, paired with a light haptic tap so
// pressing the speaker button always feels responsive even before
// audio starts playing.

import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export function speakJapanese(text: string): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  Speech.stop();
  Speech.speak(text, {
    language: 'ja-JP',
    pitch: 1.0,
    rate: 0.85, // slightly slower than default for learner clarity
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
