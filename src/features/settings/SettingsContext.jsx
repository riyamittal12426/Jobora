import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ACCENT_COLORS = {
  purple: { name: 'Purple', hue: 270, primary: '#a855f7', glow: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', tw: 'violet' },
  blue:   { name: 'Blue',   hue: 220, primary: '#3b82f6', glow: 'rgba(59,130,246,0.25)',  bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  tw: 'blue' },
  emerald:{ name: 'Emerald',hue: 155, primary: '#10b981', glow: 'rgba(16,185,129,0.25)',  bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  tw: 'emerald' },
  orange: { name: 'Orange', hue: 25,  primary: '#f97316', glow: 'rgba(249,115,22,0.25)',  bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  tw: 'orange' },
  rose:   { name: 'Rose',   hue: 350, primary: '#f43f5e', glow: 'rgba(244,63,94,0.25)',   bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   tw: 'rose' },
};

const STORAGE_KEY = 'jobora-settings';

const defaultSettings = {
  themeMode: 'dark',
  accentColor: 'purple',
  notifications: {
    email: true,
    interviewReminders: true,
    applicationUpdates: true,
    aiSuggestions: true,
    marketingEmails: false,
  },
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed, notifications: { ...defaultSettings.notifications, ...parsed.notifications } };
      }
    } catch (e) { /* ignore */ }
    return defaultSettings;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply theme mode to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }
  }, [settings.themeMode]);

  // Apply accent color CSS custom properties
  useEffect(() => {
    const accent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.purple;
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', accent.primary);
    root.style.setProperty('--accent-glow', accent.glow);
    root.style.setProperty('--accent-bg', accent.bg);
    root.style.setProperty('--accent-border', accent.border);
    root.style.setProperty('--accent-hue', accent.hue);
  }, [settings.accentColor]);

  const toggleTheme = useCallback(() => {
    setSettings(prev => ({ ...prev, themeMode: prev.themeMode === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setAccentColor = useCallback((color) => {
    if (ACCENT_COLORS[color]) {
      setSettings(prev => ({ ...prev, accentColor: color }));
    }
  }, []);

  const setThemeMode = useCallback((mode) => {
    setSettings(prev => ({ ...prev, themeMode: mode }));
  }, []);

  const updateNotification = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  }, []);

  const value = {
    settings,
    setSettings,
    toggleTheme,
    setThemeMode,
    setAccentColor,
    updateNotification,
    accentColors: ACCENT_COLORS,
    currentAccent: ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.purple,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

export { ACCENT_COLORS };
export default SettingsContext;
