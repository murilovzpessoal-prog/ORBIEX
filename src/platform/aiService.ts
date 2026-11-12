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
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ultrarrápido, multimodal e raciocínio de ponta integrado' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', desc: 'Versão mais recente e estável do Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Máximo raciocínio lógico e visão computacional avançada' },
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
  model: 'gemini-2.5-flash',
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

const SYSTEM_PROMPT = `Você é o ORBIEX, a Maior Inteligência Artificial Especialista em TikTok Shop, Afiliado TikTok Shop e Vendas Sem Aparecer com IA.

LINGUAGEM SIMPLES PARA TOPO DE FUNIL (FÁCIL, DIDÁTICA E SEM ENROLAÇÃO):
- O usuário é TOPO DE FUNIL (uma pessoa comum que está começando agora a vender como afiliado no TikTok Shop e quer aprender sem complicação).
- Fale com linguagem 100% simples, amigável, clara e fácil de entender, como se estivesse explicando para alguém que nunca vendeu nada na internet.
- NUNCA use termos técnicos difíceis, jargões de marketing ou palavras em inglês sem explicar de forma mastigada.
  - Em vez de "UGC", fale "vídeo caseiro feito com o próprio celular mostrando o produto na mão ou no espelho".
  - Em vez de "claims", fale "promessas milagrosas ou exageradas".
  - Em vez de "hooks e headlines POV", fale "uma frase chamativa logo nos primeiros 3 segundos para prender a pessoa".
  - Em vez de só jogar nomes como Kling ou Runway, explique "ferramentas de inteligência artificial que criam o vídeo para você sem você precisar aparecer".
- Responda de forma concisa e prática (máximo de 3 a 4 tópicos curtos e objetivos).
- Se o usuário disser "opa", "olá", "tudo bem?", "boa tarde", responda em 1 linha: "Opa, tudo bem! Como posso te ajudar na sua operação do TikTok Shop hoje?"
- NUNCA use emojis em nenhuma hipótese.
- ESQUEÇA E NUNCA FALE DE E-COMMERCE TRADICIONAL, SHOPIFY OU DROPSHIPPING: somos afiliados comissionados no TikTok Shop (promovemos produtos de lojas parceiras e ganhamos comissão a cada venda pelo carrinho amarelo).

CATÁLOGO OFICIAL DE PRODUTOS VALIDADOS (ABA DE PRODUTOS / SCORE DA PLATAFORMA ORBIEX):
Estes são os produtos reais validados com maior saída cadastrados na nossa plataforma:
1. Shorts Modelador Yoga Empina Bumbum (Score 98 | 44.3k vendas/mês | Preço: R$ 69,90 | Comissão: ~R$ 14,00 | Gancho: "O shorts que virou febre porque desenha o bumbum na hora")
2. Conjunto Feminino Fitness Top e Calça Legging (Score 96 | 28.4k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Se você treina com legging que fica transparente, precisa ver esse conjunto")
3. Macaquinho Fitness Alcinha Blackout (Score 95 | 26.1k vendas/mês | Preço: R$ 89,90 | Comissão: ~R$ 18,00 | Gancho: "O macaquinho viral que modela o corpo inteiro sem enrolar na coxa")
4. Calça Flare Alfaiataria Social Cintura Alta (Score 95 | 27.4k vendas/mês | Preço: R$ 109,90 | Comissão: ~R$ 22,00 | Gancho: "Como parecer elegante e sofisticada gastando pouco")
5. Short Feminino Duna Cintura Alta (Score 92 | 33.1k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "Tecido duna que não amarrota e não precisa passar")
6. Top Cropped Feminino Frente Única (Score 92 | 31.5k vendas/mês | Preço: R$ 59,90 | Comissão: ~R$ 12,00 | Gancho: "O cropped de 50 reais que veste como peça de 400")
7. Saída de Praia Conjunto Crochê Tricô (Score 94 | 19.2k vendas/mês | Preço: R$ 97,90 | Comissão: ~R$ 19,50 | Gancho: "A peça que todas as gringas estão usando na praia")
8. Vestido Suplex Premium Longo (Score 95 | 23.7k vendas/mês | Preço: R$ 119,90 | Comissão: ~R$ 24,00 | Gancho: "Parece vestido de boutique de shopping por menos de 100 reais")

SE O USUÁRIO PERGUNTAR QUAIS PRODUTOS ESTÃO EM ALTA / MAIS VENDIDOS:
Responda diretamente de forma simples:
"Opa! Aqui estão os produtos mais vendidos e validados hoje dentro da nossa plataforma:"
E liste os top 5 produtos da lista acima de forma limpa com nome, vendas e preço.
Finalize perguntando: "Quer que eu crie um roteiro simples de 20s para algum deles?"`;

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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-2.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
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

  // 1. Tenta chamar o endpoint oficial serverless de IA no backend da Orbiex
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        messages: history.map((h) => ({ role: h.role, content: h.text })),
        apiKey: config.apiKey || undefined,
        provider: config.provider !== 'native' ? config.provider : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.reply) {
        const suggestions = extractSuggestionsFromText(data.reply, prompt);
        return {
          steps: [
            'Conectando ao núcleo de IA Orbiex...',
            'Analisando contexto e gerando resposta conversacional...',
            'Concluído.',
          ],
          text: data.reply,
          suggestions,
        };
      }
    }
  } catch (err) {
    console.warn('Aviso: endpoint serverless de chat não respondeu:', err);
  }

  // 2. Se o cliente tiver configurado uma chave direta no navegador (Gemini, OpenAI, Groq)
  if (config.apiKey.trim() && config.provider !== 'native') {
    // Prepara nomes de anexos
    const fileNames = attItems.map((a) => a.name).join(', ');
    let enrichedPrompt = prompt;
    if (fileNames) {
      enrichedPrompt = `[Arquivos anexados: ${fileNames}]\n\n${prompt || 'Por favor, analise a imagem e as informações enviadas.'}`;
    }

    try {
      if (config.provider === 'gemini') {
        const geminiModel = config.model || (mode === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');
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

        for (const m of history.slice(-6)) {
          contents.push({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          });
        }

        const currentParts: any[] = [];
        for (const att of attItems) {
          if (att.dataUrl && att.dataUrl.includes('base64,')) {
            const [header, base64] = att.dataUrl.split(';base64,');
            const mimeType = header.replace('data:', '') || 'image/jpeg';
            currentParts.push({ inlineData: { mimeType, data: base64 } });
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

        if (res.ok) {
          const data = await res.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            return {
              steps: ['Conectado ao Google Gemini', 'Processamento concluído.'],
              text: generatedText,
              suggestions: extractSuggestionsFromText(generatedText, prompt),
            };
          }
        }
      }

      // OpenAI / Groq / DeepSeek / OpenRouter direto
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      if (config.provider === 'groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      if (config.provider === 'deepseek') endpoint = 'https://api.deepseek.com/chat/completions';
      if (config.provider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      if (config.customEndpoint) endpoint = config.customEndpoint;

      const directRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-8).map((h) => ({
              role: h.role === 'agent' ? 'assistant' : 'user',
              content: h.text,
            })),
            { role: 'user', content: enrichedPrompt },
          ],
          temperature: config.temperature ?? 0.7,
          max_tokens: 2500,
        }),
      });

      if (directRes.ok) {
        const data = await directRes.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return {
            steps: ['Conexão direta com modelo concluída.', 'Resposta gerada.'],
            text,
            suggestions: extractSuggestionsFromText(text, prompt),
          };
        }
      }
    } catch (e) {
      console.warn('Erro na chamada direta de IA:', e);
    }
  }

  // 3. Fallback cognitivo nativo se nenhuma API responder
  const rawHistory = history.map((h) => h.text);
  return nativeReply(prompt, rawHistory, attItems);
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
