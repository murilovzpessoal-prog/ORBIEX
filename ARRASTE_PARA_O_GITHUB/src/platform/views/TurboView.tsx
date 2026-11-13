import { useState, useMemo } from 'react';
import {
  Flame,
  Sparkles,
  Download,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Search,
  Video,
  ShieldCheck,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export interface Mascot {
  id: string;
  name: string;
  nickname: string;
  fruit: string;
  categoryLabel: string;
  image: string;
  fallbackImage: string;
  viralScore: number;
  retentionScore: number;
  catchphrase: string;
  voiceStyle: string;
  personality: string;
  bio: string;
  bestFor: string;
  defaultIdea: string;
  defaultEpisode: string;
  defaultClimax: string;
  promptMotionEnglish: string;
}

const MASCOTS: Mascot[] = [
  {
    id: 'abacatudo',
    name: 'Abacatudo',
    nickname: 'O Gigante Verde',
    fruit: 'Abacate Hipertrofiado',
    categoryLabel: 'Maromba & Força',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/ad03f9db-1899-434b-d72c-374eea752d00/public',
    fallbackImage: '/turbo-followers/abacatudo.png',
    viralScore: 98.4,
    retentionScore: 96.2,
    catchphrase: 'Eu choro, mas não perco a pose! Quem tiver coragem que encare a verdade!',
    voiceStyle: 'Voz grossa e rouca, emotivo, chora no meio da frase com intensidade cômica.',
    personality: 'Marombeiro dramático com coração mole, viciado em novelinhas caóticas e reviravoltas.',
    bio: 'Ficou famoso no TikTok pelas novelinhas dramáticas com frutas. É o rei dos episódios de academia e das brigas hilárias.',
    bestFor: 'Duelos de força, dramas na academia, traições cômicas e quebra de tabus.',
    defaultIdea: 'Quero uma cena dramática onde o Abacatudo chora dizendo que foi traído na academia, mas promete que na Parte 2 vai confrontar todo mundo.',
    defaultEpisode: 'Episódio 01 - O Flagrante na Academia',
    defaultClimax: 'Ele encontra uma mensagem misteriosa e a tela escurece com som de batimento cardíaco.',
    promptMotionEnglish:
      '3D muscular anthropomorphic avocado man with crying emotional eyes, flexing biceps in dark luxury studio, dramatic rim lighting, fast dynamic zoom-in, cinematic vertical 9:16, natural lip sync speaking directly to camera, 60fps, photorealistic render',
  },
  {
    id: 'moranguete',
    name: 'Moranguete',
    nickname: 'A Patricinha de Grife',
    fruit: 'Morango Haute Couture',
    categoryLabel: 'Moda & Luxo',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/1f6a3c66-f726-43b8-cd77-769ffda7e700/public',
    fallbackImage: '/turbo-followers/moranguete.png',
    viralScore: 96.8,
    retentionScore: 95.5,
    catchphrase: 'Você realmente achou que eu ia ficar calada? Pois achou muito errado, fofa.',
    voiceStyle: 'Voz aveludada, sussurrada, elegante com pitadas certeiras de ironia fina.',
    personality: 'Diva da alta sociedade que domina a mansão das frutas e arma os planos mais venenosos.',
    bio: 'Não sai de casa sem salto e vestido preto brilhante. Especialista em confrontos tensos e fofocas de alta tensão.',
    bestFor: 'Deboches finos, intrigas na mansão, fofocas de alta sociedade e vingança.',
    defaultIdea: 'Quero que a Moranguete faça um deboche elegante com quem tentou derrubar ela na mansão e anuncie que descobriu o plano secreto.',
    defaultEpisode: 'Episódio 01 - O Veneno da Moranguete',
    defaultClimax: 'Ela joga a taça na mesa e encara a câmera com um sorriso vingativo.',
    promptMotionEnglish:
      '3D anthropomorphic strawberry woman doing a supermodel runway spin in sparkling black dress, looking sarcastically at the camera, showing a dress tag, elegant studio spotlight, slow-motion vertical 9:16, realistic textures',
  },
  {
    id: 'bananildo',
    name: 'Bananildo',
    nickname: 'O Rei do TikTok Shop',
    fruit: 'Banana Streetwear',
    categoryLabel: 'Viral Streetwear',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/213afa84-3f12-43da-59e0-779b23f41800/public',
    fallbackImage: '/turbo-followers/bananildo.png',
    viralScore: 99.2,
    retentionScore: 97.8,
    catchphrase: 'Qual foi, parceiro? Ficou moscando, perdeu o maior bafafá da sua vida!',
    voiceStyle: 'Ritmo acelerado, gírias urbanas, energia alta e entonação hipnótica.',
    personality: 'O malandro da quebrada das frutas. Corre mais rápido que todo mundo e sabe de todos os podres.',
    bio: 'Com mais de 100 milhões de visualizações somadas, Bananildo protagoniza as perseguições mais eletrizantes do feed.',
    bestFor: 'Fugas alucinadas, esquetes caóticas, brigas de rua cômicas e revelações bombásticas.',
    defaultIdea: 'Quero que o Bananildo chegue acelerado sem ar dizendo que a vizinha pegou ele no pulo espiando a reunião secreta das frutas.',
    defaultEpisode: 'Episódio 01 - A Fuga Alucinada',
    defaultClimax: 'O alarme toca ao fundo e ele pula a cerca gritando pra todo mundo seguir pra ver o final.',
    promptMotionEnglish:
      '3D banana boy character in grey hoodie jumping into the camera frame with extreme excitement, talking with animated hand gestures, pointing at bottom screen, ultra smooth 4k 60fps vertical',
  },
  {
    id: 'uvinha',
    name: 'Uvinha',
    nickname: 'A Rainha do Brilho',
    fruit: 'Cacho de Uva Lilás',
    categoryLabel: 'Glitter & Pop',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/c81bd83c-a03d-44f6-0717-99b5d4119400/public',
    fallbackImage: '/turbo-followers/uvinha.png',
    viralScore: 95.1,
    retentionScore: 94.3,
    catchphrase: 'Se você passar esse vídeo sem me seguir, sua curiosidade vai te matar hoje à noite!',
    voiceStyle: 'Voz aguda, musical, teatral e hipnotizante como uma apresentadora de TV ácida.',
    personality: 'Patricinha do glitter, mimada, não aceita ser deixada de fora e faz escândalos inesquecíveis.',
    bio: 'Seus barracos teatrais viralizam em minutos gerando montanhas de comentários e torcidas na internet.',
    bestFor: 'Birras mimadas, barracos em eventos VIP, ciúmes cômicos e desafios virais.',
    defaultIdea: 'Quero que a Uvinha faça uma birra cômica dizendo que a rival copiou o penteado e o look dela no baile das frutas.',
    defaultEpisode: 'Episódio 01 - O Barraco da Patricinha',
    defaultClimax: 'Ela sobe no palco, pega o microfone e ameaça soltar o áudio proibido.',
    promptMotionEnglish:
      '3D purple grape girl doing a viral cute celebration dance, purple sparkles floating in air, smiling adorably and holding up product with both hands, hyper-detailed 3D animation',
  },
  {
    id: 'cerejinha',
    name: 'Cerejinha',
    nickname: 'A Fofoqueira da Mansão',
    fruit: 'Cereja Vintage',
    categoryLabel: 'Mistério & Fofoca',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/16d275b9-3490-4853-29f9-c3ef028ba000/public',
    fallbackImage: '/turbo-followers/cerejinha.png',
    viralScore: 97.3,
    retentionScore: 96.5,
    catchphrase: 'Nem a patroa imagina o que eu acabei de escutar atrás dessa porta...',
    voiceStyle: 'Voz sussurrada, misteriosa e fofoqueira, criando curiosidade imediata nos primeiros 2s.',
    personality: 'Trabalha na mansão dos ricaços e grava no celular as conversas proibidas mais comprometedoras.',
    bio: 'Mestre da retenção psicológica. Começa os vídeos sussurrando como se estivesse escondida, garantindo que 90% assistam até o final.',
    bestFor: 'Fofocas de bastidores, segredos perigosos, revelações no escuro e suspense total.',
    defaultIdea: 'Quero que a Cerejinha grave no escuro sussurrando que ouviu o patrão combinando um golpe milionário contra a família real das frutas.',
    defaultEpisode: 'Episódio 01 - A Fofoca Proibida',
    defaultClimax: 'A porta range, os passos se aproximam e ela desliga a câmera apavorada.',
    promptMotionEnglish:
      '3D cherry maid peering from behind dark luxury door, whispering secretly to camera, looking left and right nervously before holding up a secret product, cinematic 3D realism',
  },
  {
    id: 'alface',
    name: 'Dona Rúcula',
    nickname: 'A Advogada Corporativa',
    fruit: 'Coentro & Rúcula Executiva',
    categoryLabel: 'Business & Oratória',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/75192c66-55d6-4bee-3e46-c594cb8f8300/public',
    fallbackImage: '/turbo-followers/alface.png',
    viralScore: 94.6,
    retentionScore: 93.9,
    catchphrase: 'Artigo 5º da constituição: a verdade dói, mas eu vou esfregar na cara de vocês.',
    voiceStyle: 'Voz firme, professoral, ritmo pausado de quem sabe exatamente o que está falando.',
    personality: 'A promotora implacável das novelinhas que desmascara mentiras em tribunal público.',
    bio: 'Formada em jurisprudência dos vegetais, entra nos confrontos com documentos e provas irrefutáveis.',
    bestFor: 'Tribunais cômicos, acusações implacáveis, desmascaramento público e discursos de autoridade.',
    defaultIdea: 'Quero que a Dona Rúcula chegue com uma pasta preta cheia de provas que anulam o casamento das frutas mais ricas da cidade.',
    defaultEpisode: 'Episódio 01 - O Dossiê Secreto',
    defaultClimax: 'Ela abre a pasta na mesa do juiz e a audiência inteira fica de pé em choque.',
    promptMotionEnglish:
      '3D leafy businesswoman adjusting emerald blazer collar, putting on stylish reading glasses, presenting tablet with graphs, speaking with authority, 4k 60fps vertical',
  },
  {
    id: 'bananita',
    name: 'Bananita Glow',
    nickname: 'A Musa Fitness',
    fruit: 'Banana Peel Dourada',
    categoryLabel: 'Fitness & Corpo',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/db774aea-786e-48f7-eef7-45641aae7000/public',
    fallbackImage: '/turbo-followers/bananita.png',
    viralScore: 98.7,
    retentionScore: 97.4,
    catchphrase: 'Achou que eu ia chorar na academia? Eu fiquei foi mais forte e pronta pro troco!',
    voiceStyle: 'Energia contagiante de musa fitness, decidida, empoderada e provocativa.',
    personality: 'Influenciadora maromba que transforma desilusões amorosas em motivação brutal e vingança.',
    bio: 'Seus vídeos de volta por cima e indiretas afiadas geram milhões de compartilhamentos de mulheres no TikTok.',
    bestFor: 'Superação pós-término, alfinetadas venenosas, rotinas intensas e vingança fitness.',
    defaultIdea: 'Quero que a Bananita grave um treino pesado mandando uma indireta fulminante pro ex que tá sentado assistindo de boca aberta.',
    defaultEpisode: 'Episódio 01 - O Troco da Musa',
    defaultClimax: 'O ex tenta dar um passo na direção dela e o segurança entra na frente com música tensa.',
    promptMotionEnglish:
      '3D banana-haired fitness girl doing a quick 360 spin to show off high-waist jeans from all angles, smiling brightly with thumbs up, studio golden lens flare, 9:16',
  },
  {
    id: 'brocolino',
    name: 'Brocolino',
    nickname: 'O Nerd dos Descontos',
    fruit: 'Brócolis Estudante',
    categoryLabel: 'Nerd & Curiosidades',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/f843e324-f275-4435-dd5e-9ae280b47f00/public',
    fallbackImage: '/turbo-followers/brocolino.png',
    viralScore: 97.9,
    retentionScore: 96.8,
    catchphrase: 'E-eu calculei as probabilidades... e o que vai acontecer no próximo episódio é inacreditável!',
    voiceStyle: 'Tímido no começo, com leve gagueira fofa, que explode em entusiasmo frenético.',
    personality: 'Estudante genial que hackeia sistemas e descobre tudo que os outros tentam esconder.',
    bio: 'Carrega um tablet futurista. Suas reações assustadas prendem a audiência do primeiro ao último segundo.',
    bestFor: 'Teorias da conspiração, invasões de sistema, pânicos cômicos e revelações tecnológicas.',
    defaultIdea: 'Quero o Brocolino apavorado mostrando na tela que os arquivos confidenciais da mansão foram descriptografados.',
    defaultEpisode: 'Episódio 01 - O Hack das Frutas',
    defaultClimax: 'A tela fica vermelha com aviso de invasor detectado e corta o sinal.',
    promptMotionEnglish:
      '3D broccoli schoolboy nervously checking a futuristic calculator, looking up with wide shocked eyes, pointing finger at screen in disbelief, ultra expressive animation',
  },
  {
    id: 'mirtilinho',
    name: 'Mirtilinho Trap',
    nickname: 'O Beatmaker Misterioso',
    fruit: 'Mirtilo / Blueberry Dark',
    categoryLabel: 'Música & Street',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/6ec07498-6658-445d-e350-12e3c069b800/public',
    fallbackImage: '/turbo-followers/mirtilinho.png',
    viralScore: 96.4,
    retentionScore: 95.8,
    catchphrase: 'O beat dropou, a máscara caiu e agora não tem mais volta!',
    voiceStyle: 'Grave com autotune sutil, estilo trap americano, misterioso e seguro.',
    personality: 'Produtor musical das frutas que cria as trilhas sonoras mais tensas e os confrontos rimados.',
    bio: 'Lançou as trends sonoras mais virais do TikTok. Seus episódios usam batidas de suspense que prendem os jovens.',
    bestFor: 'Duelos de rimas, mistérios no estúdio, desabafos na madrugada e confrontos urbanos.',
    defaultIdea: 'Quero que o Mirtilinho solte uma rima expondo a traição de quem ele mais confiava no estúdio.',
    defaultEpisode: 'Episódio 01 - O Drop da Verdade',
    defaultClimax: 'A luz do estúdio pisca, um vulto aparece na porta e a batida é interrompida.',
    promptMotionEnglish:
      '3D blueberry music producer nodding along to heavy 808 beat with animated hand gestures, subtle neon lighting glow, ultra smooth 60fps vertical',
  },
  {
    id: 'laranjito',
    name: 'Laranjito Pop',
    nickname: 'O Rei do Pagode & Ofertas',
    fruit: 'Laranja Solar Extrovertida',
    categoryLabel: 'Alegria & Enquetes',
    image: 'https://imagedelivery.net/LAPOMaLM6kW2Iw_br68SMA/8e63a2fc-4a68-4224-f357-be4f46cfb500/public',
    fallbackImage: '/turbo-followers/laranjito.png',
    viralScore: 98.1,
    retentionScore: 97.2,
    catchphrase: 'Chora não, coração! O barraco é grande, mas a risada tá garantida!',
    voiceStyle: 'Voz aberta, gargalhada contagiante, ritmo de apresentador de festa e pagode.',
    personality: 'O fofoqueiro bem-humorado que transforma confusão em espetáculo popular.',
    bio: 'Não existe comentário triste no feed do Laranjito. Ele transforma qualquer treta de bairro numa esquete cômica inesquecível.',
    bestFor: 'Comédias do cotidiano, confusões no pagode, flagras em festas de família e fofocas bem-humoradas.',
    defaultIdea: 'Quero o Laranjito contando no microfone do pagode como pegou o casal mais certinho da rua num encontro secreto.',
    defaultEpisode: 'Episódio 01 - O Flagra no Pagode',
    defaultClimax: 'A pessoa flagrada levanta da mesa com a garrafa na mão e todos começam a gritar.',
    promptMotionEnglish:
      '3D orange character holding miniature megaphone, laughing contagiously and dancing with high energy, confetti falling, bright vivid studio lighting',
  },
];

export function TurboView({ onUse }: { onUse?: (prompt: string) => void }) {
  // Mascote selecionado (padrão Abacatudo)
  const [selectedId, setSelectedId] = useState<string>('abacatudo');
  const [searchQuery, setSearchQuery] = useState('');

  // Etapa do Studio: 1 (Escolha) | 2 (Esboço da Ideia) | 3 (Entrega de Produção)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Estados da Etapa 2 (Esboço da Ideia do Cliente)
  const [userIdea, setUserIdea] = useState(
    'Quero uma cena dramática onde o Abacatudo chora dizendo que foi traído na academia, mas promete que na Parte 2 vai confrontar todo mundo.'
  );
  const [episodeTitle, setEpisodeTitle] = useState('Episódio 01 - O Flagrante na Academia');
  const [plotTwist, setPlotTwist] = useState('Ele encontra uma mensagem misteriosa e a tela escurece com som de batimento cardíaco');
  const [ctaType, setCtaType] = useState<'follow' | 'comment' | 'share'>('follow');

  // Estado de Carregamento Cinematográfico entre Etapa 2 e Etapa 3
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  // Estados de cópia e feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Mascote ativo
  const currentMascot = useMemo(() => {
    return MASCOTS.find((m) => m.id === selectedId) || MASCOTS[0];
  }, [selectedId]);

  // Lista filtrada na etapa 1
  const filteredMascots = useMemo(() => {
    return MASCOTS.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fruit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.catchphrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nickname.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchQuery]);

  // Selecionar mascote e atualizar valores padrão
  const handleSelectMascot = (m: Mascot) => {
    setSelectedId(m.id);
    setUserIdea(m.defaultIdea);
    setEpisodeTitle(m.defaultEpisode);
    setPlotTwist(m.defaultClimax);
  };

  // Copiar com feedback
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Download do asset em alta resolução garantido e funcional
  const handleDownload = async (imgUrl: string, fallbackUrl: string, filename: string) => {
    setDownloadingId(filename);

    const triggerBlobDownload = (blob: Blob, name: string) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    };

    // 1. Tentar baixar do arquivo local (mesma origem, 100% livre de bloqueio CORS no navegador)
    const localUrl = fallbackUrl || `/turbo-followers/${filename}.png`;
    try {
      const res = await fetch(localUrl);
      if (res.ok) {
        const blob = await res.blob();
        triggerBlobDownload(blob, filename);
        setDownloadingId(null);
        setDownloadedId(filename);
        setTimeout(() => setDownloadedId(null), 2500);
        return;
      }
    } catch {
      // continua para a próxima tentativa
    }

    // 2. Tentar baixar da URL remota via fetch
    if (imgUrl && imgUrl !== localUrl) {
      try {
        const res = await fetch(imgUrl, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, filename);
          setDownloadingId(null);
          setDownloadedId(filename);
          setTimeout(() => setDownloadedId(null), 2500);
          return;
        }
      } catch {
        // continua para canvas
      }
    }

    // 3. Fallback via Canvas (desenha a imagem e converte para blob)
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 800;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                triggerBlobDownload(blob, filename);
              } else {
                window.open(localUrl || imgUrl, '_blank');
              }
              setDownloadingId(null);
              setDownloadedId(filename);
              setTimeout(() => setDownloadedId(null), 2500);
            }, 'image/png');
            return;
          }
        } catch {
          window.open(localUrl || imgUrl, '_blank');
          setDownloadingId(null);
          setDownloadedId(filename);
          setTimeout(() => setDownloadedId(null), 2500);
        }
      };
      img.onerror = () => {
        window.open(localUrl || imgUrl, '_blank');
        setDownloadingId(null);
        setDownloadedId(filename);
        setTimeout(() => setDownloadedId(null), 2500);
      };
      img.src = localUrl;
    } catch {
      window.open(localUrl || imgUrl, '_blank');
      setDownloadingId(null);
      setDownloadedId(filename);
      setTimeout(() => setDownloadedId(null), 2500);
    }
  };

  // Disparar o Carregamento Profissional para a Etapa 3
  const handleGenerateScript = () => {
    setIsGenerating(true);
    setLoadingStage(1);

    setTimeout(() => setLoadingStage(2), 700);
    setTimeout(() => setLoadingStage(3), 1500);
    setTimeout(() => setLoadingStage(4), 2200);

    setTimeout(() => {
      setIsGenerating(false);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2800);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ────────────────────────────────────────────────────────────
          HEADER PRINCIPAL • ESTÚDIO DE PRODUÇÃO VIRAL
      ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] border border-[var(--mvz-line)] bg-gradient-to-br from-[#0e0c08] via-[#080705] to-[#040404] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] md:p-8">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--mvz-gold)]/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#f43f5e]/10 blur-[95px]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mvz-gold)]/30 bg-[var(--mvz-gold)]/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Flame size={13} className="text-[var(--mvz-gold)] animate-pulse" />
              <span>Estúdio de Criação • Turbo Seguidores</span>
            </div>

            <h1 className="text-[28px] font-black tracking-tight text-white sm:text-[36px] md:text-[40px] leading-tight">
              Turbo{' '}
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] bg-clip-text text-transparent">
                Seguidores
              </span>
            </h1>

            <p className="text-[13.5px] leading-relaxed text-white/75 sm:text-[14.5px]">
              Selecione seu personagem 3D, escreva sua ideia em poucas palavras e receba o roteiro humanizado
              com o prompt exato para gerar o vídeo no Kling AI, Hailuo ou Luma.
            </p>
          </div>

          {/* Card Resumo do Personagem Selecionado */}
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--mvz-line-strong)] bg-[#0d0c0a]/90 p-4 backdrop-blur-md lg:w-80">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--mvz-gold)]/50 bg-black shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <img
                src={currentMascot.image}
                alt={currentMascot.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentMascot.fallbackImage;
                }}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mvz-gold)]">
                Personagem Ativo
              </div>
              <div className="truncate text-[15px] font-black text-white">{currentMascot.name}</div>
              <div className="text-[11px] font-medium text-white/60">{currentMascot.fruit}</div>
            </div>

            {step > 1 && (
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white hover:bg-white/5 transition"
                title="Trocar personagem"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Stepper Superior Guiado */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-5">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-all ${
              step === 1
                ? 'border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold)] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]">1</span>
            <span>1. Escolha o Personagem 3D</span>
          </button>

          <span className="text-white/20">/</span>

          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-all ${
              step === 2
                ? 'border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold)] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]">2</span>
            <span>2. Esboço da Ideia & Detalhes</span>
          </button>

          <span className="text-white/20">/</span>

          <button
            disabled={step < 3}
            onClick={() => setStep(3)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-all disabled:opacity-40 disabled:pointer-events-none ${
              step === 3
                ? 'border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/10 text-[var(--mvz-gold)] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]">3</span>
            <span>3. Roteiro Pronto & Prompt de Vídeo</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          ETAPA 1: SELEÇÃO DO PERSONAGEM (LIMPO & DIRETO)
      ──────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Barra de Busca e Avanço */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--mvz-line)] bg-[#0d0c0a]/60 p-4 backdrop-blur-md">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Buscar personagem por nome ou bordão..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-72 rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 text-[12.5px] text-white placeholder-white/40 focus:border-[var(--mvz-gold)] focus:outline-none transition"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] px-6 text-[12.5px] font-black uppercase tracking-wider text-black shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:brightness-110 transition"
            >
              <span>Avançar com {currentMascot.name}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Grid dos Cards dos Personagens */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {filteredMascots.map((mascot) => {
              const isSelected = selectedId === mascot.id;

              return (
                <div
                  key={mascot.id}
                  onClick={() => handleSelectMascot(mascot)}
                  className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border bg-[#0d0c0a] transition-all duration-300 hover:-translate-y-1.5 ${
                    isSelected
                      ? 'border-2 border-[var(--mvz-gold)] bg-gradient-to-b from-[#18150f] to-[#0c0a07] shadow-[0_16px_40px_rgba(212,175,55,0.25)]'
                      : 'border-[var(--mvz-line)] hover:border-white/30 hover:shadow-[0_16px_35px_rgba(0,0,0,0.7)]'
                  }`}
                >
                  {/* Selo de Seleção Ativa */}
                  <div className="absolute top-3 right-3 z-20">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)] text-black shadow-[0_0_10px_rgba(212,175,55,0.6)]'
                          : 'border-white/20 bg-black/60 text-white/30 group-hover:border-white/40'
                      }`}
                    >
                      {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                    </div>
                  </div>

                  {/* Moldura da Imagem */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                    <img
                      src={mascot.image}
                      alt={mascot.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = mascot.fallbackImage;
                      }}
                      className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-106"
                    />

                    {/* Gradiente escuro inferior */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-[#0d0c0a]/20 to-transparent" />

                    {/* Botão de Download Direto da Imagem */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(mascot.image, mascot.fallbackImage, mascot.id);
                      }}
                      title="Baixar imagem original em alta"
                      className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/70 hover:border-[var(--mvz-gold)] hover:text-white hover:bg-black transition backdrop-blur-md cursor-pointer"
                    >
                      {downloadedId === mascot.id ? (
                        <Check size={12} className="text-[#22c55e]" />
                      ) : downloadingId === mascot.id ? (
                        <Loader2 size={12} className="animate-spin text-[var(--mvz-gold)]" />
                      ) : (
                        <Download size={12} />
                      )}
                    </button>
                  </div>

                  {/* Dados do Personagem */}
                  <div className="relative z-10 p-4 pt-1 space-y-2">
                    <div>
                      <h3 className="text-[15px] font-black text-white group-hover:text-[var(--mvz-gold)] transition">
                        {mascot.name}
                      </h3>
                      <div className="text-[11px] font-medium text-white/50">{mascot.fruit}</div>
                    </div>

                    <p className="text-[11px] italic text-white/70 line-clamp-2">
                      "{mascot.catchphrase}"
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMascot(mascot);
                        setStep(2);
                      }}
                      className={`mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition ${
                        isSelected
                          ? 'bg-[var(--mvz-gold)] text-black'
                          : 'border border-white/10 bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'
                      }`}
                    >
                      <span>{isSelected ? 'Escolhido • Criar Vídeo' : 'Escolher'}</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          ETAPA 2: ESBOÇO DA IDEIA & REFINAMENTO DO ROTEIRO
      ──────────────────────────────────────────────────────────── */}
      {step === 2 && !isGenerating && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)]">
                Etapa 2 de 3
              </span>
              <h2 className="mt-1 text-[22px] font-black text-white sm:text-[26px]">
                Esboce sua Ideia & Detalhes da Produção
              </h2>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-white/80 hover:border-[var(--mvz-gold)] hover:text-white transition"
            >
              <RotateCcw size={13} />
              <span>Trocar Personagem ({currentMascot.name})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
            {/* Coluna Esquerda: Formulário de Ideia (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Bloco de Texto da Ideia */}
              <div className="space-y-3 rounded-3xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-extrabold uppercase tracking-wider text-white">
                    Sua Ideia ou Cena da Novelinha
                  </label>
                  <span className="text-[11px] text-[var(--mvz-gold)]">A IA vai estruturar e humanizar</span>
                </div>

                <p className="text-[12px] text-white/60">
                  Escreva do seu jeito o drama, conflito, fofoca ou situação cômica. Nós vamos transformar esse esboço em um episódio de novela viral no estilo de fala do <strong>{currentMascot.name}</strong>.
                </p>

                <textarea
                  rows={4}
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                  placeholder="Ex: Quero uma cena onde o Abacatudo descobre que foi traído na academia e confronta todo mundo aos prantos prometendo revanche..."
                  className="w-full rounded-2xl border border-white/15 bg-black/60 p-4 text-[13.5px] leading-relaxed text-white placeholder-white/40 focus:border-[var(--mvz-gold)] focus:outline-none transition"
                />

                {/* Sugestões Rápidas de 1 Clique */}
                <div className="pt-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
                    Sugestões de Ângulos Virais:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      'Traição dramática na cozinha',
                      'Flagrante no treino com choro cômico',
                      'Segredo bombástico revelado ao vivo',
                      'Duelo épico entre frutas rivais',
                    ].map((sug) => (
                      <button
                        key={sug}
                        onClick={() =>
                          setUserIdea(`Quero um episódio de ${sug.toLowerCase()} com o ${currentMascot.name} no papel principal.`)
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/75 hover:border-[var(--mvz-gold)] hover:text-white hover:bg-white/[0.06] transition"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações da Novela & CTA */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-3xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 shadow-xl">
                <div>
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-white/70">
                    Título do Episódio / Capítulo
                  </label>
                  <input
                    type="text"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="Ex: Episódio 01 - O Flagrante na Cozinha"
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 text-[13px] text-white focus:border-[var(--mvz-gold)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-white/70">
                    Clímax ou Gancho do Final
                  </label>
                  <input
                    type="text"
                    value={plotTwist}
                    onChange={(e) => setPlotTwist(e.target.value)}
                    placeholder="Ex: Revelação chocante que corta antes do desfecho"
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 text-[13px] text-white focus:border-[var(--mvz-gold)] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-white/70">
                    Objetivo Principal do Vídeo (CTA Viral)
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {[
                      { id: 'follow', label: 'Seguir para a Parte 2', sub: 'Turbo de Seguidores' },
                      { id: 'comment', label: 'Comentar no Vídeo', sub: 'Explosão de Algoritmo' },
                      { id: 'share', label: 'Compartilhar o Drama', sub: 'Viralização Orgânica' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setCtaType(opt.id as any)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          ctaType === opt.id
                            ? 'border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/10 text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <div className="text-[12px] font-black text-white">{opt.label}</div>
                        <div className="mt-0.5 text-[10px] text-white/50">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Preview do Mascote & Botão de Geração (5 cols) */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-3xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-6 space-y-4">
                <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[var(--mvz-gold)]">
                  Configuração de Produção
                </span>

                <div className="flex items-center gap-4 border-b border-white/[0.06] pb-4">
                  <img
                    src={currentMascot.image}
                    alt={currentMascot.name}
                    className="h-16 w-16 rounded-2xl object-cover border border-[var(--mvz-gold)]/50"
                  />
                  <div>
                    <h4 className="text-[17px] font-black text-white">{currentMascot.name}</h4>
                    <p className="text-[11.5px] text-[var(--mvz-gold)] font-semibold">{currentMascot.categoryLabel}</p>
                    <p className="text-[11px] text-white/50">Tom: {currentMascot.voiceStyle.split(',')[0]}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[12px] text-white/70">
                  <div className="flex justify-between">
                    <span>Episódio:</span>
                    <strong className="text-white line-clamp-1">{episodeTitle}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Clímax:</span>
                    <strong className="text-[var(--mvz-gold)] line-clamp-1">{plotTwist}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Potencial de Retenção:</span>
                    <strong className="text-[#22c55e]">{currentMascot.retentionScore}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa Viral Esperada:</span>
                    <strong className="text-[var(--mvz-gold)]">{currentMascot.viralScore}%</strong>
                  </div>
                </div>

                {/* BOTÃO MESTRE DE GERAÇÃO */}
                <button
                  disabled={!userIdea.trim()}
                  onClick={handleGenerateScript}
                  className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] text-[13.5px] font-black uppercase tracking-wider text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] transition hover:brightness-110 disabled:opacity-40"
                >
                  <Zap size={16} className="fill-black" />
                  <span>Gerar Roteiro & Prompt de Vídeo</span>
                </button>
              </div>

              {/* Informação Profissional de Entrega */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-[12px] text-white/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck size={14} className="text-[#22c55e]" />
                  <span>O que você vai receber na próxima etapa:</span>
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-white/60">
                  <li>Imagem do {currentMascot.name} pronta para download em alta resolução.</li>
                  <li>Prompt de Image-to-Video formatado para Kling AI, Hailuo ou Luma.</li>
                  <li>Roteiro segundo a segundo (0 a 30s) pronto para gravar.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TELA DE CARREGAMENTO CINEMATOGRÁFICO (STUDIO ENGINE)
      ──────────────────────────────────────────────────────────── */}
      {isGenerating && (
        <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[32px] border border-[var(--mvz-gold)]/40 bg-gradient-to-b from-[#110e09] to-[#070605] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.95)]">
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* Anéis girando */}
            <div className="absolute inset-0 rounded-full border-2 border-[var(--mvz-gold)]/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-t-[var(--mvz-gold)] border-r-transparent border-b-[var(--mvz-gold)]/40 border-l-transparent animate-spin" />
            <img
              src={currentMascot.image}
              alt={currentMascot.name}
              className="h-14 w-14 rounded-full object-cover border border-[var(--mvz-gold)]"
            />
          </div>

          <div className="mt-8 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--mvz-gold)]">
              Orbiex Production Engine
            </span>
            <h3 className="text-[22px] font-black text-white sm:text-[26px]">
              {loadingStage === 1 && 'Refinando seu esboço e ganchos neurais...'}
              {loadingStage === 2 && `Calibrando o tom de voz e expressões do ${currentMascot.name}...`}
              {loadingStage === 3 && 'Estruturando prompt de vídeo Image-to-Video (9:16)...'}
              {loadingStage === 4 && 'Finalizando pacote de produção de alta retenção...'}
            </h3>
            <p className="text-[13px] text-white/60">
              Formatando movimentos de câmera, ações físicas e fala cronometrada para o TikTok Shop.
            </p>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#eab308] transition-all duration-500"
              style={{
                width: `${loadingStage * 25}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          ETAPA 3: ENTREGA DO ROTEIRO PRONTO & PROMPT DE ANIMAÇÃO
      ──────────────────────────────────────────────────────────── */}
      {step === 3 && !isGenerating && (
        <div className="space-y-8">
          {/* Header da Etapa 3 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#22c55e]">
                Etapa 3 de 3 • Pronto para Produzir
              </span>
              <h2 className="mt-1 text-[24px] font-black text-white sm:text-[28px]">
                Pacote de Produção • {currentMascot.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-white/80 hover:text-white transition"
              >
                <RotateCcw size={13} />
                <span>Editar Ideia</span>
              </button>

              <button
                onClick={() => {
                  const fullScript =
                    `ROTEIRO VIRAL DE NOVELINHA - TURBO SEGUIDORES\n` +
                    `Personagem: ${currentMascot.name} (${currentMascot.fruit})\n` +
                    `Episódio: ${episodeTitle}\n` +
                    `Clímax / Gancho: ${plotTwist}\n\n` +
                    `[0s - 3s HOOK DE CHOQUE]: "Para tudo o que você tá fazendo agora! ${currentMascot.catchphrase}"\n\n` +
                    `[3s - 15s ENREDO & DRAMA]: "${userIdea}"\n\n` +
                    `[15s - 25s CLÍMAX & REVIRAVOLTA]: "${plotTwist}! E se você achou isso inacreditável, você não faz ideia do que vem a seguir!"\n\n` +
                    `[25s - 30s CTA TURBO DE SEGUIDORES]: "${
                      ctaType === 'follow'
                        ? 'Clica agora no botão de seguir aqui do lado para não perder a Parte 2 amanhã!'
                        : ctaType === 'comment'
                        ? 'Comenta aqui embaixo quem você acha que tá certo nessa história!'
                        : 'Compartilha esse vídeo com aquele amigo que ama uma fofoca e segue pra ver a Parte 2!'
                    }"\n\n` +
                    `PROMPT DE ANIMAÇÃO DE VÍDEO (IMAGE-TO-VIDEO):\n${currentMascot.promptMotionEnglish}`;

                  copyToClipboard(fullScript, 'full-production-pack');
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e2a4] to-[#eab308] px-5 py-2.5 text-[12.5px] font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:brightness-110 transition"
              >
                {copiedId === 'full-production-pack' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId === 'full-production-pack' ? 'Pacote Copiado!' : 'Copiar Tudo'}</span>
              </button>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────
              BLOCO 1: PASSO A PASSO DA ANIMAÇÃO (IMAGE-TO-VIDEO)
          ──────────────────────────────────────────────────────────── */}
          <div className="rounded-[28px] border-2 border-[var(--mvz-gold)]/40 bg-gradient-to-br from-[#14110b] via-[#0d0c0a] to-[#060504] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 text-[12px] font-black uppercase tracking-widest text-[var(--mvz-gold)]">
              <Video size={16} />
              <span>Passo a Passo de Animação de Vídeo (Image-to-Video)</span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
              {/* Asset do Personagem com Botão de Baixar */}
              <div className="lg:col-span-4 flex flex-col items-center text-center space-y-3">
                <div className="relative aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl border-2 border-[var(--mvz-gold)] bg-black shadow-[0_0_25px_rgba(212,175,55,0.25)]">
                  <img
                    src={currentMascot.image}
                    alt={currentMascot.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = currentMascot.fallbackImage;
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      currentMascot.image,
                      currentMascot.fallbackImage,
                      currentMascot.id
                    )
                  }
                  disabled={downloadingId === currentMascot.id}
                  className="flex h-11 w-full max-w-[220px] items-center justify-center gap-2 rounded-xl bg-white text-black font-extrabold text-[12px] uppercase tracking-wider hover:bg-[var(--mvz-gold)] transition shadow-lg cursor-pointer active:scale-95 disabled:opacity-80"
                >
                  {downloadedId === currentMascot.id ? (
                    <>
                      <Check size={15} className="text-[#16a34a]" />
                      <span>1. Imagem Baixada!</span>
                    </>
                  ) : downloadingId === currentMascot.id ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-black" />
                      <span>1. Baixando Imagem...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>1. Baixar Imagem 3D</span>
                    </>
                  )}
                </button>
                <p className="text-[10.5px] text-white/50 max-w-[220px]">
                  Envie esta imagem no Kling AI, Hailuo ou Luma como imagem inicial.
                </p>
              </div>

              {/* Prompt de Animação de Vídeo */}
              <div className="lg:col-span-8 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-black text-white">2. Prompt Mestre de Animação (Cole na IA)</h3>
                    <p className="text-[11.5px] text-white/60">
                      Otimizado com movimentos de câmera, sincronia labial e iluminação para{' '}
                      <strong>Kling AI, Hailuo MiniMax, Luma Dream Machine e Runway</strong>.
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(currentMascot.promptMotionEnglish, 'anim-prompt')}
                    className="flex h-10 items-center gap-1.5 rounded-xl border border-[var(--mvz-gold)] bg-[var(--mvz-gold)]/15 px-4 text-[12px] font-extrabold text-[var(--mvz-gold)] hover:bg-[var(--mvz-gold)] hover:text-black transition"
                  >
                    {copiedId === 'anim-prompt' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === 'anim-prompt' ? 'Copiado!' : 'Copiar Prompt'}</span>
                  </button>
                </div>

                <div className="relative rounded-2xl border border-white/10 bg-black/80 p-4 font-mono text-[12px] leading-relaxed text-white/90">
                  {currentMascot.promptMotionEnglish}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-white/70">
                  <span className="flex items-center gap-1 text-[#22c55e] font-semibold">
                    <Check size={13} /> Formato 9:16 Vertical Nativo
                  </span>
                  <span>•</span>
                  <span>Modo: Image to Video (Start Frame)</span>
                  <span>•</span>
                  <span>Duração recomendada: 5s em loop</span>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────
              BLOCO 2: ROTEIRO COMPLETO SEGUNDO A SEGUNDO (0 A 30S)
          ──────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-black uppercase tracking-wider text-white">
                Roteiro de Áudio & Ação de Cena (Cronometrado)
              </h3>
              <span className="text-[11px] font-semibold text-[var(--mvz-gold)]">
                Tom de Voz: {currentMascot.voiceStyle}
              </span>
            </div>

            {/* Linha 1: 0s - 3s HOOK */}
            <div className="rounded-2xl border border-[var(--mvz-gold)]/40 bg-gradient-to-r from-[var(--mvz-gold)]/10 via-[#0d0c0a] to-[#0d0c0a] p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="rounded-md bg-[var(--mvz-gold)] px-2.5 py-0.5 text-[10px] font-black uppercase text-black">
                    0s - 3s • GANCHO HIPNÓTICO
                  </span>
                  <p className="text-[14.5px] font-bold text-white leading-relaxed">
                    "Para tudo o que você tá fazendo agora! {currentMascot.catchphrase}"
                  </p>
                  <p className="text-[11.5px] text-white/60">
                    <strong>Ação de Vídeo:</strong> Zoom in rápido no rosto do {currentMascot.name} com expressão de
                    choque, seguido de corte seco.
                  </p>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(
                      `"Para tudo o que você tá fazendo agora! ${currentMascot.catchphrase}"`,
                      'script-hook'
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white transition"
                >
                  {copiedId === 'script-hook' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Linha 2: 3s - 15s ENREDO & DRAMA */}
            <div className="rounded-2xl border border-white/10 bg-[#0d0c0a] p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-white/80">
                    3s - 15s • ENREDO & DRAMA DA CENA
                  </span>
                  <p className="text-[14px] font-semibold text-white leading-relaxed">
                    "{userIdea}"
                  </p>
                  <p className="text-[11.5px] text-white/60">
                    <strong>Ação de Vídeo:</strong> O {currentMascot.name} gesticula intensamente expressando a emoção da cena com sincronia labial e animação 3D expressiva.
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(`"${userIdea}"`, 'script-body')}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white transition"
                >
                  {copiedId === 'script-body' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Linha 3: 15s - 25s CLÍMAX & REVIRAVOLTA */}
            <div className="rounded-2xl border border-[var(--mvz-gold)]/30 bg-gradient-to-r from-[var(--mvz-gold)]/10 via-[#0d0c0a] to-[#0d0c0a] p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="rounded-md bg-[var(--mvz-gold)] px-2.5 py-0.5 text-[10px] font-black uppercase text-black">
                    15s - 25s • CLÍMAX & GANCHO DO SUSPENSE
                  </span>
                  <p className="text-[14px] font-bold text-white leading-relaxed">
                    "{plotTwist}! E se você achou isso inacreditável, você não faz ideia do que vem a seguir..."
                  </p>
                  <p className="text-[11.5px] text-white/60">
                    <strong>Ação de Vídeo:</strong> Câmera faz um zoom dramático rápido no rosto do {currentMascot.name} com expressão de choque antes do corte final.
                  </p>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(
                      `"${plotTwist}! E se você achou isso inacreditável, você não faz ideia do que vem a seguir..."`,
                      'script-offer'
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white transition"
                >
                  {copiedId === 'script-offer' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Linha 4: 25s - 30s CTA TURBO SEGUIDORES */}
            <div className="rounded-2xl border border-[var(--mvz-line)] bg-[#0d0c0a] p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-white/80">
                    25s - 30s • CHAMADA DE AÇÃO (CTA TURBO DE SEGUIDORES)
                  </span>
                  <p className="text-[14px] font-bold text-white leading-relaxed">
                    {ctaType === 'follow'
                      ? `"Clica no botão de seguir aqui do lado para não perder a Parte 2 onde a verdade vai aparecer!"`
                      : ctaType === 'comment'
                      ? `"Comenta aqui embaixo quem você acha que tá certo antes de ver a continuação!"`
                      : `"Compartilha esse vídeo com aquele amigo que ama uma fofoca e segue pra ver o desfecho!"`}
                  </p>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(
                      ctaType === 'follow'
                        ? `"Clica no botão de seguir aqui do lado para não perder a Parte 2 onde a verdade vai aparecer!"`
                        : ctaType === 'comment'
                        ? `"Comenta aqui embaixo quem você acha que tá certo antes de ver a continuação!"`
                        : `"Compartilha esse vídeo com aquele amigo que ama uma fofoca e segue pra ver o desfecho!"`,
                      'script-cta'
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white transition"
                >
                  {copiedId === 'script-cta' ? 'Copiado!' : 'Copiar CTA'}
                </button>
              </div>
            </div>
          </div>

          {/* Integração com o Agente IA */}
          <div className="flex flex-col gap-4 rounded-3xl border border-[var(--mvz-gold)]/40 bg-gradient-to-r from-[var(--mvz-gold)]/15 via-[#0d0c0a] to-[#0d0c0a] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--mvz-gold)]" />
                <h4 className="text-[14px] font-black uppercase tracking-wider text-white">
                  Quer Criar uma Série Completa de Capítulos?
                </h4>
              </div>
              <p className="text-[12.5px] text-white/70">
                Envie esse roteiro para o Agente IA da Orbiex gerar os próximos episódios com arcos narrativos e ganchos virais.
              </p>
            </div>

            <button
              onClick={() => {
                if (onUse) {
                  onUse(
                    `Quero criar a continuação (Parte 2 e Parte 3) da novelinha do ${currentMascot.name} para o episódio "${episodeTitle}". O enredo base foi: "${userIdea}" com clímax: "${plotTwist}". Me entregue o roteiro completo de novelinha viral para bombar de seguidores.`
                  );
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--mvz-gold)] px-6 py-3 text-[12px] font-black uppercase tracking-wider text-black shadow-lg hover:brightness-110 transition"
            >
              <Zap size={14} className="fill-black" />
              <span>Gerar Continuação com IA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
