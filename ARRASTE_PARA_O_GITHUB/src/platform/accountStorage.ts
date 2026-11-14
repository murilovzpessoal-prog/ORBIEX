/**
 * Isolamento de dados por conta.
 *
 * Todos os dados do usuário (metas, gráficos, checklist, aulas concluídas, chats,
 * produtos, favoritos, sessões etc.) ficam no localStorage do navegador.
 * Este módulo garante que cada conta (e-mail) tenha seus próprios dados:
 * - Ao entrar com uma conta diferente, os dados da conta anterior são guardados
 *   em um snapshot e a nova conta começa 100% zerada (ou recupera os dados dela).
 */

const LAST_ACCOUNT_KEY = 'orbiex_last_account';
const SNAPSHOT_PREFIX = 'orbiex_account_snapshot_';

// Chaves globais de sessão/conteúdo que NÃO pertencem aos dados do usuário
const EXCLUDED_KEYS = new Set([
  'orbiex_auth',
  'orbix_auth',
  'orbiex_user_email',
  'orbix_user_email',
  'orbiex_logged_out',
  'projeto_member_authenticated',
  LAST_ACCOUNT_KEY,
  'orbiex_custom_lesson_videos',
  'orbiex_ai_config',
]);

const EXCLUDED_PREFIXES = [
  SNAPSHOT_PREFIX,
  'orbiex_avatar_', // já vinculado por e-mail
  'orbiex_refund_request_v2_', // já vinculado por e-mail
];

const USER_DATA_PREFIXES = ['orbiex', 'orbix', 'projeto_'];

function isUserDataKey(key: string): boolean {
  if (EXCLUDED_KEYS.has(key)) return false;
  if (EXCLUDED_PREFIXES.some((p) => key.startsWith(p))) return false;
  return USER_DATA_PREFIXES.some((p) => key.startsWith(p));
}

function listUserDataKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isUserDataKey(k)) keys.push(k);
  }
  return keys;
}

function normalize(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Troca o contexto de dados para a conta informada.
 * Deve ser chamado no login ANTES de gravar o e-mail/perfil da nova conta.
 */
export function switchAccountData(nextEmailRaw: string) {
  try {
    const nextEmail = normalize(nextEmailRaw);
    if (!nextEmail) return;

    const previous =
      normalize(localStorage.getItem(LAST_ACCOUNT_KEY)) ||
      normalize(localStorage.getItem('orbiex_user_email')) ||
      normalize(localStorage.getItem('orbix_user_email'));

    if (previous === nextEmail) {
      localStorage.setItem(LAST_ACCOUNT_KEY, nextEmail);
      return;
    }

    const keys = listUserDataKeys();

    // 1. Guarda os dados da conta anterior
    if (previous) {
      const snapshot: Record<string, string> = {};
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v !== null) snapshot[k] = v;
      }
      try {
        localStorage.setItem(SNAPSHOT_PREFIX + previous, JSON.stringify(snapshot));
      } catch (err) {
        console.warn('Não foi possível guardar os dados da conta anterior:', err);
      }
    }

    // 2. Zera todos os dados do usuário no navegador
    for (const k of keys) localStorage.removeItem(k);

    // 3. Restaura os dados da nova conta (se ela já usou este navegador antes)
    const savedRaw = localStorage.getItem(SNAPSHOT_PREFIX + nextEmail);
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw) as Record<string, string>;
        for (const [k, v] of Object.entries(saved)) {
          if (isUserDataKey(k)) localStorage.setItem(k, v);
        }
      } catch {}
    }

    localStorage.setItem(LAST_ACCOUNT_KEY, nextEmail);
  } catch (err) {
    console.warn('Falha ao alternar dados da conta:', err);
  }
}

/** Registra a conta atual (para sessões já logadas antes desta atualização). */
export function ensureAccountTracked() {
  try {
    if (localStorage.getItem(LAST_ACCOUNT_KEY)) return;
    const current = normalize(localStorage.getItem('orbiex_user_email') || localStorage.getItem('orbix_user_email'));
    if (current) localStorage.setItem(LAST_ACCOUNT_KEY, current);
  } catch {}
}
