/** Deterministic mock helpers shared by the Analyzer views and the chat agent.
 *  Replace with real API calls when a backend is connected. */

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function analyze(input: string, metrics: string[]) {
  const base = hash(input.toLowerCase().trim());
  const values = metrics.map((m) => 48 + (hash(m + base) % 50));
  const score = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { values, score };
}

export function verdictLabel(score: number) {
  if (score >= 85) return 'Excelente';
  if (score >= 72) return 'Promissor';
  if (score >= 60) return 'Moderado';
  return 'Arriscado';
}
