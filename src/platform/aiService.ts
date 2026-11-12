import { reply as nativeReply, type Reply, type AttachmentItem } from './agentBrain';

export type AIProvider = 'native' | 'gemini' | 'openai' | 'groq' | 'deepseek' | 'openrouter';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature: number;
  customEndpoint?: string;
}

const STORAGE_KEY = 'orbiex_ai_config';

export const DEFAULT_MODELS: Record<AIProvider, { id: string; name: string; desc: string }[]> = {
  native: [
    { id: 'fast', name: 'Orbiex 1 Neural', desc: 'Motor Cognitivo Nativo (Sem Chave)' },
    { id: 'pro', name: 'Orbiex 1 Pro Reasoning', desc: 'Raciocínio Profundo & Auditoria Completa' },
  ],
  gemini: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Ultrarrápido, suporte multimodal a imagens e gratuito no AI Studio' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Máximo raciocínio lógico e visão computacional avançada' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', desc: 'Nova geração experimental do Google' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Rápido, inteligente com suporte a visão e baixo custo' },
    { id: 'gpt-4o', name: 'GPT-4o', desc: 'O modelo mais avançado e completo da OpenAI' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', desc: 'Extremamente rápido e gratuito' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', desc: 'Velocidade instantânea' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek-V3', desc: 'Alta performance geral e inteligência analítica' },
    { id: 'deepseek-reasoner', name: 'DeepSeek-R1', desc: 'Raciocínio lógico extremo passo a passo' },
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Modelo aberto via OpenRouter' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'Excelente em redação e estratégias' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Acesso rápido via OpenRouter' },
  ],
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'native',
  apiKey: '',
  model: 'gemini-1.5-flash',
  temperature: 0.7,
};

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Falha ao salvar configuração de IA', e);
  }
}

const SYSTEM_PROMPT = `Você é o ORBIEX, o Agente de Inteligência Artificial de E-commerce, TikTok Shop e Escala Operacional.

DIRETRIZES DE COMUNICAÇÃO:
- Seja estritamente profissional, objetivo, direto e resolutivo.
- NUNCA use emojis em suas respostas. Mantenha um tom sóbrio, corporativo e executivo.
- Se o usuário perguntar "oi, tudo bem?", responda de forma direta e educada: "Oi, tudo bem. E com você? Como posso te ajudar hoje?".
- Se o usuário perguntar se um produto é bom, faça uma avaliação técnica e comercial direta: demanda, concorrência, margens recomendadas e veredito prático. Se nenhum produto tiver sido citado, pergunte de forma direta qual produto ele deseja avaliar.
- Se o usuário enviar imagens, analise com rigor técnico: enquadramento vertical 9:16, iluminação, contraste, clareza do produto e pontos de melhoria para conversão.
- Entregue soluções imediatas: cálculos de margem precisos, roteiros de gravação estruturados e estratégias sem enrolação.
- Use formatação limpa em Markdown (títulos ###, tópicos com hífens -, tabelas ou blocos com \`\`\`roteiro).

REGRA MANDATÓRIA PARA HEADLINES E GANCHOS (HOOKS):
- Toda headline para vídeo de TikTok Shop DEVE ser ULTRA-CURTA, personalizada pela peça e formatada com UMA FRASE PEQUENININHA EMBAIXO DA OUTRA, no formato POV:
  Exemplo:
  POV: a regata do momento
  Veste bem demais no corpo.
  Ou:
  POV: a regatinha quase de graça
  Ficou perfeita no espelho.
- NUNCA coloque em uma linha só se puder quebrar; mantenha sempre a primeira frase (POV: ...) na primeira linha e o complemento curtinho na segunda linha.
- NUNCA mencione preço ou valores monetários (sem "R$", sem "R$ 49").
- NUNCA use palavras de vendedor como "compre", "comprar", "comprei", "carrinho", "sacola" ou "loja".
- NUNCA fale "frete grátis".
- A headline DEVE ser 100% natural, orgânica e espontânea (UGC real de quem grava no espelho sem vender).
- Use os gatilhos mentais virais adaptados à peça informada: "[peça] do momento", "[peça] quase de graça", "[peça] queridinha das blogueiras", "parece de shopping chique", "zero transparência no sol".
- Sempre explique de forma profissional o gatilho mental e o ponto que pega em cada headline.`;

/** Testa a conexão com a API selecionada */
export async function testAIConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  if (config.provider === 'native') {
    return { success: true, message: 'Motor Cognitivo Orbiex Ativo e 100% Funcional!' };
  }

  if (!config.apiKey.trim()) {
    return { success: false, message: 'Chave de API não informada.' };
  }

  try {
    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Responda apenas: OK' }] }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro HTTP ${res.status}`);
      }
      return { success: true, message: 'Conexão com Google Gemini realizada com sucesso!' };
    }

    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    if (config.provider === 'deepseek') endpoint = 'https://api.deepseek.com/chat/completions';
    if (config.provider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    if (config.customEndpoint) endpoint = config.customEndpoint;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Responda apenas: OK' }],
        max_tokens: 10,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro HTTP ${res.status}`);
    }

    return { success: true, message: `Conexão com ${config.provider.toUpperCase()} realizada com sucesso!` };
  } catch (error: any) {
    return { success: false, message: `Falha na conexão: ${error.message || 'Erro desconhecido'}` };
  }
}

/** Executa a geração com a API configurada ou recorre ao motor nativo */
export async function generateAIReply(
  prompt: string,
  history: Array<{ role: 'user' | 'agent'; text: string }>,
  mode: 'fast' | 'pro' = 'fast',
  attachments?: AttachmentItem[] | string[],
): Promise<Reply> {
  const config = getAIConfig();
  const attItems: AttachmentItem[] = (attachments ?? []).map((a) =>
    typeof a === 'string' ? { name: a } : a
  );

  // Se for nativo ou sem chave de API, usa o cérebro cognitivo local Orbiex
  if (config.provider === 'native' || !config.apiKey.trim()) {
    const rawHistory = history.map((h) => h.text);
    return nativeReply(prompt, rawHistory, attItems);
  }

  // Prepara nomes de anexos
  const fileNames = attItems.map((a) => a.name).join(', ');
  let enrichedPrompt = prompt;
  if (fileNames) {
    enrichedPrompt = `[Arquivos anexados: ${fileNames}]\n\n${prompt || 'Por favor, analise a imagem e as informações enviadas.'}`;
  }

  try {
    if (config.provider === 'gemini') {
      const geminiModel = config.model || (mode === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${config.apiKey.trim()}`;

      const contents: any[] = [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nPor favor, responda com atenção e profundidade como o Orbiex AI.` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido! Sou o Orbiex AI e estou pronto para conversar, analisar imagens e resolver qualquer dúvida da sua operação.' }],
        },
      ];

      // Histórico recente
      for (const m of history.slice(-6)) {
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        });
      }

      // Monta as partes da mensagem atual (incluindo imagens base64 reais para o Gemini!)
      const currentParts: any[] = [];

      for (const att of attItems) {
        if (att.dataUrl && att.dataUrl.includes('base64,')) {
          const [header, base64] = att.dataUrl.split(';base64,');
          const mimeType = header.replace('data:', '') || 'image/jpeg';
          currentParts.push({
            inlineData: {
              mimeType,
              data: base64,
            },
          });
        }
      }

      currentParts.push({ text: enrichedPrompt });
      contents.push({ role: 'user', parts: currentParts });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config.temperature ?? (mode === 'pro' ? 0.6 : 0.7),
            maxOutputTokens: 2500,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro da API Gemini: HTTP ${res.status}`);
      }

      const data = await res.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('Nenhum texto retornado pela API Gemini.');
      }

      const suggestions = extractSuggestionsFromText(generatedText, prompt);

      return {
        steps: [
          'Conectando ao modelo neural multimodal Google Gemini',
          'Processando texto e elementos visuais da imagem',
          'Formatando resposta especializada Orbiex',
        ],
        text: generatedText,
        suggestions,
      };
    }

    // OpenAI, Groq, DeepSeek, OpenRouter
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    if (config.provider === 'deepseek') endpoint = 'https://api.deepseek.com/chat/completions';
    if (config.provider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    if (config.customEndpoint) endpoint = config.customEndpoint;

    // Se houver imagens em base64 e for OpenAI / OpenRouter
    let userContent: any = enrichedPrompt;
    const hasImageAttachments = attItems.some((a) => a.dataUrl && a.dataUrl.startsWith('data:image/'));

    if (hasImageAttachments && (config.provider === 'openai' || config.provider === 'openrouter')) {
      userContent = [{ type: 'text', text: enrichedPrompt }];
      for (const att of attItems) {
        if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
          userContent.push({
            type: 'image_url',
            image_url: { url: att.dataUrl },
          });
        }
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userContent },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature ?? (mode === 'pro' ? 0.5 : 0.7),
        max_tokens: 2500,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro da API ${config.provider.toUpperCase()}: HTTP ${res.status}`);
    }

    const data = await res.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error(`Nenhum texto retornado por ${config.provider}.`);
    }

    const suggestions = extractSuggestionsFromText(generatedText, prompt);

    return {
      steps: [
        `Conectando ao cluster ${config.provider.toUpperCase()}`,
        'Processando contexto da conversa e diretrizes de e-commerce',
        'Sintetizando resposta resolutiva Orbiex',
      ],
      text: generatedText,
      suggestions,
    };
  } catch (error: any) {
    console.warn('Recorrendo ao motor cognitivo nativo Orbiex:', error);
    const fallback = nativeReply(prompt, history.map((h) => h.text), attItems);
    return {
      ...fallback,
      steps: [
        `Tentativa via ${config.provider.toUpperCase()} (${error.message?.slice(0, 30) || 'fallback'})`,
        'Ativando Motor Cognitivo Local Orbiex',
        ...fallback.steps,
      ],
    };
  }
}

function extractSuggestionsFromText(text: string, prompt: string): string[] {
  const suggestions: string[] = [];
  const lower = (text + ' ' + prompt).toLowerCase();

  if (lower.includes('imagem') || lower.includes('foto')) {
    suggestions.push('Crie um roteiro de 30s baseado nessa imagem', 'Quais os melhores hooks para esse produto?');
  } else if (lower.includes('roteiro') || lower.includes('vídeo') || lower.includes('video')) {
    suggestions.push('Crie 5 hooks virais para este produto', 'Como gravar sem mostrar o rosto?');
  } else if (lower.includes('produto') || lower.includes('preço') || lower.includes('margem')) {
    suggestions.push('Gere um roteiro de 30s para validar no TikTok Shop', 'Escaneie os concorrentes desse nicho');
  } else {
    suggestions.push('Esse produto é bom para vender no TikTok Shop?', 'Quais produtos estão em alta hoje?');
  }

  return suggestions.slice(0, 3);
}
