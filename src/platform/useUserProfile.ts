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
          if (!parsed.avatarUrl) {
            const e = localStorage.getItem('orbiex_user_email') || localStorage.getItem('orbix_user_email');
            const backup = e ? localStorage.getItem(`orbiex_avatar_${e.trim().toLowerCase()}`) : null;
            if (backup) parsed.avatarUrl = backup;
          }
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

function getUserEmail(): string | null {
  try {
    const e = localStorage.getItem('orbiex_user_email') || localStorage.getItem('orbix_user_email');
    return e ? e.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export function saveUserProfile(updated: UserProfile, syncRemote = true) {
  const serialized = JSON.stringify(updated);
  for (const key of STORAGE_KEYS) {
    try {
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('Falha ao salvar perfil localmente:', err);
    }
  }

  // Backup da foto vinculada ao e-mail (sobrevive a logout/login)
  const email = getUserEmail();
  if (email) {
    try {
      if (updated.avatarUrl) {
        localStorage.setItem(`orbiex_avatar_${email}`, updated.avatarUrl);
      } else {
        localStorage.removeItem(`orbiex_avatar_${email}`);
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    // Dispara evento customizado para sincronização reativa imediata na mesma aba
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: updated }));

    // Sincroniza em nuvem no Supabase em segundo plano
    if (email && syncRemote) {
      try {
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
      } catch {}
    }
  }
}

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile>(getStoredProfile);

  useEffect(() => {
    // 1. Sincronização em nuvem ao montar (a versão local sempre tem prioridade)
    const email = getUserEmail();
    if (email) {
      supabase
        .from('profiles')
        .select('*')
        .ilike('user_email', email)
        .limit(1)
        .then(({ data, error }) => {
          if (!error && data && data[0]) {
            const remote = data[0];
            const local = getStoredProfile();
            const merged: UserProfile = {
              name: local.name && local.name !== 'Membro Orbiex' ? local.name : remote.name || local.name,
              avatarUrl: local.avatarUrl || remote.avatar_url || null,
            };
            if (merged.name !== local.name || merged.avatarUrl !== local.avatarUrl) {
              setProfileState(merged);
              saveUserProfile(merged, false);
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
