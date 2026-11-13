import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from './ProfileSettingsModal';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEYS = ['orbiex_user_profile', 'orbix_user_profile'];
const PROFILE_EVENT = 'orbiex:profile_updated';

export function getStoredProfile(): UserProfile {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.name === 'string') {
          return parsed;
        }
      }
    }
  } catch {}
  return { name: 'Membro Orbiex', avatarUrl: null };
}

export function formatUserGreetingName(fullName?: string): string {
  if (!fullName) return 'Membro';
  const trimmed = fullName.trim();
  if (!trimmed) return 'Membro';
  const first = trimmed.split(/\s+/)[0];
  // If first word is all lowercase, capitalize first letter
  if (first.toLowerCase() === first && first.length > 0) {
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return first;
}

export function getUserDisplayName(): string {
  const p = getStoredProfile();
  return formatUserGreetingName(p.name);
}

export function saveUserProfile(updated: UserProfile) {
  try {
    const serialized = JSON.stringify(updated);
    for (const key of STORAGE_KEYS) {
      localStorage.setItem(key, serialized);
    }
    // Dispara evento customizado para sincronização reativa imediata na mesma aba
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: updated }));
      
      // Sincroniza em nuvem no Supabase em segundo plano
      const email = localStorage.getItem('orbiex_user_email') || localStorage.getItem('orbix_user_email');
      if (email) {
        supabase
          .from('profiles')
          .upsert(
            {
              user_email: email.trim().toLowerCase(),
              name: updated.name,
              avatar_url: updated.avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_email' }
          )
          .then(({ error }) => {
            if (error) console.warn('Supabase sync notice:', error.message);
          });
      }
    }
  } catch {}
}

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile>(getStoredProfile);

  useEffect(() => {
    // 1. Sincronização em nuvem ao montar
    const email = localStorage.getItem('orbiex_user_email') || localStorage.getItem('orbix_user_email');
    if (email) {
      supabase
        .from('profiles')
        .select('*')
        .ilike('user_email', email.trim().toLowerCase())
        .limit(1)
        .then(({ data, error }) => {
          if (!error && data && data[0]) {
            const remote = data[0];
            const local = getStoredProfile();
            if (remote.avatar_url || remote.name) {
              const merged: UserProfile = {
                name: remote.name || local.name,
                avatarUrl: remote.avatar_url || local.avatarUrl,
              };
              setProfileState(merged);
              saveUserProfile(merged);
            }
          }
        });
    }

    // 2. Sincronização em tempo real na mesma aba
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<UserProfile>).detail;
      if (detail && typeof detail.name === 'string') {
        setProfileState(detail);
      } else {
        setProfileState(getStoredProfile());
      }
    };

    // 3. Sincronização entre múltiplas abas via storage event
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && STORAGE_KEYS.includes(e.key)) {
        setProfileState(getStoredProfile());
      }
    };

    window.addEventListener(PROFILE_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(PROFILE_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const saveProfile = useCallback((updated: UserProfile) => {
    setProfileState(updated);
    saveUserProfile(updated);
  }, []);

  const displayName = formatUserGreetingName(profile.name);

  return {
    profile,
    displayName,
    saveProfile,
  };
}
