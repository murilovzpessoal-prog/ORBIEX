export interface ExecutiveManager {
  id: string;
  name: string;
  role: string;
  badge: string;
  specialty: string;
  experience: string;
  sla: string;
  activeSlots: string;
  avatar: string;
  /** Ajuste fino de enquadramento do rosto (object-position CSS) */
  avatarPosition?: string;
  /** Ajuste fino de escala do retrato */
  avatarScale?: number;
  /** Link direto de redirecionamento (ex: https://www.contate.me/...) ou número com DDI+DDD */
  whatsapp: string;
  bio: string;
  pillars: string[];
}

export interface SelectedPageConfig {
  brand: {
    name: string;
    eyebrow: string;
    logoUrl: string;
    wordmarkUrl: string;
    backgroundUrl: string;
    /** Link da Área de Membros da Alpine Project (ex: '/curso' ou URL externa) */
    membersAreaUrl: string;
  };
  vsl: {
    videoUrl: string;
    embedHtml: string;
    posterUrl: string;
    /** Revela a seção de sorteio do gerente quando faltar X segundos para o vídeo acabar (60 = 1 minuto) */
    revealWhenRemainingSeconds: number;
    lockScrubber: boolean;
  };
  roulette: {
    /**
     * 'fixed': Cai SEMPRE no gerente definido em `targetManagerId`.
     * 'controlled_list': Sorteia apenas entre os IDs listados em `allowedManagerIds` (ex: Gabi e Alice)
     *                    e trava o resultado no navegador (nunca cai nos gerentes figurantes).
     */
    mode: 'fixed' | 'controlled_list';
    /** ID padrão quando mode = 'fixed' */
    targetManagerId: string;
    /** Lista controlada de gerentes reais que podem ser sorteados */
    allowedManagerIds: string[];
    spinDurationMs: number;
  };
  whatsappMessageTemplate: string;
  managers: ExecutiveManager[];
}

export const SELECTED_PAGE_CONFIG: SelectedPageConfig = {
  brand: {
    name: 'Alpine Project',
    eyebrow: 'ALPINE PROJECT',
    logoUrl: '/assets/login/alpine-logo.png',
    wordmarkUrl: '/assets/login/alpine-wordmark.png',
    backgroundUrl: '/assets/login/alpine-bg.jpg',
    membersAreaUrl: '/curso',
  },

  vsl: {
    videoUrl: 'https://stream.cakto.com.br/7e539193-37b1-4dc7-9fea-5a08f12f6c81/1080p/video.m3u8',
    embedHtml: '',
    posterUrl: '',
    revealWhenRemainingSeconds: 60,
    lockScrubber: true,
  },

  roulette: {
    mode: 'fixed',
    targetManagerId: 'gabi',
    allowedManagerIds: ['gabi'],
    spinDurationMs: 7200,
  },

  whatsappMessageTemplate:
    'Oi, {gerente}! Acabei de ser selecionado(a) para o *Alpine Project* e você saiu aqui pra mim como minha gerente.{nome_bloco}\n\nJá assisti ao vídeo inicial, podemos começar?',

  managers: [
    {
      id: 'gabi',
      name: 'Gabi',
      role: 'Gerente de Contas',
      badge: 'ACCOUNT MANAGER',
      specialty: 'Acompanhamento Individual',
      experience: 'Time Oficial Alpine',
      sla: 'Atendimento Individual 1:1',
      activeSlots: 'Disponível',
      avatar: '/assets/selected/gabi.jpg',
      avatarPosition: '54% 36%',
      avatarScale: 1.06,
      whatsapp: 'https://www.contate.me/suportemvz',
      bio: 'A partir de agora, sou eu quem vai te acompanhar de perto aqui dentro do Alpine Project. Já deixei tudo pronto para você começar do jeito certo e colocar sua estrutura para rodar o quanto antes.',
      pillars: [
        'Acompanhamento de Perto',
        'Estrutura Validada',
        'Suporte Direto no WhatsApp',
      ],
    },
    {
      id: 'alice',
      name: 'Alice',
      role: 'Gerente de Contas',
      badge: 'ACCOUNT MANAGER',
      specialty: 'Acompanhamento Individual',
      experience: 'Time Oficial Alpine',
      sla: 'Atendimento Individual 1:1',
      activeSlots: 'Disponível',
      avatar: '/assets/selected/alice.jpg',
      avatarPosition: '48% 18%',
      avatarScale: 1.15,
      whatsapp: '5511999999999',
      bio: 'A partir de agora, sou eu quem vai te acompanhar de perto aqui dentro do Alpine Project. Já deixei tudo pronto para você começar do jeito certo e colocar sua estrutura para rodar o quanto antes.',
      pillars: [
        'Acompanhamento de Perto',
        'Estrutura Validada',
        'Suporte Direto no WhatsApp',
      ],
    },
    {
      id: 'rafael',
      name: 'Rafael Monteiro',
      role: 'Gerente de Operações',
      badge: 'OPERATIONS MANAGER',
      specialty: 'Estruturação & Processos',
      experience: 'Quadro Executivo Alpine',
      sla: 'Atendimento 1:1',
      activeSlots: 'Carteira completa',
      avatar: '/assets/selected/rafael.jpg',
      avatarPosition: '43% 33%',
      avatarScale: 1.18,
      whatsapp: '5511999999999',
      bio: 'Gerente de operações do ecossistema Alpine Project.',
      pillars: ['Estrutura Operacional', 'Análise de Metas', 'Acompanhamento'],
    },
    {
      id: 'helena',
      name: 'Helena Martins',
      role: 'Gerente de Sucesso',
      badge: 'SUCCESS MANAGER',
      specialty: 'Retenção & Crescimento',
      experience: 'Quadro Executivo Alpine',
      sla: 'Atendimento 1:1',
      activeSlots: 'Carteira completa',
      avatar: '/assets/selected/helena.jpg',
      avatarPosition: '51% 28%',
      avatarScale: 1.14,
      whatsapp: '5511999999999',
      bio: 'Gerente dedicada à evolução contínua das contas selecionadas.',
      pillars: ['Acompanhamento de Metas', 'Validação', 'Suporte Executivo'],
    },
    {
      id: 'lucas',
      name: 'Lucas Ribeiro',
      role: 'Gerente de Estratégia',
      badge: 'STRATEGY MANAGER',
      specialty: 'Tráfego & Conversão',
      experience: 'Quadro Executivo Alpine',
      sla: 'Atendimento 1:1',
      activeSlots: 'Carteira completa',
      avatar: '/assets/selected/lucas.jpg',
      avatarPosition: '60% 25%',
      avatarScale: 1.32,
      whatsapp: '5511999999999',
      bio: 'Estrategista de crescimento e otimização de resultados.',
      pillars: ['Otimização', 'Análise de Dados', 'Escala'],
    },
  ],
};
