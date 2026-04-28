// ═══════════════════════════════════════════════════════════════════
// VAANI Settings Store — Zustand + SecureStore
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AppSettings, VisualMode } from '../types';

const SETTINGS_KEY = 'vaani_settings';

const DEFAULT_SETTINGS: AppSettings = {
  visual_mode: 'normal',
  language: 'hi',
  haptic_enabled: true,
  slow_speech: false,
  continuous_listening: false,
  wake_word_enabled: false,
  notifications_enabled: true,
  auto_read_responses: true,
  large_text_scale: 1.0,
  onboarding_completed: false,
};

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<AppSettings>) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  setVisualMode: (mode: VisualMode) => Promise<void>;
  toggleHaptic: () => Promise<void>;
  toggleSlowSpeech: () => Promise<void>;
  toggleContinuousListening: () => Promise<void>;
  toggleAutoRead: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ ...DEFAULT_SETTINGS, ...saved, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  update: async (partial) => {
    const current = get();
    const updated = { ...current, ...partial };
    set(partial);
    try {
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify({
        visual_mode: updated.visual_mode,
        language: updated.language,
        haptic_enabled: updated.haptic_enabled,
        slow_speech: updated.slow_speech,
        continuous_listening: updated.continuous_listening,
        wake_word_enabled: updated.wake_word_enabled,
        notifications_enabled: updated.notifications_enabled,
        auto_read_responses: updated.auto_read_responses,
        large_text_scale: updated.large_text_scale,
        onboarding_completed: updated.onboarding_completed,
      }));
    } catch (e) {
      console.error('[Settings] Save failed:', e);
    }
  },

  setLanguage: async (lang) => get().update({ language: lang }),
  setVisualMode: async (mode) => {
    const scale = mode === 'large_text' ? 1.4 : 1.0;
    get().update({ visual_mode: mode, large_text_scale: scale });
  },
  toggleHaptic: async () => get().update({ haptic_enabled: !get().haptic_enabled }),
  toggleSlowSpeech: async () => get().update({ slow_speech: !get().slow_speech }),
  toggleContinuousListening: async () => get().update({ continuous_listening: !get().continuous_listening }),
  toggleAutoRead: async () => get().update({ auto_read_responses: !get().auto_read_responses }),
  completeOnboarding: async () => get().update({ onboarding_completed: true }),
  reset: async () => {
    set(DEFAULT_SETTINGS);
    await SecureStore.deleteItemAsync(SETTINGS_KEY);
  },
}));
