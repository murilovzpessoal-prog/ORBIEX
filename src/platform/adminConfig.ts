import { supabase } from '../lib/supabaseClient';

export const ADMIN_EMAIL = 'adm@gmail.com';
export const ADMIN_DEFAULT_NAME = 'Administrador Orbiex';
export const ADMIN_STORAGE_AUTH_KEY = 'orbiex_adm_session_key';

export function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

export function isAdminEmail(email?: string | null): boolean {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export function getLoggedUserEmail(): string {
  try {
    return normalizeEmail(
      localStorage.getItem('orbiex_user_email') ||
        localStorage.getItem('orbix_user_email') ||
        localStorage.getItem('orbiex_last_account')
    );
  } catch {
    return '';
  }
}

export function isCurrentUserAdmin(): boolean {
  return isAdminEmail(getLoggedUserEmail());
}

/** Constrói cabeçalhos de autenticação ADM para chamadas de API protegidas. */
export async function buildAdminHeaders(): Promise<Record<string, string>> {
  const adminEmail = getLoggedUserEmail();
  let adminSecret = '';
  try {
    adminSecret = localStorage.getItem(`orbiex_user_pwd_${adminEmail}`) || '';
  } catch {
    adminSecret = '';
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-orbiex-admin-email': adminEmail,
    'x-orbiex-admin-secret': adminSecret,
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    /* ignore */
  }
  return headers;
}
