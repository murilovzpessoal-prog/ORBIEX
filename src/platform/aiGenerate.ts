/**
 * Cliente do gerador Orbiex com memória anti-repetição.
 * Cada `memoryKey` guarda os últimos resultados entregues (por produto/ferramenta)
 * e envia como lista "NÃO REPITA" na próxima geração.
 */

export interface AIGenerateOptions {
  /** Identificador da ferramenta + item, ex: `hooks:shorts modelador` */
  memoryKey: string;
  task: string;
  input: unknown;
  format: string;
  imageDataUrl?: string;
  /** Extrai do resultado os textos que não podem se repetir na próxima vez */
  remember?: (data: any) => string[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  timeoutMs?: number;
}

const MEMORY_PREFIX = 'orbiex_gen_memory_v1:';
const MAX_MEMORY = 40;

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

export function getGenMemory(memoryKey: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_PREFIX + norm(memoryKey)) || '[]');
  } catch {
    return [];
  }
}

export function addGenMemory(memoryKey: string, items: string[]) {
  try {
    const merged = [...getGenMemory(memoryKey), ...items.filter(Boolean).map((s) => String(s).slice(0, 220))];
    localStorage.setItem(MEMORY_PREFIX + norm(memoryKey), JSON.stringify(merged.slice(-MAX_MEMORY)));
  } catch {
    /* storage cheio */
  }
}

/** Gera JSON personalizado via IA. Retorna null se a IA estiver indisponível. */
export async function aiGenerateJSON<T = any>(opts: AIGenerateOptions): Promise<T | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
  try {
    const res = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: opts.task,
        input: opts.input,
        format: opts.format,
        avoid: getGenMemory(opts.memoryKey),
        imageDataUrl: opts.imageDataUrl,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success || !json.data) return null;
    if (opts.remember) {
      try {
        addGenMemory(opts.memoryKey, opts.remember(json.data));
      } catch {
        /* ignora */
      }
    }
    return json.data as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/* ───── utilitários para fallbacks locais nunca ficarem iguais ───── */

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Variação numérica coerente: valor ± spread, limitado entre min e max */
export function jitter(value: number, spread: number, min = 0, max = 100): number {
  const v = value + (Math.random() * 2 - 1) * spread;
  return Math.max(min, Math.min(max, Math.round(v)));
}
