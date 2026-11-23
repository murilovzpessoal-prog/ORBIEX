/**
 * Orbiex Voice Bus — mantém a sessão de voz GLOBAL (fora da aba do Agente),
 * para o usuário navegar por toda a Orbiex sem a voz cair.
 */

export interface VoiceTurn {
  role: 'user' | 'agent';
  text: string;
}

const OPEN_EVENT = 'orbiex:voice-open';
const CHATS_KEY = 'orbiex.chats.v1';

type TurnListener = (userText: string, agentText: string) => void;
const turnListeners = new Set<TurnListener>();

let voiceChatId: number | null = null;

export function getVoiceChatId(): number | null {
  return voiceChatId;
}

export function setVoiceChatId(id: number | null) {
  voiceChatId = id;
}

/** Abre a sessão de voz global (pode ser chamado de qualquer aba). */
export function openOrbiexVoice(chatId?: number | null) {
  if (chatId !== undefined) voiceChatId = chatId;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function onVoiceOpenRequest(fn: () => void): () => void {
  window.addEventListener(OPEN_EVENT, fn);
  return () => window.removeEventListener(OPEN_EVENT, fn);
}

/** A aba do Agente (quando montada) se inscreve para receber os turnos e exibir no chat. */
export function subscribeVoiceTurns(fn: TurnListener): () => void {
  turnListeners.add(fn);
  return () => {
    turnListeners.delete(fn);
  };
}

interface StoredMsg {
  id: number;
  role: 'user' | 'agent';
  text: string;
  status?: string;
  prompt?: string;
}
interface StoredChat {
  id: number;
  title: string;
  updatedAt: number;
  msgs: StoredMsg[];
}

function readChats(): StoredChat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY) || localStorage.getItem('orbix.chats.v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let seq = Date.now() + 500000;

/** Entrega um turno de voz: para a aba do Agente se estiver aberta, ou salva direto no histórico. */
export function emitVoiceTurn(userText: string, agentText: string) {
  if (turnListeners.size > 0) {
    turnListeners.forEach((fn) => fn(userText, agentText));
    return;
  }
  try {
    const chats = readChats();
    const userMsg: StoredMsg = { id: ++seq, role: 'user', text: userText };
    const agentMsg: StoredMsg = { id: ++seq, role: 'agent', text: agentText, status: 'done', prompt: userText };
    const idx = voiceChatId !== null ? chats.findIndex((c) => c.id === voiceChatId) : -1;
    if (idx >= 0) {
      chats[idx] = { ...chats[idx], updatedAt: Date.now(), msgs: [...chats[idx].msgs, userMsg, agentMsg] };
    } else {
      const id = ++seq;
      voiceChatId = id;
      const title = userText.length > 40 ? `${userText.slice(0, 40)}…` : userText;
      chats.unshift({ id, title, updatedAt: Date.now(), msgs: [userMsg, agentMsg] });
    }
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats.slice(0, 40)));
  } catch {
    /* storage cheio */
  }
}

/** Histórico recente da conversa de voz (para dar continuidade ao reconectar). */
export function getVoiceHistory(): VoiceTurn[] {
  if (voiceChatId === null) return [];
  const chat = readChats().find((c) => c.id === voiceChatId);
  return chat ? chat.msgs.map((m) => ({ role: m.role, text: m.text })) : [];
}
