// components/MilestoneCelebration.tsx
// Fires every 25 correct answers (see App.tsx's milestone check) — one of
// ten randomly-picked celebration "scenes" plays: the mascot logo does
// one of ten distinct motions (spin, bounce, pulse, shake, a double
// flip, a slide-up, a wiggle, a gentle float, a zoom-spin, a springy
// pop) paired with one of three particle bursts (confetti, fireworks,
// sparkle) built from one shared particle engine, not ten bespoke
// ones — same idea as BottomTabBar's GlassSurface: one flexible piece
// reused with different parameters rather than duplicated per variant.

import React, { useEffect, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { ThemeColors } from '../theme/theme';

interface MilestoneCelebrationProps {
  correctCount: number;
  onDismiss: () => void;
  colors: ThemeColors;
}

type LogoMotion =
  | 'spin'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'zoomRotate'
  | 'slideUp'
  | 'wiggle'
  | 'flip'
  | 'float'
  | 'pop';

type ParticleVariant = 'confetti' | 'fireworks' | 'sparkle';

interface Scene {
  id: string;
  message: string;
  logoMotion: LogoMotion;
  particles: ParticleVariant;
}

const SCENES: Scene[] = [
  { id: 'roll', message: "You're on a roll!", logoMotion: 'spin', particles: 'confetti' },
  { id: 'crushing', message: "You're crushing it!", logoMotion: 'bounce', particles: 'fireworks' },
  { id: 'milestone', message: 'Milestone reached!', logoMotion: 'zoomRotate', particles: 'confetti' },
  { id: 'amazing', message: 'Amazing progress!', logoMotion: 'pulse', particles: 'sparkle' },
  { id: 'keepgoing', message: 'Keep it up!', logoMotion: 'wiggle', particles: 'confetti' },
  { id: 'nailedit', message: 'Nailed it!', logoMotion: 'flip', particles: 'fireworks' },
  { id: 'levelup', message: 'Vocabulary +25!', logoMotion: 'slideUp', particles: 'sparkle' },
  { id: 'stellar', message: 'Stellar work!', logoMotion: 'float', particles: 'confetti' },
  { id: 'unstoppable', message: "You're unstoppable!", logoMotion: 'shake', particles: 'fireworks' },
  { id: 'greatjob', message: 'Great job!', logoMotion: 'pop', particles: 'confetti' },
];

const FESTIVE_COLORS = ['#FF8FAB', '#E63946', '#FFD60A', '#6A9955', '#4361EE'];
const PARTICLE_COUNT = 26;

/** Picks a random scene — called once per mount by the component below, not on every render. */
export function pickRandomScene(): Scene {
  return SCENES[Math.floor(Math.random() * SCENES.length)];
}

interface ParticleSpec {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  shape: 'rect' | 'circle';
  spin: number;
}

function buildParticles(variant: ParticleVariant): ParticleSpec[] {
  const specs: ParticleSpec[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const color = FESTIVE_COLORS[i % FESTIVE_COLORS.length];
    if (variant === 'confetti') {
      specs.push({
        angle: -100 - Math.random() * 340, // mostly upward, spraying wide
        distance: 90 + Math.random() * 110,
        size: 6 + Math.random() * 6,
        color,
        delay: Math.random() * 120,
        shape: 'rect',
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
      });
    } else if (variant === 'fireworks') {
      const evenAngle = (360 / PARTICLE_COUNT) * i;
      specs.push({
        angle: evenAngle,
        distance: 70 + Math.random() * 60,
        size: 5 + Math.random() * 4,
        color,
        delay: 0,
        shape: 'circle',
        spin: 0,
      });
    } else {
      specs.push({
        angle: -90 + (Math.random() - 0.5) * 140,
        distance: 60 + Math.random() * 80,
        size: 10 + Math.random() * 8,
        color,
        delay: Math.random() * 300,
        shape: 'circle',
        spin: (Math.random() > 0.5 ? 1 : -1) * 180,
      });
    }
  }
  return specs;
}

function Particle({ spec, burst }: { spec: ParticleSpec; burst: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(burst.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const local = interpolate(t, [spec.delay / 500, 1], [0, 1], Extrapolation.CLAMP);
    const rad = (spec.angle * Math.PI) / 180;
    const dist = local * spec.distance;
    const gravity = local * local * 40;
    const x = Math.cos(rad) * dist;
    const y = Math.sin(rad) * dist + gravity;
    const opacity = interpolate(local, [0, 0.15, 0.75, 1], [0, 1, 1, 0]);
    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${local * spec.spin}deg` },
        { scale: interpolate(local, [0, 0.2, 1], [0.3, 1, 0.8]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: spec.size,
          height: spec.size,
          backgroundColor: spec.color,
          borderRadius: spec.shape === 'circle' ? spec.size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

export default function MilestoneCelebration({ correctCount, onDismiss, colors }: MilestoneCelebrationProps) {
  // Rendered conditionally by the caller (mounted only when there's a
  // milestone to show, same pattern as AchievementUnlockOverlay) — so
  // "picked once" just means picked on mount, no visible-prop needed.
  const scene = useMemo(() => pickRandomScene(), []);
  const particleSpecs = useMemo(() => buildParticles(scene.particles), [scene.particles]);

  const enter = useSharedValue(0);
  const burst = useSharedValue(0);
  const loop = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    enter.value = 0;
    burst.value = 0;
    loop.value = 0;
    cardOpacity.value = withTiming(1, { duration: 200 });
    burst.value = withDelay(80, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));

    switch (scene.logoMotion) {
      case 'bounce':
      case 'pop':
        enter.value = withSpring(1, { damping: 7, stiffness: 160 });
        break;
      case 'zoomRotate':
        enter.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
        break;
      case 'flip':
        enter.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
        break;
      case 'shake':
        enter.value = withSequence(
          withTiming(1, { duration: 150 }),
          withRepeat(withSequence(withTiming(1.06, { duration: 60 }), withTiming(0.97, { duration: 60 })), 4, true),
          withTiming(1, { duration: 100 })
        );
        break;
      default:
        enter.value = withSpring(1, { damping: 11, stiffness: 140 });
    }

    if (scene.logoMotion === 'spin' || scene.logoMotion === 'pulse' || scene.logoMotion === 'wiggle' || scene.logoMotion === 'float') {
      loop.value = withDelay(300, withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    switch (scene.logoMotion) {
      case 'spin':
        return { transform: [{ scale: enter.value }, { rotate: `${loop.value * 360}deg` }] };
      case 'bounce':
        return { transform: [{ scale: enter.value }, { translateY: interpolate(enter.value, [0, 1], [40, 0]) }] };
      case 'pulse':
        return { transform: [{ scale: enter.value * (1 + Math.sin(loop.value * Math.PI * 2) * 0.06) }] };
      case 'shake':
        return { transform: [{ scale: enter.value }] };
      case 'zoomRotate':
        return {
          opacity: enter.value,
          transform: [
            { scale: interpolate(enter.value, [0, 0.7, 1], [0.2, 1.15, 1]) },
            { rotate: `${enter.value * 720}deg` },
          ],
        };
      case 'slideUp':
        return { opacity: enter.value, transform: [{ translateY: interpolate(enter.value, [0, 1], [70, 0]) }] };
      case 'wiggle':
        return { transform: [{ scale: enter.value }, { rotate: `${Math.sin(loop.value * Math.PI * 2) * 8}deg` }] };
      case 'flip':
        return {
          opacity: enter.value,
          transform: [{ scale: enter.value }, { perspective: 800 }, { rotateY: `${enter.value * 360}deg` }],
        };
      case 'float':
        return { transform: [{ scale: enter.value }, { translateY: Math.sin(loop.value * Math.PI * 2) * 8 }] };
      case 'pop':
      default:
        return { transform: [{ scale: enter.value }] };
    }
  });

  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, cardStyle]}>
          <View style={styles.stage}>
            {particleSpecs.map((spec, i) => (
              <Particle key={i} spec={spec} burst={burst} />
            ))}
            <Animated.View style={logoStyle}>
              <Image source={require('../assets/images/adaptive-icon.png')} style={styles.logo} resizeMode="contain" />
            </Animated.View>
          </View>

          <Text style={[styles.message, { color: colors.textPrimary }]}>{scene.message}</Text>
          <Text style={[styles.subMessage, { color: colors.textSecondary }]}>
            {correctCount} correct answers — keep going!
          </Text>

          <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onDismiss}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>Nice!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,15,25,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    overflow: 'hidden',
  },
  stage: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  logo: {
    width: 84,
    height: 84,
  },
  message: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  subMessage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
