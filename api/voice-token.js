/**
 * Orbiex Voice — emite token efêmero (uso único, 30 min) para a Gemini Live API.
 * A chave real nunca é exposta ao navegador.
 */
const ACTIVE_GEMINI_KEY = Buffer.from(
  'QVEuQWI4Uk42S0JKUzU4emtnQ2ctQURUZDV4cHNyUFpyVkZzQ2YzRElvbWRPeEJ1T2dySmc=',
  'base64'
).toString('utf8');

const LIVE_MODELS = ['gemini-3.8-live', 'gemini-3.1-flash-live-preview', 'gemini-2.5-flash-native-audio-latest'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const key = ACTIVE_GEMINI_KEY || process.env.GEMINI_API_KEY;
    const now = Date.now();
    const r = await fetch(`https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.name) {
      return res.status(502).json({ error: 'Falha ao criar sessão de voz', detail: data?.error?.message });
    }
    return res.status(200).json({ token: data.name, models: LIVE_MODELS });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
