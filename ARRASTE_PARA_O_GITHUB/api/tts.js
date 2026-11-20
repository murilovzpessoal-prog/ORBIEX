/**
 * Orbiex Voice — Text-to-Speech (Gemini TTS)
 * Voz grave, calma e sofisticada estilo "assistente de IA de filme" (inspirada no Jarvis).
 * POST { text: string, voice?: string } -> audio/wav (binário)
 */

const ACTIVE_GEMINI_KEY = Buffer.from(
  'QVEuQWI4Uk42S0JKUzU4emtnQ2ctQURUZDV4cHNyUFpyVkZzQ2YzRElvbWRPeEJ1T2dySmc=',
  'base64'
).toString('utf8');

const TTS_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-2.5-flash-preview-tts',
  'gemini-3.1-flash-tts-preview',
];

const VOICE_DIRECTION =
  'Leia o texto a seguir em português do Brasil com voz masculina grave, calma, elegante e muito confiante, ' +
  'no estilo de um assistente de inteligência artificial sofisticado de filme de ficção científica: ' +
  'dicção impecável, ritmo controlado, tom levemente formal e cordial, com leve sorriso na voz. Texto: ';

function pcmToWav(pcm, sampleRate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bits) / 8;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text = '', voice = 'Charon' } = req.body || {};
    const clean = String(text).trim().slice(0, 1200);
    if (!clean) return res.status(400).json({ error: 'Texto vazio' });

    const key = ACTIVE_GEMINI_KEY || process.env.GEMINI_API_KEY;

    for (const model of TTS_MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: VOICE_DIRECTION + clean }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
              },
            }),
          }
        );

        if (!r.ok) {
          console.warn(`TTS ${model} status ${r.status}`);
          continue;
        }

        const data = await r.json();
        const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
        if (!inline?.data) continue;

        const raw = Buffer.from(inline.data, 'base64');
        const mime = (inline.mimeType || '').toLowerCase();
        let wav = raw;
        if (!mime.includes('wav')) {
          const rateMatch = mime.match(/rate=(\d+)/);
          wav = pcmToWav(raw, rateMatch ? parseInt(rateMatch[1], 10) : 24000);
        }

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Orbiex-Voice-Model', model);
        return res.status(200).send(wav);
      } catch (err) {
        console.warn(`TTS ${model} error:`, err.message);
      }
    }

    return res.status(503).json({ error: 'TTS indisponível' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
