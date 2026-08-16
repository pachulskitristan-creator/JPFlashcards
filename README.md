# JP Flashcards

A minimalist, playful Japanese flashcard app built with Expo (SDK 52, New Architecture-ready), TypeScript, gesture-handler + reanimated, native TTS, and haptics.

## Setup

```bash
npx create-expo-app jp-flashcards --template blank-typescript
cd jp-flashcards
# copy all files from this project into the new folder, overwriting App.tsx/tsconfig.json

npx expo install expo-haptics expo-speech @expo/vector-icons \
  react-native-gesture-handler react-native-reanimated \
  react-native-safe-area-context @react-native-async-storage/async-storage

npx expo start
```

Run on a physical iPhone (or the iOS Simulator) via Expo Go or a dev build. TTS quality is noticeably better on-device than in simulator.

## Project Structure

```
App.tsx                        Root state machine (home ↔ quiz) + custom vocab modal
types.ts                       Shared TypeScript types
data/vocabDatabase.ts          Seed vocabulary (tiers 1–3, travel categories)
services/srsEngine.ts          Leitner-box spaced repetition logic
services/storageService.ts     AsyncStorage persistence (SRS + custom words)
services/ttsService.ts         expo-speech wrapper with haptic feedback
components/QuizCard.tsx        Top prompt card + speaker button
components/SwipeableOption.tsx Answer button with swipe-to-reveal Romaji drawer
components/CategoryFilter.tsx  Reusable chip selector (tiers/categories)
components/CustomVocabManager.tsx  Modal for adding/removing custom cards
screens/HomeScreen.tsx         Mode + filter selection, launches a session
screens/QuizScreen.tsx         Question generation, answer handling, SRS updates
```

## How the pieces fit together

- **SRS**: Every word gets a Leitner box (1–5). Correct answers advance a box (longer
  interval before it's due again); incorrect answers reset to box 1. `buildStudyQueue`
  ranks words: most-overdue first, then brand-new words, then not-yet-due words as filler.
  Progress is persisted to AsyncStorage after every answer.
- **Swipe-to-reveal**: `SwipeableOption` uses a `Gesture.Pan()` restricted to a small
  drag-handle "tab" on the right edge, so it doesn't fight with the tap-to-answer area.
  Dragging past a threshold (or a fast flick) snaps a Romaji drawer open with a spring
  animation and a light selection haptic.
- **Custom vocabulary**: Cards added in `CustomVocabManager` are saved to AsyncStorage
  and merged into the main pool in `App.tsx`, so they flow through the exact same
  filtering, SRS, and quiz-generation logic as the built-in words.

## Extending

- Swap `data/vocabDatabase.ts` for a generated 1500-word frequency list — no other
  file needs to change, since everything reads from the same `VocabWord[]` shape.
- To tune pacing, adjust `BOX_INTERVALS_DAYS` in `services/srsEngine.ts`.
- To support a 4th answer option, just change `OPTIONS_PER_QUESTION` in `QuizScreen.tsx`.
