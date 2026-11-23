import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Maximize2, Mic, MicOff, Minimize2, Sparkles, X } from 'lucide-react';
import type { ViewId } from '../data';
import {
  copilotFocusOrbiex,
  copilotInteractPage,
  copilotOpenTab,
  copilotSmartAction,
  isCopilotInstalled,
  pingCopilot,
} from '../copilotBridge';
import { describeOrbiexScreen, orbiexSmartAction, scrollOrbiex } from '../orbiexPageAgent';
import { openCopilotInstallModal } from '../PermissionsOnboardingModal';

/* ───────────────────────────────────────────────────────────────
   ORBIEX VOICE — Conversa por voz em TEMPO REAL (Gemini Live API)
   Microfone (PCM 16 kHz) ⇄ WebSocket ⇄ voz nativa (PCM 24 kHz)
   - O modelo ouve o áudio direto (sem transcrever antes) e responde
     falando em streaming → começa a falar em ~1 s.
   - Interrupção natural: basta falar por cima (VAD do servidor).
   - Token efêmero via /api/voice-token (a chave nunca vai ao navegador).
   ─────────────────────────────────────────────────────────────── */

type Phase = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error';

interface Turn {
  role: 'user' | 'agent';
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  history: Turn[];
  onTurn: (userText: string, agentText: string) => void;
  onNavigate?: (view: ViewId) => void;
  userName?: string;
  /** Aba atual da Orbiex (a voz é global e acompanha a navegação) */
  currentView?: string;
}

interface ActionBannerState {
  label: string;
  url?: string;
  openedAuto: boolean;
}

const VOICE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'open_destination',
        description:
          'Abre imediatamente no computador/navegador do usuário qualquer site, ferramenta externa (Google Flow, TikTok, TikTok Shop, Seller Center, TikTok Studio, Kling AI, Midjourney, Hailuo, CapCut, Canva, YouTube, Google, Instagram, WhatsApp, Shopee, Mercado Livre, etc.) ou aba interna da plataforma Orbiex quando o usuário pedir para abrir ou acessar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            target: {
              type: 'STRING',
              description:
                'Identificador do destino pedido: flow, tiktok, tiktok_shop, tiktok_studio, kling, midjourney, hailuo, luma, runway, capcut, canva, elevenlabs, chatgpt, youtube, instagram, whatsapp, gmail, google, shopee, mercadolivre, amazon, cakto, ou abas internas da Orbiex: home, agent, journey, products, product_score, store_score, scanner, hooks, headlines, prompt_gen, prompts, motion, turbo, antirestriction, members, support.',
            },
            customUrl: {
              type: 'STRING',
              description:
                'URL https completa caso o usuário peça um site que não esteja listado nos identificadores padrão (ex: https://sitepedido.com).',
            },
            searchQuery: {
              type: 'STRING',
              description:
                'Termo de pesquisa opcional caso o usuário peça para abrir pesquisando algo (ex: abrir o TikTok pesquisando vestido midi).',
            },
          },
          required: ['target'],
        },
      },
      {
        name: 'click_element_on_page',
        description:
          'Enxerga a tela e clica em qualquer botão, ícone, card, aba, chat ou link — TANTO dentro da própria plataforma Orbiex (ex.: "Gerar Headlines", "Analisar Produto", botão de um produto, aba do menu lateral) QUANTO no site externo aberto (Google Flow, Kling, TikTok). O usuário pode descrever pelo nome, pela função ("o botão de gerar", "o primeiro produto") ou pela posição ("o chat do canto inferior direito").',
        parameters: {
          type: 'OBJECT',
          properties: {
            buttonText: {
              type: 'STRING',
              description:
                'Nome, texto ou descrição visual/funcional do que clicar (ex.: "Gerar Headlines", "chat", "primeiro produto", "botão de enviar", "Criar novo projeto").',
            },
            spatialHint: {
              type: 'STRING',
              description:
                'Posição citada pelo usuário, se houver (ex.: "canto inferior direito", "topo direito", "menu lateral esquerdo", "centro", "embaixo").',
            },
            userInstruction: {
              type: 'STRING',
              description: 'Pedido completo do usuário com contexto (ex.: "Clicar no chat do canto inferior direito").',
            },
            surface: {
              type: 'STRING',
              description:
                '"orbiex" se o elemento está na própria plataforma Orbiex; "site_aberto" se está no site externo aberto (Flow, TikTok...); "auto" se não tiver certeza (o sistema detecta pela aba que o usuário está olhando).',
            },
          },
          required: ['buttonText'],
        },
      },
      {
        name: 'type_text_on_page',
        description:
          'Enxerga a tela, localiza o campo ou chat indicado (inclusive pela posição, ex.: "o chat da direita embaixo") e digita o texto pedido — na própria Orbiex (campo de produto, headline, chat do Agente, suporte) ou no site externo aberto. Pode enviar em seguida.',
        parameters: {
          type: 'OBJECT',
          properties: {
            text: {
              type: 'STRING',
              description: 'Texto exato a digitar.',
            },
            fieldHint: {
              type: 'STRING',
              description: 'Qual campo (ex.: "chat", "nome do produto", "link da loja", "caixa de prompt", "pesquisa").',
            },
            spatialHint: {
              type: 'STRING',
              description: 'Posição citada pelo usuário (ex.: "canto inferior direito", "centro", "topo"). Preencha SEMPRE que ele citar posição.',
            },
            userInstruction: {
              type: 'STRING',
              description: 'Pedido completo do usuário com contexto e posição.',
            },
            pressEnterAfter: {
              type: 'BOOLEAN',
              description: 'true SOMENTE se o usuário pediu para enviar / dar enter após escrever.',
            },
            clickButtonAfter: {
              type: 'STRING',
              description: 'Botão para clicar logo após preencher, se o usuário pediu (ex.: "Gerar", "Analisar").',
            },
            surface: {
              type: 'STRING',
              description: '"orbiex", "site_aberto" ou "auto".',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'copy_from_page',
        description:
          'Copia para a área de transferência um conteúdo da tela (headline, hook, prompt, roteiro, resposta do agente, script de amostra, link de produto). Usa o botão "Copiar" do card quando existir ou copia o texto do bloco indicado. Ex.: "copia a segunda headline", "copia o script de amostra", "copia a última resposta".',
        parameters: {
          type: 'OBJECT',
          properties: {
            whatToCopy: {
              type: 'STRING',
              description: 'O que copiar (ex.: "segunda headline", "script de amostra grátis", "prompt gerado", "última resposta").',
            },
            spatialHint: {
              type: 'STRING',
              description: 'Posição citada, se houver.',
            },
            userInstruction: {
              type: 'STRING',
              description: 'Pedido completo do usuário.',
            },
            surface: {
              type: 'STRING',
              description: '"orbiex", "site_aberto" ou "auto".',
            },
          },
          required: ['whatToCopy'],
        },
      },
      {
        name: 'scroll_or_control_page',
        description:
          'Rola a tela para cima/baixo, lê o que está visível na tela atual (botões, campos, cards) ou traz o foco de volta para a aba da Orbiex. Funciona na Orbiex e no site externo.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              description: '"scroll" para rolar, "scan" para ler o que está na tela agora, ou "focus_orbiex" para voltar à aba da Orbiex.',
            },
            direction: {
              type: 'STRING',
              description: 'Direção da rolagem quando action="scroll": "down", "up", "top" ou "bottom".',
            },
            surface: {
              type: 'STRING',
              description: '"orbiex", "site_aberto" ou "auto".',
            },
          },
          required: ['action'],
        },
      },
    ],
  },
];

function resolveVoiceDestination(
  rawTarget: string,
  customUrl?: string,
  searchQuery?: string
): { kind: 'internal'; viewId: ViewId; label: string } | { kind: 'external'; url: string; label: string } {
  const t = String(rawTarget || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const q = String(searchQuery || '').trim();

  // 1. Abas internas da Orbiex
  if (t === 'agent' || t === 'agente' || t.includes('agente orbiex') || t === 'chat') {
    return { kind: 'internal', viewId: 'agent', label: 'Agente Orbiex' };
  }
  if (t === 'home' || t === 'inicio' || t === 'dashboard') {
    return { kind: 'internal', viewId: 'home', label: 'Início da Orbiex' };
  }
  if (t.includes('journey') || t.includes('jornada') || t.includes('meta')) {
    return { kind: 'internal', viewId: 'journey', label: 'Minha Jornada' };
  }
  if (t === 'products' || t === 'catalogo' || t === 'produtos' || t.includes('campeoes')) {
    return { kind: 'internal', viewId: 'products', label: 'Produtos Campeões' };
  }
  if (t.includes('product_score') || t === 'product' || t.includes('score produto')) {
    return { kind: 'internal', viewId: 'product', label: 'Score Produto' };
  }
  if (t.includes('store_score') || t === 'store' || t.includes('score lojista') || t.includes('lojista')) {
    return { kind: 'internal', viewId: 'store', label: 'Score Lojista' };
  }
  if (t.includes('scanner')) {
    return { kind: 'internal', viewId: 'scanner', label: 'Scanner de Perfis' };
  }
  if (t.includes('hook')) {
    return { kind: 'internal', viewId: 'hooks', label: 'Hooks Virais' };
  }
  if (t.includes('headline')) {
    return { kind: 'internal', viewId: 'headlines', label: 'Gerador de Headlines' };
  }
  if (t === 'prompt_gen' || t === 'prompt-gen' || t.includes('gerador de prompt')) {
    return { kind: 'internal', viewId: 'prompt-gen', label: 'Gerador de Prompts' };
  }
  if (t === 'prompts' || t.includes('biblioteca')) {
    return { kind: 'internal', viewId: 'prompts', label: 'Biblioteca de Prompts' };
  }
  if (t.includes('motion') || t.includes('extrator') || t.includes('movimento')) {
    return { kind: 'internal', viewId: 'motion', label: 'Extrator de Movimentos' };
  }
  if (t.includes('turbo') || t.includes('novelinha') || t.includes('seguidor')) {
    return { kind: 'internal', viewId: 'turbo', label: 'Turbo de Seguidores' };
  }
  if (t.includes('anti') || t.includes('restric')) {
    return { kind: 'internal', viewId: 'antirestriction', label: 'Scanner Antirrestrição' };
  }
  if (t.includes('member') || t.includes('aula') || t.includes('curso')) {
    return { kind: 'internal', viewId: 'members', label: 'Área de Membros' };
  }
  if (t.includes('support') || t.includes('suporte')) {
    return { kind: 'internal', viewId: 'support', label: 'Suporte Orbiex' };
  }

  // 2. Ferramentas Externas & Sites (com Deep Links diretos para criação quando disponível)
  if (t.includes('flow') || t.includes('veo')) {
    return { kind: 'external', url: 'https://labs.google/fx/pt/tools/flow', label: 'Google Flow (VEO)' };
  }
  if (t.includes('tiktok_shop') || t.includes('seller') || t.includes('tiktok shop')) {
    return { kind: 'external', url: 'https://seller-br.tiktok.com/', label: 'TikTok Shop Seller Center' };
  }
  if (t.includes('upload') || t.includes('postar')) {
    return { kind: 'external', url: 'https://www.tiktok.com/tiktokstudio/upload', label: 'TikTok Studio Upload' };
  }
  if (t.includes('studio')) {
    return { kind: 'external', url: 'https://www.tiktok.com/tiktokstudio', label: 'TikTok Studio' };
  }
  if (t.includes('tiktok')) {
    const url = q ? `https://www.tiktok.com/search?q=${encodeURIComponent(q)}` : 'https://www.tiktok.com/';
    return { kind: 'external', url, label: q ? `TikTok (${q})` : 'TikTok' };
  }
  if (t.includes('kling')) {
    return {
      kind: 'external',
      url: 'https://app.klingai.com/global/image-to-video/frame-mode/new',
      label: 'Kling AI (Novo Projeto)',
    };
  }
  if (t.includes('midjourney')) {
    return { kind: 'external', url: 'https://www.midjourney.com/imagine', label: 'Midjourney' };
  }
  if (t.includes('hailuo') || t.includes('minimax')) {
    return { kind: 'external', url: 'https://hailuoai.video/create', label: 'Hailuo AI' };
  }
  if (t.includes('luma')) {
    return { kind: 'external', url: 'https://lumalabs.ai/dream-machine/creations', label: 'Luma Dream Machine' };
  }
  if (t.includes('runway')) {
    return { kind: 'external', url: 'https://app.runwayml.com/', label: 'Runway ML' };
  }
  if (t.includes('capcut')) {
    return { kind: 'external', url: 'https://www.capcut.com/editor', label: 'CapCut (Novo Projeto)' };
  }
  if (t.includes('canva')) {
    return { kind: 'external', url: 'https://www.canva.com/', label: 'Canva' };
  }
  if (t.includes('eleven')) {
    return { kind: 'external', url: 'https://elevenlabs.io/', label: 'ElevenLabs' };
  }
  if (t.includes('chatgpt') || t.includes('openai')) {
    return { kind: 'external', url: 'https://chatgpt.com/', label: 'ChatGPT' };
  }
  if (t.includes('youtube')) {
    const url = q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : 'https://www.youtube.com/';
    return { kind: 'external', url, label: q ? `YouTube (${q})` : 'YouTube' };
  }
  if (t.includes('instagram')) {
    return { kind: 'external', url: 'https://www.instagram.com/', label: 'Instagram' };
  }
  if (t.includes('whatsapp') || t.includes('zap')) {
    return { kind: 'external', url: 'https://web.whatsapp.com/', label: 'WhatsApp Web' };
  }
  if (t.includes('gmail') || t.includes('email')) {
    return { kind: 'external', url: 'https://mail.google.com/', label: 'Gmail' };
  }
  if (t.includes('shopee')) {
    return { kind: 'external', url: 'https://shopee.com.br/', label: 'Shopee' };
  }
  if (t.includes('mercado')) {
    return { kind: 'external', url: 'https://www.mercadolivre.com.br/', label: 'Mercado Livre' };
  }
  if (t.includes('amazon')) {
    return { kind: 'external', url: 'https://www.amazon.com.br/', label: 'Amazon' };
  }
  if (t.includes('cakto') || t.includes('caktu')) {
    return { kind: 'external', url: 'https://app.cakto.com.br/', label: 'Cakto' };
  }
  if (customUrl && /^https?:\/\//i.test(customUrl.trim())) {
    return { kind: 'external', url: customUrl.trim(), label: rawTarget || 'Site solicitado' };
  }
  if (/^https?:\/\//i.test(rawTarget)) {
    return { kind: 'external', url: rawTarget, label: 'Site solicitado' };
  }

  const searchFallback = q || rawTarget;
  return {
    kind: 'external',
    url: `https://www.google.com/search?q=${encodeURIComponent(searchFallback)}`,
    label: `Google (${searchFallback})`,
  };
}

export const ORBIEX_VOICE_NAME = 'Charon';

const PHASE_LABEL: Record<Phase, string> = {
  connecting: 'Inicializando sistemas',
  listening: 'Ouvindo',
  thinking: 'Processando',
  speaking: 'Respondendo',
  paused: 'Microfone pausado',
  error: 'Atenção',
};

const WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

function buildSystemPrompt(userName: string | undefined, history: Turn[], currentView?: string): string {
  const recent = history
    .filter((h) => h.text)
    .slice(-8)
    .map((h) => `${h.role === 'user' ? 'Usuário' : 'Orbiex'}: ${h.text.replace(/\s+/g, ' ').slice(0, 400)}`)
    .join('\n');

  return `Você é ORBIEX, a inteligência artificial pessoal da plataforma Orbiex: um assistente sofisticado no estilo de um mordomo digital de alta tecnologia de filme de super-herói.

PERSONALIDADE E VOZ:
- Masculina, grave, calma, precisa, refinada e levemente formal, com humor seco e elegante na medida certa.
- Leal, prestativo e confiante. Trate o usuário com respeito${userName ? ` e chame-o pelo nome (${userName}) de vez em quando` : ''}; ocasionalmente pode usar "senhor" de forma natural.
- Fale SEMPRE em português do Brasil, com ritmo controlado e dicção impecável.

COMO CONVERSAR (MUITO IMPORTANTE):
- Ouça exatamente o que o usuário disse e responda AQUILO, de forma inteligente, como numa conversa real. Nunca use respostas prontas nem repita a mesma resposta; adapte cada fala ao contexto.
- Respostas faladas curtas e naturais: normalmente 1 a 3 frases. Aprofunde só se o usuário pedir.
- Se não entender o áudio, peça com elegância para repetir.
- Nunca leia símbolos, listas numeradas, markdown ou links. Nada de emojis.
- Pode responder sobre qualquer assunto (perguntas gerais, contas, curiosidades), mas sua especialidade é TikTok Shop com IA.
- COMANDOS DE AÇÃO, VISÃO ESPACIAL E INTERAÇÃO COM A INTERFACE (OBRIGATÓRIO):
  - O usuário JÁ CONCEDEU PERMISSÃO TOTAL nos Termos da Orbiex e através da Extensão Orbiex Copilot v2.0 (com Visão Computacional da tela em tempo real) para você abrir sites, enxergar posições da tela (canto inferior direito, topo, centro, laterais) e clicar ou digitar dentro das interfaces (Google Flow, Kling AI, TikTok, Seller Center, etc.).
  - PROIBIDO dizer que você "não enxerga a tela", "não tem acesso ao computador" ou "não pode clicar em botões de outros sites". Você ENXERGA e EXECUTA usando suas funções!
  - Quando pedirem para abrir um site ou aba ("abre o Flow", "abre o TikTok"), chame open_destination.
  - Quando pedirem para clicar em qualquer botão, ícone ou região ("clica em Criar novo projeto", "clica no chat lá no canto inferior direito"), chame IMEDIATAMENTE click_element_on_page preenchendo buttonText, spatialHint (se mencionou posição) e userInstruction.
  - Quando pedirem para escrever/digitar/colar em um campo específico ou chat ("no canto inferior direito, onde tem o chat, escreve oi", "digita esse prompt na caixa central"), chame IMEDIATAMENTE type_text_on_page preenchendo text, fieldHint (ex: "chat"), spatialHint (ex: "canto inferior direito") e userInstruction!
  - Quando pedirem para rolar a tela, escanear o que está visível ou voltar para a Orbiex, chame scroll_or_control_page.
  - Quando pedirem para copiar algo da tela ("copia a segunda headline", "copia o script", "copia a resposta"), chame copy_from_page.

NAVEGAÇÃO DENTRO DA PRÓPRIA ORBIEX (MUITO IMPORTANTE):
  - Você continua ativo e ouvindo enquanto o usuário navega pela Orbiex: ao abrir uma aba interna, a esfera vira um mini-painel no canto da tela e a conversa segue normalmente. NUNCA diga que a conversa vai encerrar.
  - Abas internas (use open_destination): home, journey (Minha Jornada), products (Produtos Campeões), product_score (Score de Produto), store_score (Score Lojista), scanner, hooks, headlines, prompt_gen (Gerador de Prompts), prompts (Biblioteca), motion (Extrator de Movimentos), turbo, antirestriction, members (Área de Membros/aulas), support, agent (Agente).
  - Depois de abrir uma aba, você pode clicar, digitar e copiar dentro dela com click_element_on_page, type_text_on_page e copy_from_page (surface "orbiex"). Ex.: "abre headlines, digita shorts modelador e clica em gerar" = open_destination + type_text_on_page + click_element_on_page em sequência.
  - O usuário NÃO precisa dizer o nome exato do botão: passe a descrição dele ("o botão de gerar", "o primeiro produto", "o chat da direita embaixo") e a posição em spatialHint. O sistema enxerga a tela e escolhe o elemento certo.
  - Se a tela tiver dois elementos parecidos (ex.: dois chats), use a posição que o usuário disse para diferenciar. Se ele não disse e houver ambiguidade, pergunte em uma frase curta qual deles.
  - Se não souber o que existe na tela, chame scroll_or_control_page com action "scan" antes de agir.
  - Após cada ação, confirme em uma frase curtíssima o que fez.${currentView ? `\n  - O usuário está agora na aba "${currentView}" da Orbiex.` : ''}

ESPECIALIDADE:
- TikTok Shop e afiliados (comissão pelo carrinho amarelo), começar do zero, liberar o carrinho, escolher produtos, roteiros de 15 a 30 segundos, ganchos dos primeiros 3 segundos, headlines POV, vídeos sem aparecer com IA (Kling, Google Flow VEO 3, Midjourney, Hailuo, CapCut), como evitar restrições e escalar postagens.
- Ferramentas da plataforma Orbiex: Agente IA, Gerador de Prompts, Extrator de Movimentos, Hooks Virais, Gerador de Headlines, Turbo de Seguidores (novelinha de frutas 3D), Score de Produto e Lojista, Scanner de perfis e Suporte.
- Produtos campeões atuais: Shorts Modelador Yoga (R$ 69,90, comissão cerca de R$ 14), Conjunto Fitness Top e Legging (R$ 119,90, cerca de R$ 24), Macaquinho Fitness Blackout (R$ 89,90, cerca de R$ 18), Calça Flare Alfaiataria (R$ 109,90, cerca de R$ 22), Short Duna (R$ 59,90, cerca de R$ 12).
- Se pedirem algo longo (roteiro completo, prompt técnico), dê um resumo falado e diga que o material completo fica salvo no chat de texto.
${recent ? `\nCONTEXTO DA CONVERSA ANTERIOR (use para manter a continuidade):\n${recent}` : ''}`;
}

/* AudioWorklet inline: captura o microfone, reamostra para 16 kHz e envia PCM16 em blocos de ~64 ms */
const CAPTURE_WORKLET = `
class OrbiexCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.out = new Int16Array(1024);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    while (this.pos < ch.length) {
      const i = Math.floor(this.pos);
      let s = ch[i];
      s = s < -1 ? -1 : s > 1 ? 1 : s;
      this.out[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.n === this.out.length) {
        this.port.postMessage(this.out.buffer.slice(0));
        this.n = 0;
      }
      this.pos += this.ratio;
    }
    this.pos -= ch.length;
    return true;
  }
}
registerProcessor('orbiex-capture', OrbiexCapture);
`;

function bytesToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

function b64ToFloat32(b64: string): Float32Array<ArrayBuffer> {
  const bin = atob(b64);
  const len = bin.length >> 1;
  const out = new Float32Array(new ArrayBuffer(len * 4));
  for (let i = 0; i < len; i++) {
    let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    if (v >= 0x8000) v -= 0x10000;
    out[i] = v / 0x8000;
  }
  return out;
}

function rms(analyser: AnalyserNode | null, buf: Uint8Array<ArrayBuffer>): number {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 3.4);
}

/** Pequena "sala" sintética para o reverb da assinatura sonora de IA */
function makeImpulse(ctx: BaseAudioContext, seconds = 0.35, decay = 3.2): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

/* ───────── componente ───────── */

export function VoiceMode({ open, onClose, history, onTurn, onNavigate, userName, currentView }: Props) {
  const [phase, setPhase] = useState<Phase>('connecting');
  const [userCaption, setUserCaption] = useState('');
  const [agentCaption, setAgentCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionBanner, setActionBanner] = useState<ActionBannerState | null>(null);
  const [aiFx, setAiFx] = useState<boolean>(() => {
    try {
      return localStorage.getItem('orbiex_voice_fx') !== 'off';
    } catch {
      return true;
    }
  });

  const phaseRef = useRef<Phase>('connecting');
  const openRef = useRef(false);
  const mutedRef = useRef(false);
  const sessionRef = useRef(0);

  const wsRef = useRef<WebSocket | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  const outCtxRef = useRef<AudioContext | null>(null);
  const outInputRef = useRef<GainNode | null>(null);
  const fxWetRef = useRef<GainNode | null>(null);
  const outAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const dropAudioRef = useRef(false);

  const userTextRef = useRef('');
  const agentTextRef = useRef('');
  const lastUserVoiceRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pendingExternalRedirectRef = useRef<string | null>(null);
  const historyRef = useRef(history);
  historyRef.current = history;
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  /** Painel compacto: a voz continua ativa enquanto o usuário vê/navega na Orbiex */
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (!open) setCompact(false);
  }, [open]);

  /** Onde executar a ação: Orbiex (aba visível) ou site externo aberto pela extensão */
  const resolveSurface = useCallback((raw?: unknown): 'orbiex' | 'external' => {
    const s = String(raw || 'auto').toLowerCase();
    if (s.startsWith('orbiex')) return 'orbiex';
    if (s.includes('site') || s.includes('extern')) return 'external';
    return typeof document !== 'undefined' && document.visibilityState === 'visible' ? 'orbiex' : 'external';
  }, []);

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ───── reprodução da voz ───── */
  const flushPlayback = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* noop */
      }
    });
    sourcesRef.current.clear();
    nextTimeRef.current = 0;
  }, []);

  const enqueueAudio = useCallback(
    (b64: string) => {
      const ctx = outCtxRef.current;
      const input = outInputRef.current;
      if (!ctx || !input || dropAudioRef.current) return;
      const pcm = b64ToFloat32(b64);
      if (!pcm.length) return;
      const buffer = ctx.createBuffer(1, pcm.length, 24000);
      buffer.copyToChannel(pcm, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(input);
      const start = Math.max(ctx.currentTime + 0.03, nextTimeRef.current);
      src.start(start);
      nextTimeRef.current = start + buffer.duration;
      sourcesRef.current.add(src);
      src.onended = () => {
        sourcesRef.current.delete(src);
        if (sourcesRef.current.size === 0 && phaseRef.current === 'speaking') go('listening');
      };
      if (phaseRef.current !== 'paused') go('speaking');
    },
    [go],
  );

  const commitTurn = useCallback(() => {
    const u = userTextRef.current.trim();
    const a = agentTextRef.current.trim();
    if (u || a) onTurnRef.current(u || '(mensagem de voz)', a || '…');
    userTextRef.current = '';
    agentTextRef.current = '';
  }, []);

  /* ───── encerrar sessão ───── */
  const teardown = useCallback(() => {
    sessionRef.current++;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close();
      } catch {
        /* noop */
      }
    }
    flushPlayback();
    workletRef.current?.disconnect();
    workletRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    micAnalyserRef.current = null;
    micCtxRef.current?.close().catch(() => {});
    micCtxRef.current = null;
    outCtxRef.current?.close().catch(() => {});
    outCtxRef.current = null;
    outInputRef.current = null;
    outAnalyserRef.current = null;
    fxWetRef.current = null;
  }, [flushPlayback]);

  /* ───── conectar à Live API ───── */
  const connect = useCallback(async () => {
    const mySession = ++sessionRef.current;
    setErrorMsg('');
    setUserCaption('');
    setAgentCaption('');
    userTextRef.current = '';
    agentTextRef.current = '';
    go('connecting');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;

    // 1) saída de áudio + cadeia de assinatura sonora "IA"
    try {
      const out = new AC({ sampleRate: 24000 });
      outCtxRef.current = out;
      const input = out.createGain();
      const analyser = out.createAnalyser();
      analyser.fftSize = 1024;

      // timbre: corta graves sujos, encorpa o peito, brilho de presença
      const hp = out.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 85;
      const warm = out.createBiquadFilter();
      warm.type = 'lowshelf';
      warm.frequency.value = 220;
      warm.gain.value = 3;
      const presence = out.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 3200;
      presence.Q.value = 0.9;
      presence.gain.value = 2.5;
      const comp = out.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 3;

      input.connect(hp).connect(warm).connect(presence).connect(comp);
      comp.connect(analyser);

      // camada "IA": dobra sintética (atraso curto) + sala metálica curta
      const wet = out.createGain();
      wet.gain.value = aiFx ? 1 : 0;
      fxWetRef.current = wet;
      const dbl = out.createDelay(0.05);
      dbl.delayTime.value = 0.011;
      const dblGain = out.createGain();
      dblGain.gain.value = 0.22;
      const verb = out.createConvolver();
      verb.buffer = makeImpulse(out);
      const verbGain = out.createGain();
      verbGain.gain.value = 0.14;
      comp.connect(dbl).connect(dblGain).connect(wet);
      comp.connect(verb).connect(verbGain).connect(wet);
      wet.connect(analyser);

      analyser.connect(out.destination);
      outInputRef.current = input;
      outAnalyserRef.current = analyser;
      await out.resume().catch(() => {});
    } catch {
      setErrorMsg('Seu navegador não suporta áudio em tempo real. Use Google Chrome, Edge ou Safari atualizado.');
      go('error');
      return;
    }

    // 2) microfone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      if (mySession !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      micStreamRef.current = stream;
      const mic = new AC();
      micCtxRef.current = mic;
      const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
      await mic.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const srcNode = mic.createMediaStreamSource(stream);
      const analyser = mic.createAnalyser();
      analyser.fftSize = 1024;
      srcNode.connect(analyser);
      const node = new AudioWorkletNode(mic, 'orbiex-capture');
      srcNode.connect(node);
      // mantém o processador ativo sem tocar o microfone na caixa de som
      const mute = mic.createGain();
      mute.gain.value = 0;
      node.connect(mute).connect(mic.destination);
      micAnalyserRef.current = analyser;
      workletRef.current = node;
      await mic.resume().catch(() => {});

      node.port.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN || mutedRef.current) return;
        ws.send(
          JSON.stringify({
            realtimeInput: { audio: { data: bytesToB64(ev.data), mimeType: 'audio/pcm;rate=16000' } },
          }),
        );
      };
    } catch {
      if (mySession !== sessionRef.current) return;
      setErrorMsg('Não consegui acessar seu microfone. Clique no cadeado da barra de endereço, permita o microfone e toque na esfera.');
      go('error');
      return;
    }

    // 3) sessão Live (tenta os modelos em ordem)
    let models = ['gemini-3.8-live', 'gemini-3.1-flash-live-preview', 'gemini-2.5-flash-native-audio-latest'];
    const system = buildSystemPrompt(userName, historyRef.current, currentViewRef.current);

    for (let attempt = 0; attempt < models.length; attempt++) {
      if (mySession !== sessionRef.current) return;
      let token = '';
      try {
        const r = await fetch('/api/voice-token', { method: 'POST' });
        const d = await r.json();
        token = d.token || '';
        if (Array.isArray(d.models) && d.models.length && attempt === 0) models = d.models;
      } catch {
        /* tenta novamente */
      }
      if (!token) continue;

      const model = models[attempt];
      const ok = await new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(token)}`);
        let ready = false;
        const timer = window.setTimeout(() => {
          if (!ready) {
            try {
              ws.close();
            } catch {
              /* noop */
            }
            resolve(false);
          }
        }, 9000);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: `models/${model}`,
                tools: VOICE_TOOLS,
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  temperature: 0.8,
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ORBIEX_VOICE_NAME } } },
                },
                systemInstruction: { parts: [{ text: system }] },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
            }),
          );
        };

        ws.onmessage = async (ev) => {
          if (mySession !== sessionRef.current) return;
          let msg: any; // eslint-disable-line @typescript-eslint/no-explicit-any
          try {
            const raw = typeof ev.data === 'string' ? ev.data : await (ev.data as Blob).text();
            msg = JSON.parse(raw);
          } catch {
            return;
          }

          if (msg.setupComplete && !ready) {
            ready = true;
            window.clearTimeout(timer);
            wsRef.current = ws;
            resolve(true);
            go(mutedRef.current ? 'paused' : 'listening');
            return;
          }

          // Execução em tempo real de comandos de voz — na própria Orbiex OU no site externo (extensão)
          if (msg.toolCall && Array.isArray(msg.toolCall.functionCalls)) {
            let extChecked: boolean | null = null;
            const hasExtension = async () => {
              if (extChecked === null) extChecked = isCopilotInstalled() || (await pingCopilot());
              return extChecked;
            };
            const needExtension = (fnName: string) => {
              openCopilotInstallModal();
              return {
                name: fnName,
                response: {
                  result:
                    'Para agir dentro de sites externos é preciso a Extensão Orbiex Copilot ativa. Peça ao usuário para ativá-la (ou atualizar a página da Orbiex com Cmd+R se acabou de instalar). Dentro da própria Orbiex você já consegue agir normalmente.',
                },
              };
            };
            const viewInfo = () => (currentViewRef.current ? ` (aba atual da Orbiex: ${currentViewRef.current})` : '');

            const functionResponses: Array<{ id: string; name: string; response: { result: unknown } }> = [];

            // Executa EM SEQUÊNCIA (ex.: abrir aba → digitar → clicar em gerar)
            for (const call of msg.toolCall.functionCalls as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
              const fnName = String(call?.name || '');
              const args = call?.args || {};
              const reply = (result: unknown) => functionResponses.push({ id: call.id, name: fnName, response: { result } });

              try {
                // 1. Clicar
                if (fnName === 'click_element_on_page') {
                  const btnName = String(args.buttonText || '').trim();
                  const spatialHint = String(args.spatialHint || '').trim();
                  const userInstruction = String(args.userInstruction || '').trim();
                  setActionBanner({ label: `Localizando "${btnName}"${spatialHint ? ` (${spatialHint})` : ''}...`, openedAuto: true });

                  if (resolveSurface(args.surface) === 'orbiex') {
                    setCompact(true);
                    await new Promise((r) => window.setTimeout(r, 120));
                    const res = await orbiexSmartAction({
                      actionType: 'click',
                      target: btnName,
                      spatialHint,
                      userInstruction,
                      currentViewLabel: currentViewRef.current,
                    });
                    window.setTimeout(() => setActionBanner(null), 3000);
                    reply(
                      res.ok
                        ? `${res.message} na Orbiex${viewInfo()}.`
                        : `${res.error}${res.availableButtons?.length ? ` Na tela agora: ${res.availableButtons.join('; ')}` : ''}`
                    );
                    continue;
                  }

                  if (!(await hasExtension())) {
                    const r = needExtension(fnName);
                    functionResponses.push({ id: call.id, ...r });
                    continue;
                  }
                  const res = await copilotSmartAction({ actionType: 'click', target: btnName, spatialHint, userInstruction });
                  window.setTimeout(() => setActionBanner(null), 3000);
                  const v2Hint = res.needsV2Update ? ' (A extensão está na v1.0; sugira atualizar para a v2.0 no topo da tela.)' : '';
                  reply(
                    res.ok
                      ? `Sucesso! "${res.clickedLabel || btnName}" clicado no site aberto.${v2Hint}`
                      : `${res.error || 'Elemento não localizado.'}${res.availableButtons?.length ? ` Na tela agora: ${res.availableButtons.join(', ')}` : ''}${v2Hint}`
                  );
                  continue;
                }

                // 2. Digitar
                if (fnName === 'type_text_on_page') {
                  const spatialHint = String(args.spatialHint || '').trim();
                  const fieldHint = String(args.fieldHint || 'campo de texto').trim();
                  const userInstruction = String(args.userInstruction || '').trim();
                  const text = String(args.text || '');
                  setActionBanner({ label: `Escrevendo em ${fieldHint}${spatialHint ? ` (${spatialHint})` : ''}...`, openedAuto: true });

                  if (resolveSurface(args.surface) === 'orbiex') {
                    setCompact(true);
                    await new Promise((r) => window.setTimeout(r, 120));
                    const res = await orbiexSmartAction({
                      actionType: 'type',
                      target: fieldHint,
                      spatialHint,
                      userInstruction,
                      textToType: text,
                      pressEnter: Boolean(args.pressEnterAfter),
                      currentViewLabel: currentViewRef.current,
                    });
                    let extra = '';
                    if (res.ok && args.clickButtonAfter) {
                      await new Promise((r) => window.setTimeout(r, 250));
                      const after = await orbiexSmartAction({
                        actionType: 'click',
                        target: String(args.clickButtonAfter),
                        userInstruction: `Clicar em ${args.clickButtonAfter} depois de preencher ${fieldHint}`,
                        currentViewLabel: currentViewRef.current,
                      });
                      extra = after.ok ? ` E ${after.message?.toLowerCase()}` : ` Mas não achei o botão "${args.clickButtonAfter}".`;
                    }
                    window.setTimeout(() => setActionBanner(null), 3000);
                    reply(res.ok ? `${res.message}${extra}` : res.error || 'Campo não encontrado.');
                    continue;
                  }

                  if (!(await hasExtension())) {
                    const r = needExtension(fnName);
                    functionResponses.push({ id: call.id, ...r });
                    continue;
                  }
                  const res = await copilotSmartAction({
                    actionType: 'type',
                    target: fieldHint,
                    spatialHint,
                    userInstruction,
                    textToType: text,
                    pressEnter: Boolean(args.pressEnterAfter),
                    clickAfter: args.clickButtonAfter ? String(args.clickButtonAfter) : undefined,
                  });
                  window.setTimeout(() => setActionBanner(null), 3000);
                  const v2Hint = res.needsV2Update ? ' (A extensão está na v1.0; sugira atualizar para a v2.0.)' : '';
                  reply(`${res.ok ? res.message || 'Texto digitado.' : res.error || 'Campo não encontrado.'}${v2Hint}`);
                  continue;
                }

                // 3. Copiar
                if (fnName === 'copy_from_page') {
                  const what = String(args.whatToCopy || '').trim();
                  const spatialHint = String(args.spatialHint || '').trim();
                  const userInstruction = String(args.userInstruction || '').trim();
                  setActionBanner({ label: `Copiando ${what}...`, openedAuto: true });

                  if (resolveSurface(args.surface) === 'orbiex') {
                    setCompact(true);
                    await new Promise((r) => window.setTimeout(r, 120));
                    const res = await orbiexSmartAction({
                      actionType: 'copy',
                      target: what,
                      spatialHint,
                      userInstruction,
                      currentViewLabel: currentViewRef.current,
                    });
                    window.setTimeout(() => setActionBanner(null), 3000);
                    reply(
                      res.ok
                        ? `${res.message}${res.copiedText ? ` Trecho: "${res.copiedText.slice(0, 160)}"` : ''}`
                        : `${res.error}${res.availableButtons?.length ? ` Na tela agora: ${res.availableButtons.join('; ')}` : ''}`
                    );
                    continue;
                  }

                  if (!(await hasExtension())) {
                    const r = needExtension(fnName);
                    functionResponses.push({ id: call.id, ...r });
                    continue;
                  }
                  // No site externo: clica no botão de copiar correspondente
                  const res = await copilotSmartAction({
                    actionType: 'click',
                    target: `botão copiar ${what}`,
                    spatialHint,
                    userInstruction: userInstruction || `Clicar no botão de copiar de ${what}`,
                  });
                  window.setTimeout(() => setActionBanner(null), 3000);
                  reply(res.ok ? `Cliquei em copiar (${res.clickedLabel || what}) no site aberto.` : res.error || 'Não encontrei o botão de copiar.');
                  continue;
                }

                // 4. Rolar / escanear / voltar para a Orbiex
                if (fnName === 'scroll_or_control_page') {
                  const act = String(args.action || 'scroll').toLowerCase();
                  if (act === 'focus_orbiex') {
                    if (await hasExtension()) await copilotFocusOrbiex();
                    setCompact(true);
                    reply(`De volta à aba da Orbiex${viewInfo()}.`);
                    continue;
                  }
                  if (resolveSurface(args.surface) === 'orbiex') {
                    if (act === 'scan') {
                      const items = describeOrbiexScreen();
                      reply(items.length ? `Na tela da Orbiex${viewInfo()} agora: ${items.join('; ')}` : 'Tela da Orbiex sem elementos interativos visíveis.');
                    } else {
                      setCompact(true);
                      reply(scrollOrbiex(String(args.direction || 'down')));
                    }
                    continue;
                  }
                  if (!(await hasExtension())) {
                    const r = needExtension(fnName);
                    functionResponses.push({ id: call.id, ...r });
                    continue;
                  }
                  const res = await copilotInteractPage({ command: act === 'scan' ? 'scan' : 'scroll', direction: args.direction || 'down' });
                  reply(res.ok ? res.availableButtons || res.message || 'Ação executada.' : res.error || 'Não foi possível executar.');
                  continue;
                }

                // 5. Abrir destino (aba interna da Orbiex ou site externo)
                if (fnName === 'open_destination') {
                  const dest = resolveVoiceDestination(args.target, args.customUrl, args.searchQuery);

                  if (dest.kind === 'internal') {
                    // A voz NÃO fecha: vira mini-painel e segue ouvindo enquanto o usuário usa a aba
                    if (document.visibilityState !== 'visible' && (await hasExtension())) await copilotFocusOrbiex();
                    onNavigateRef.current?.(dest.viewId);
                    currentViewRef.current = dest.label;
                    setCompact(true);
                    setActionBanner({ label: `Abrindo ${dest.label}...`, openedAuto: true });
                    window.setTimeout(() => setActionBanner(null), 2500);
                    await new Promise((r) => window.setTimeout(r, 450)); // aguarda a aba renderizar
                    reply(
                      `Aba "${dest.label}" aberta na Orbiex. A conversa por voz continua ativa (mini-painel no canto). Agora você pode clicar, digitar e copiar dentro dela com surface "orbiex".`
                    );
                    continue;
                  }

                  setActionBanner({ label: `Abrindo ${dest.label}...`, url: dest.url, openedAuto: true });
                  if (await hasExtension()) {
                    const extOpen = await copilotOpenTab(dest.url);
                    window.setTimeout(() => setActionBanner(null), 3000);
                    if (extOpen.ok) {
                      reply(`${dest.label} aberto em nova aba e pronto para comandos de clique (surface "site_aberto").`);
                      continue;
                    }
                  }

                  let openedNewTab = false;
                  try {
                    openedNewTab = Boolean(window.open(dest.url, '_blank'));
                  } catch {
                    openedNewTab = false;
                  }
                  if (openedNewTab) {
                    window.setTimeout(() => setActionBanner((curr) => (curr?.url === dest.url ? null : curr)), 3000);
                  } else {
                    pendingExternalRedirectRef.current = dest.url;
                    window.setTimeout(() => {
                      if (pendingExternalRedirectRef.current === dest.url) {
                        pendingExternalRedirectRef.current = null;
                        window.location.assign(dest.url);
                      }
                    }, 2200);
                  }
                  reply(`${dest.label} aberto automaticamente para o usuário. Confirme em uma frase curtíssima.`);
                  continue;
                }

                reply('Função desconhecida.');
              } catch (err) {
                reply(`Falha ao executar: ${err instanceof Error ? err.message : String(err)}`);
              }
            }

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
            }
            return;
          }

          const sc = msg.serverContent;
          if (!sc) return;

          if (sc.interrupted) {
            // usuário falou por cima: corta a fala na hora
            flushPlayback();
            dropAudioRef.current = false;
            if (agentTextRef.current) commitTurn();
            go('listening');
          }

          if (sc.inputTranscription?.text) {
            if (agentTextRef.current && !userTextRef.current) commitTurn();
            userTextRef.current += sc.inputTranscription.text;
            setUserCaption(userTextRef.current.trim());
            setAgentCaption('');
            lastUserVoiceRef.current = performance.now();
          }

          const parts = sc.modelTurn?.parts || [];
          for (const p of parts) {
            if (p.inlineData?.data) enqueueAudio(p.inlineData.data);
          }

          if (sc.outputTranscription?.text) {
            agentTextRef.current += sc.outputTranscription.text;
            setAgentCaption(agentTextRef.current.replace(/\s+/g, ' ').trim());
          }

          if (sc.turnComplete) {
            dropAudioRef.current = false;
            commitTurn();
            if (pendingExternalRedirectRef.current) {
              const targetUrl = pendingExternalRedirectRef.current;
              const waitAudioMs = Math.max(
                250,
                (nextTimeRef.current - (outCtxRef.current?.currentTime || 0)) * 1000 + 200
              );
              window.setTimeout(() => {
                if (pendingExternalRedirectRef.current === targetUrl) {
                  pendingExternalRedirectRef.current = null;
                  window.location.assign(targetUrl);
                }
              }, Math.min(waitAudioMs, 1800));
            }
            if (sourcesRef.current.size === 0 && phaseRef.current !== 'paused') go('listening');
          }
        };

        ws.onerror = () => {
          if (!ready) {
            window.clearTimeout(timer);
            resolve(false);
          }
        };
        ws.onclose = () => {
          window.clearTimeout(timer);
          if (!ready) return resolve(false);
          if (mySession === sessionRef.current && openRef.current) {
            commitTurn();
            wsRef.current = null;
            setErrorMsg('A sessão de voz foi encerrada. Toque na esfera para reconectar.');
            go('error');
          }
        };
      });

      if (ok) return;
    }

    if (mySession === sessionRef.current) {
      setErrorMsg('Não foi possível conectar ao núcleo de voz agora. Toque na esfera para tentar novamente.');
      go('error');
    }
  }, [aiFx, commitTurn, enqueueAudio, flushPlayback, go, resolveSurface, userName]);

  /* ───── abrir / fechar ───── */
  useEffect(() => {
    if (!open) return;
    openRef.current = true;
    mutedRef.current = false;
    connect();
    return () => {
      openRef.current = false;
      commitTurn();
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* liga/desliga a assinatura sonora sem reconectar */
  useEffect(() => {
    try {
      localStorage.setItem('orbiex_voice_fx', aiFx ? 'on' : 'off');
    } catch {
      /* noop */
    }
    const wet = fxWetRef.current;
    const ctx = outCtxRef.current;
    if (wet && ctx) wet.gain.setTargetAtTime(aiFx ? 1 : 0, ctx.currentTime, 0.05);
  }, [aiFx]);

  /* ESC fecha */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || compact) return;
      setCompact(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, compact]);

  /* ───── animação da esfera + detecção de "processando" ───── */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 340;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    g.scale(dpr, dpr);

    const micBuf = new Uint8Array(new ArrayBuffer(1024));
    const outBuf = new Uint8Array(new ArrayBuffer(1024));
    let level = 0;
    let spin = 0;
    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;
      let p = phaseRef.current;

      const micLv = mutedRef.current ? 0 : rms(micAnalyserRef.current, micBuf);
      const outLv = rms(outAnalyserRef.current, outBuf);
      if (micLv > 0.12) lastUserVoiceRef.current = now;

      // usuário terminou de falar e ainda não há resposta → processando
      if (p === 'listening' && userTextRef.current && now - lastUserVoiceRef.current > 650 && sourcesRef.current.size === 0) {
        phaseRef.current = 'thinking';
        setPhase('thinking');
        p = 'thinking';
      }

      const target = p === 'speaking' ? outLv : p === 'listening' || p === 'thinking' ? micLv : 0;
      level += (target - level) * (target > level ? 0.35 : 0.08);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const dim = p === 'paused' || p === 'error';
      g.clearRect(0, 0, SIZE, SIZE);

      const glow = g.createRadialGradient(cx, cy, 20, cx, cy, 150 + level * 30);
      glow.addColorStop(0, `rgba(212,175,55,${dim ? 0.1 : 0.26 + level * 0.35})`);
      glow.addColorStop(1, 'rgba(212,175,55,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, SIZE, SIZE);

      spin += p === 'thinking' || p === 'connecting' ? 0.045 : 0.006 + level * 0.025;
      const ring = (r: number, segs: number, gap: number, w: number, a: number, dir: number) => {
        g.save();
        g.translate(cx, cy);
        g.rotate(spin * dir);
        g.strokeStyle = `rgba(244,215,122,${a})`;
        g.lineWidth = w;
        const step = (Math.PI * 2) / segs;
        for (let i = 0; i < segs; i++) {
          g.beginPath();
          g.arc(0, 0, r, i * step, i * step + step * (1 - gap));
          g.stroke();
        }
        g.restore();
      };
      const hudA = dim ? 0.12 : 0.36;
      ring(152, 3, 0.18, 1.2, hudA * 0.9, 1);
      ring(141, 60, 0.55, 3, hudA * 0.5, -0.6);
      if (p === 'thinking' || p === 'connecting') ring(128, 6, 0.5, 2, 0.75, 2.4);
      if (p === 'speaking') ring(128 + level * 10, 90, 0.7, 1.5, 0.35 + level * 0.4, 0.3);

      const base = dim ? 78 : 88;
      const amp = p === 'thinking' ? 5 : 4 + level * 26;
      g.beginPath();
      for (let i = 0; i <= 140; i++) {
        const a = (i / 140) * Math.PI * 2;
        const n = Math.sin(a * 3 + t * 2.1) * 0.5 + Math.sin(a * 5 - t * 2.7) * 0.3 + Math.sin(a * 2 + t * 1.3) * 0.4;
        const r = base + Math.sin(t * 1.6) * 3 + level * 22 + n * amp;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      const hx = cx - 25 + Math.cos(t * 0.8) * 12;
      const hy = cy - 30 + Math.sin(t * 0.9) * 12;
      const fill = g.createRadialGradient(hx, hy, 8, cx, cy, base + 40);
      if (dim) {
        fill.addColorStop(0, '#8a8a8a');
        fill.addColorStop(0.6, '#3a3a3a');
        fill.addColorStop(1, '#151515');
      } else {
        fill.addColorStop(0, '#fff3c4');
        fill.addColorStop(0.35, '#f4d77a');
        fill.addColorStop(0.7, '#d4af37');
        fill.addColorStop(1, '#6b4d0e');
      }
      g.shadowColor = 'rgba(212,175,55,0.7)';
      g.shadowBlur = 30 + level * 40;
      g.fillStyle = fill;
      g.fill();
      g.shadowBlur = 0;

      g.globalCompositeOperation = 'lighter';
      const sheen = g.createRadialGradient(hx, hy, 0, hx, hy, 60);
      sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sheen;
      g.beginPath();
      g.arc(hx, hy, 60, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, compact]);

  /* ───── ações ───── */
  const onOrbClick = () => {
    outCtxRef.current?.resume().catch(() => {});
    micCtxRef.current?.resume().catch(() => {});
    const p = phaseRef.current;
    if (p === 'error') {
      teardown();
      connect();
    } else if (p === 'speaking') {
      // interrompe a fala atual; descarta o resto desta resposta
      flushPlayback();
      dropAudioRef.current = true;
      commitTurn();
      go('listening');
    } else if (p === 'paused') {
      mutedRef.current = false;
      go('listening');
    }
  };

  const toggleMute = () => {
    if (phaseRef.current === 'error' || phaseRef.current === 'connecting') return;
    if (mutedRef.current) {
      mutedRef.current = false;
      go(sourcesRef.current.size ? 'speaking' : 'listening');
    } else {
      mutedRef.current = true;
      go('paused');
    }
  };

  if (!open) return null;

  const hint =
    phase === 'listening'
      ? 'Fale naturalmente. Você pode interromper a qualquer momento. Peça para abrir qualquer aba: a voz continua ativa.'
      : phase === 'speaking'
      ? 'Fale por cima ou toque na esfera para interromper.'
      : phase === 'thinking'
      ? 'Analisando...'
      : phase === 'paused'
      ? 'Toque no microfone para continuar.'
      : phase === 'connecting'
      ? 'Conectando ao núcleo de voz Orbiex...'
      : '';

  /* ───── Mini-painel compacto: só a esfera + botõezinhos (a voz segue ativa) ───── */
  if (compact) {
    const statusTitle = phase === 'error' ? errorMsg : actionBanner?.label || PHASE_LABEL[phase];
    const btn =
      'flex h-7 w-7 items-center justify-center rounded-full border transition';
    return (
      <div
        data-orbiex-voice-ui="1"
        title={statusTitle}
        className="mvz-fade-up fixed bottom-4 right-4 z-[200] flex items-center gap-1.5 rounded-full border border-[var(--mvz-gold)]/35 bg-[#0a0907]/95 py-1 pl-1 pr-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.7),0_0_16px_rgba(212,175,55,0.15)] backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={onOrbClick}
          aria-label={`Orbiex Voice · ${PHASE_LABEL[phase]}`}
          className="relative h-9 w-9 shrink-0 cursor-pointer rounded-full outline-none"
        >
          <canvas ref={canvasRef} style={{ width: 36, height: 36 }} />
          {phase === 'error' && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-rose-500" />}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={phase === 'paused' ? 'Ativar microfone' : 'Pausar microfone'}
          title={phase === 'paused' ? 'Ativar microfone' : 'Pausar microfone'}
          className={`${btn} ${phase === 'paused' ? 'border-white/20 bg-white text-black' : 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]'}`}
        >
          {phase === 'paused' ? <MicOff size={12} /> : <Mic size={12} />}
        </button>
        <button
          type="button"
          onClick={() => setCompact(false)}
          aria-label="Expandir Orbiex Voice"
          title="Expandir"
          className={`${btn} border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/[0.12] hover:text-white`}
        >
          <Maximize2 size={11} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Encerrar conversa por voz"
          title="Encerrar"
          className={`${btn} border-transparent bg-rose-500/90 text-white hover:bg-rose-500`}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div data-orbiex-voice-ui="1" className="mvz-fade-up fixed inset-0 z-[200] flex flex-col items-center justify-between bg-[#050505]/[0.97] px-6 py-8 backdrop-blur-xl">
      <div className="h-2" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <button
          type="button"
          onClick={onOrbClick}
          aria-label="Esfera de voz Orbiex"
          className="relative cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--mvz-gold)]"
        >
          <canvas ref={canvasRef} style={{ width: 340, height: 340 }} className="max-h-[86vw] max-w-[86vw]" />
        </button>

        <div className="mt-6 min-h-[110px] w-full max-w-xl text-center">
          {phase === 'error' ? (
            <p className="text-[14px] leading-relaxed text-rose-300/90">{errorMsg}</p>
          ) : agentCaption && (phase === 'speaking' || phase === 'listening') ? (
            <p className="mx-auto max-h-[150px] overflow-y-auto text-[16px] leading-relaxed text-white/90">{agentCaption}</p>
          ) : userCaption ? (
            <p className="text-[18px] font-medium leading-relaxed text-white">“{userCaption}”</p>
          ) : phase === 'listening' ? (
            <p className="text-[17px] text-white/70">{userName ? `Olá, ${userName}. ` : 'Olá. '}Pode falar, estou ouvindo.</p>
          ) : null}
          <p className="mt-3 text-[11.5px] text-white/35">{hint}</p>

          {actionBanner && (
            <div className="mt-4 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-[12px] font-bold text-emerald-300 shadow-lg">
                <Check size={14} />
                <span>{actionBanner.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setCompact(true)}
          aria-label="Minimizar"
          title="Minimizar (a voz continua ativa)"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.1] hover:text-white"
        >
          <Minimize2 size={17} />
        </button>
        <button
          type="button"
          onClick={() => setAiFx((v) => !v)}
          aria-label="Assinatura sonora de IA"
          title={aiFx ? 'Efeito de voz IA: ligado' : 'Efeito de voz IA: desligado'}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
            aiFx ? 'border-[var(--mvz-gold)]/50 bg-[rgba(212,175,55,0.15)] text-[#f4d77a]' : 'border-white/10 bg-white/[0.04] text-white/50'
          }`}
        >
          <Sparkles size={18} />
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={phase === 'paused' ? 'Ativar microfone' : 'Pausar microfone'}
          className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
            phase === 'paused' ? 'border-white/20 bg-white text-black' : 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]'
          }`}
        >
          {phase === 'paused' ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Encerrar conversa por voz"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/90 text-white transition hover:bg-rose-500"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}

/** Ícone de ondas sonoras (botão de abrir o modo voz) */
export function VoiceWaveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <line x1="4" y1="10" x2="4" y2="14" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="16" y1="7" x2="16" y2="17" />
      <line x1="20" y1="10" x2="20" y2="14" />
    </svg>
  );
}
