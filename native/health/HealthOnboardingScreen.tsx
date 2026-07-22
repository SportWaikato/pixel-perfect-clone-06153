// ── HealthOnboardingScreen.tsx ──
// Karawhiua native onboarding for watch sync. Detects the platform, guides
// Android users to install Health Connect if it's missing, then requests
// workout permissions. Palette matches the Karawhiua brand (deep green +
// magenta) rather than a generic template.
//
// Needs a dev-client build (eas build / npx expo run) — Expo Go can't load the
// native health modules.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import {
  isAndroid,
  isIOS,
  isHealthConnectAvailable,
  isAppleHealthAvailable,
  requestHealthConnectPermissions,
  requestAppleHealthPermissions,
  openHealthConnectPlayStore,
} from './health-provider';

// Karawhiua brand tokens (mirror of src/styles.css --brand-*).
const BRAND = {
  green: '#1B5E4B',
  deep: '#0C4036',
  magenta: '#D103D1',
  grey: '#F5F5F0',
  ink: '#333333',
  muted: '#6B7280',
  error: '#DC2626',
  white: '#FFFFFF',
};

type Step = 'intro' | 'download-app' | 'request-perms' | 'complete' | 'done';

export default function HealthOnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Android: guide through Health Connect install ──
  const startAndroidOnboarding = async () => {
    setLoading(true);
    const available = await isHealthConnectAvailable();
    setLoading(false);
    setStep(available ? 'request-perms' : 'download-app');
  };

  // ── iOS: go straight to permissions ──
  const startIOSOnboarding = async () => {
    setLoading(true);
    const available = await isAppleHealthAvailable();
    setLoading(false);
    if (available) {
      setStep('request-perms');
    } else {
      setError('Apple Health is not available on this device.');
      setStep('complete');
    }
  };

  const requestPermissions = async () => {
    setLoading(true);
    let granted = false;
    if (isAndroid()) {
      granted = await requestHealthConnectPermissions();
    } else if (isIOS()) {
      granted = await requestAppleHealthPermissions();
    }
    setLoading(false);

    if (granted) {
      setError('');
      setStep('complete');
    } else {
      setError(
        isAndroid()
          ? 'Permissions were not granted. You can enable them later in Health Connect settings.'
          : 'Permissions were not granted. You can enable them later in Settings › Health.',
      );
      setStep('complete');
    }
  };

  // ── Skip onboarding if health access is already granted ──
  useEffect(() => {
    const check = async () => {
      const alreadyConnected = isAndroid()
        ? await isHealthConnectAvailable()
        : isIOS()
          ? await isAppleHealthAvailable()
          : false;
      if (alreadyConnected) setStep('done');
    };
    check();
  }, []);

  useEffect(() => {
    if (step === 'done') onComplete();
  }, [step, onComplete]);

  if (step === 'done') return null;

  return (
    <View style={styles.container}>
      {/* STEP 0: WELCOME */}
      {step === 'intro' && (
        <View style={styles.card}>
          <Text style={styles.kicker}>KARAWHIUA · GO FOR IT</Text>
          <Text style={styles.title}>Sync your watch</Text>
          <Text style={styles.body}>
            Karawhiua reads your workout minutes from{' '}
            {isAndroid() ? 'Google Health Connect' : 'Apple Health'} and logs them for your House
            automatically.
          </Text>
          <Text style={styles.body}>No manual entry — every session counts.</Text>
          <Pressable
            style={styles.button}
            onPress={isAndroid() ? startAndroidOnboarding : startIOSOnboarding}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={BRAND.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>GET STARTED</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* STEP 1: DOWNLOAD HEALTH CONNECT (Android only) */}
      {step === 'download-app' && (
        <View style={styles.card}>
          <Text style={styles.title}>Install Health Connect</Text>
          <Text style={styles.body}>
            Health Connect is Google&apos;s health data hub. Install it so your watch can share
            workout minutes with Karawhiua.
          </Text>
          <Pressable style={styles.button} onPress={openHealthConnectPlayStore}>
            <Text style={styles.buttonText}>OPEN PLAY STORE</Text>
          </Pressable>
          <Pressable
            style={styles.buttonSecondary}
            onPress={async () => {
              setLoading(true);
              const available = await isHealthConnectAvailable();
              setLoading(false);
              if (available) setStep('request-perms');
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={BRAND.green} size="small" />
            ) : (
              <Text style={styles.buttonSecondaryText}>I&apos;VE INSTALLED IT</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* STEP 2: REQUEST PERMISSIONS */}
      {step === 'request-perms' && (
        <View style={styles.card}>
          <Text style={styles.title}>Allow access</Text>
          <Text style={styles.body}>
            We need permission to read your workout and activity data. Tap below to open the
            permission screen.
          </Text>
          <Text style={styles.hint}>Allow access to Workouts and Activity data.</Text>
          <Pressable style={styles.button} onPress={requestPermissions} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={BRAND.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>ALLOW PERMISSIONS</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* STEP 3: COMPLETE / ERROR */}
      {step === 'complete' && (
        <View style={styles.card}>
          <Text style={styles.title}>{error ? 'Setup complete' : 'All set!'}</Text>
          <Text style={error ? styles.errorText : styles.body}>
            {error ||
              'Your health data is connected. Workout minutes will sync to your House automatically.'}
          </Text>
          <Pressable style={styles.button} onPress={onComplete}>
            <Text style={styles.buttonText}>CONTINUE</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.deep,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    padding: 24,
    gap: 14,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: BRAND.magenta,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.green,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: BRAND.ink,
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: BRAND.muted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: BRAND.error,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: BRAND.green,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: BRAND.white,
    fontWeight: '800',
    letterSpacing: 1,
  },
  buttonSecondary: {
    borderWidth: 2,
    borderColor: BRAND.green,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontSize: 14,
    color: BRAND.green,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
