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
