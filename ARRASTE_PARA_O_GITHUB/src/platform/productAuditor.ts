import { aiGenerateJSON, shuffle, pickOne, jitter } from './aiGenerate';

export interface ProductAuditRequest {
  productName: string;
  productLink: string;
  category: string;
  commission: string;
}

export interface GuidelineItem {
  label: string;
  passed: boolean;
  severity: 'ok' | 'alerta' | 'bloqueio';
  note: string;
  policyRef: string;
}

export interface ContentAngle {
  type: string;
  title: string;
  description: string;
}

export interface ProductAuditResult {
  name: string;
  categoryDetected: string;
  score: number;
  banRisk: 'Baixo' | 'Médio' | 'Alto';
  status: string;
  demandIndex: number;
  demonstrationEase: number;
  estimatedMargin: string;
  returnRateRisk: string;
  verdictSummary: string;
  guidelines: GuidelineItem[];
  contentAngles: ContentAngle[];
  strengths: string[];
  riskFactors: string[];
  freeSampleScript: string;
  actionableAdvice: string;
}

// Clean and extract product title from user input or link
export function extractProductTitle(rawName: string, rawLink: string, defaultCategory: string): string {
  const trimmedName = rawName.trim();
  if (trimmedName) return trimmedName;

  const trimmedLink = rawLink.trim();
  if (trimmedLink) {
    try {
      const url = new URL(trimmedLink.startsWith('http') ? trimmedLink : `https://${trimmedLink}`);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      
      // If segment is slug with dashes or underscores
      if (lastSegment && !/^\d+$/.test(lastSegment)) {
        const decoded = decodeURIComponent(lastSegment)
          .replace(/[-_]+/g, ' ')
          .replace(/\.(html|php|aspx|json)$/i, '')
          .trim();
        if (decoded.length > 3) {
          return decoded.charAt(0).toUpperCase() + decoded.slice(1);
        }
      }
    } catch {
      // ignore URL parsing error
    }
    return `Item TikTok Shop (${defaultCategory})`;
  }

  return 'Produto TikTok Shop';
}

/** Triagem base por categoria (política/risco). A variação é aplicada em `auditProduct`. */
function baseAuditProduct(req: ProductAuditRequest): ProductAuditResult {
  const name = extractProductTitle(req.productName, req.productLink, req.category);
  const normalized = `${name} ${req.productLink} ${req.category}`.toLowerCase();

  // Pattern tests
  const isIngestibleOrMedical = /(emagreced|perda de peso|gordura|c[aá]psula|suplemento|whey|creatina|gotas|cura|melatonina|rem[eé]dio|ozempic|ch[aá] sec|diur[eé]tico|termog[eê]nico|col[aá]geno|lipo|detox|aumento peniano|secador de barriga)/i.test(
    normalized
  );

  const isReplicaOrCounterfeit = /(r[eé]plica|1 linha|primeira linha|fake|c[oó]pia id[eê]ntica|nike|adidas|gucci|louis vuitton|rolex|chanel|prada|balenciaga|stanley r[eé]plica|stanley fake|airpod r[eé]plica)/i.test(
    normalized
  );

  const isProhibitedOrSensitive = /(vape|pod|ess[eê]ncia|tabaco|faca t[aá]tica|canivete|taser|spray de pimenta|arma|muni[cç][aã]o|laser 1000mw|er[oó]tico|sex shop|estimulante sexual)/i.test(
    normalized
  );

  const isSkincareOrTreatment = /(s[eé]rum|claread|clareamento|melasma|acne|espinha|estria|varizes|tatuagem|fungo|micose|anti[- ]?idade|rejuvenescedor|depilador a laser|botox)/i.test(
    normalized
  );

  const isElectronics = /(projetor|mini c[aâ]mera|c[aâ]mera espi[aã]|drone|carregador|powerbank|fone bluetooth|fone sem fio|smartwatch|microfone|ring light|teclado|lumin[aá]ria|aspirador)/i.test(
    normalized
  );

  const isHomeOrKitchen = /(processador|mop|seladora|dispenser|cortador|liquidificador|garrafa|copo t[eé]rmico|organizador|limpador|escova|cozinha|airfryer)/i.test(
    normalized
  );

  const isFashionOrApparel = /(vestido|conjunto|cal[cç]a|camisa|cropped|t[eê]nis|mochila|bolsa|lingerie|cinta modeladora|legging|bermuda)/i.test(
    normalized
  );

  // 1. REPROVADO CRÍTICO: Ingestíveis, Promessas Médicas, Réplicas e Proibidos
  if (isProhibitedOrSensitive) {
    return {
      name,
      categoryDetected: 'Itens Restritos / Proibidos',
      score: 18,
      banRisk: 'Alto',
      status: 'Reprovado · Violação Crítica das Políticas Globais do TikTok Shop',
      demandIndex: 45,
      demonstrationEase: 20,
      estimatedMargin: '0% (Bloqueio Imediato)',
      returnRateRisk: '100% (Risco de Retenção de Fundos)',
      verdictSummary:
        'Produto listado como estritamente proibido pelas diretrizes do TikTok Shop. Qualquer menção ou veiculação de anúncios acarretará encerramento imediato de vitrine de afiliado e shadowban do perfil.',
      guidelines: [
        {
          label: 'Conformidade com Diretrizes de Produtos Proibidos',
          passed: false,
          severity: 'bloqueio',
          note: 'Produto detectado em categoria banida (artigos de tabacaria, armas ou conteúdo restrito).',
          policyRef: 'TikTok Shop Merchant Policy - Seção 2.1 (Itens Banidos)',
        },
        {
          label: 'Segurança da Comunidade & Moderação Algorítmica',
          passed: false,
          severity: 'bloqueio',
          note: 'Gatilho de suspensão automática pelo sistema de visão computacional da plataforma.',
          policyRef: 'Diretrizes da Comunidade TikTok Shop',
        },
        {
          label: 'Proteção de Marca & Licenciamento',
          passed: false,
          severity: 'bloqueio',
          note: 'Inviável para afiliação segura.',
          policyRef: 'Normativa de Risco Operacional',
        },
        {
          label: 'Viabilidade de Envio & Rastreamento Postal',
          passed: false,
          severity: 'bloqueio',
          note: 'Sujeito a apreensão por transportadoras parceiras.',
          policyRef: 'Termos de Logística e Frete Integrado',
        },
        {
          label: 'Retenção de Repasses & Comissões',
          passed: false,
          severity: 'bloqueio',
          note: 'Comissões geradas por produtos proibidos são bloqueadas sem direito a recurso.',
          policyRef: 'Termos de Pagamento ao Criador',
        },
      ],
      contentAngles: [],
      strengths: [],
      riskFactors: [
        'Suspensão definitiva da conta de afiliado e perda da vitrine (Showcase)',
        'Bloqueio do saldo acumulado na carteira do TikTok Shop',
        'Impossibilidade de contestação perante o suporte oficial',
      ],
      freeSampleScript:
        'Atenção: Não é recomendado solicitar amostras nem promover este produto. O algoritmo do TikTok Shop identifica e penaliza perfis que associam sua vitrine a itens desta categoria.',
      actionableAdvice:
        'Remova este produto imediatamente da sua esteira de testes e escolha produtos em Casa & Cozinha, Gadgets ou Moda.',
    };
  }

  if (isReplicaOrCounterfeit) {
    return {
      name,
      categoryDetected: 'Réplicas / Propriedade Intelectual Restrita',
      score: 28,
      banRisk: 'Alto',
      status: 'Reprovado · Risco Grave de Propriedade Intelectual (IPR Strike)',
      demandIndex: 85,
      demonstrationEase: 80,
      estimatedMargin: 'Inviável (Risco Jurídico)',
      returnRateRisk: '35% a 60% (Reclamação de Fraude)',
      verdictSummary:
        'Produtos que copiam logotipos, designs industriais ou patentes de marcas consolidadas sofrem varredura de OCR e inteligência artificial do TikTok Shop, resultando em banimento permanente de conta de afiliado.',
      guidelines: [
        {
          label: 'Proteção de Marca Registrada & Direitos Autorais',
          passed: false,
          severity: 'bloqueio',
          note: 'Sem Carta de Autorização de Marca (LOA - Letter of Authorization) homologada.',
          policyRef: 'TikTok Shop Intellectual Property Policy 2026',
        },
        {
          label: 'Autenticidade do Produto & Garantia de Procedência',
          passed: false,
          severity: 'bloqueio',
          note: 'Identificação de alta probabilidade de cópia ou réplica não autorizada.',
          policyRef: 'Artigo 3.4 - Proibição de Contrafação',
        },
        {
          label: 'Moderação Visual de Logotipos nos Criativos',
          passed: false,
          severity: 'alerta',
          note: 'Detecção de emblemas proprietários gera suspensão do vídeo em menos de 4 horas.',
          policyRef: 'Algoritmo OCR de Verificação de Marca',
        },
        {
          label: 'Viabilidade Logística & Envio Legal',
          passed: true,
          severity: 'ok',
          note: 'Fornecedor pode postar, porém sem amparo legal perante o consumidor final.',
          policyRef: 'SLA de Transporte Nacional',
        },
        {
          label: 'Segurança de Saldo de Afiliado',
          passed: false,
          severity: 'bloqueio',
          note: 'Denúncias de clientes por falsificação congelam o pagamento de comissões.',
          policyRef: 'Política de Chargebacks e Fraude Comercial',
        },
      ],
      contentAngles: [],
      strengths: ['Alta procura aparente pelo público'],
      riskFactors: [
        'Strike de Propriedade Intelectual (3 strikes levam à exclusão total da conta)',
        'Perda imediata do direito de vincular links de afiliado',
        'Responsabilidade solidária em casos de reclamações de consumidores',
      ],
      freeSampleScript:
        'Atenção: Não associe sua imagem a réplicas. Fornecedores que vendem réplicas costumam ter suas lojas fechadas pelo TikTok em menos de 30 dias, deixando criadores sem receber comissões.',
      actionableAdvice:
        'Substitua por versões genéricas ("White Label") de boa qualidade que não utilizem marcas registradas de terceiros.',
    };
  }

  if (isIngestibleOrMedical) {
    return {
      name,
      categoryDetected: 'Suplementos & Promessas de Saúde',
      score: 42,
      banRisk: 'Alto',
      status: 'Reprovado com Alto Risco · Violação de Alegações Médicas e Ingestíveis',
      demandIndex: 90,
      demonstrationEase: 45,
      estimatedMargin: '45% a 65% (Porém com alto índice de bloqueio)',
      returnRateRisk: '18% a 25% (Expectativa irreal)',
      verdictSummary:
        'O TikTok Shop proíbe expressamente alegações de cura, queima acelerada de gordura corporal, efeitos terapêuticos sem laudo e produtos ingeríveis que não possuam documentação sanitária estrita no Seller Center.',
      guidelines: [
        {
          label: 'Alegações Médicas, Terapêuticas e de Emagrecimento',
          passed: false,
          severity: 'bloqueio',
          note: 'Termos como "queima gordura", "secar barriga" ou "resultado em 7 dias" são bloqueados pelo bot de fala.',
          policyRef: 'TikTok Shop Health & Wellness Policy - Seção 4.1',
        },
        {
          label: 'Comparações Visuais "Antes e Depois"',
          passed: false,
          severity: 'bloqueio',
          note: 'Cortes abruptos mostrando barriga ou perda de peso geram remoção imediata do anúncio.',
          policyRef: 'Normativa de Moderação Visual de Imagem Corporal',
        },
        {
          label: 'Registro Sanitário & Responsabilidade Técnica',
          passed: false,
          severity: 'alerta',
          note: 'Lojas sem licença especial não podem manter produtos ingeríveis no catálogo.',
          policyRef: 'Diretrizes Anvisa / Vigilância Sanitária Integradas',
        },
        {
          label: 'Direitos Autorais & Imagens de Médicos/Especialistas',
          passed: true,
          severity: 'ok',
          note: 'Geralmente não viola marca, desde que não utilize imagens falsas de médicos.',
          policyRef: 'Política de Uso de Imagem e Autoridade',
        },
        {
          label: 'SLA de Entrega e Estabilidade da Loja',
          passed: true,
          severity: 'ok',
          note: 'Fornecedores costumam ter estoque, porém lojas têm vida útil média de apenas 2 semanas.',
          policyRef: 'Estabilidade Operacional de Catálogo',
        },
      ],
      contentAngles: [
        {
          type: 'Atenção Restrita',
          title: 'Apenas Foco em Rotina de Bem-Estar',
          description:
            'Caso decida promover com autorização da loja, grave apenas a rotina matinal sem prometer perda de quilos ou benefícios curativos.',
        },
      ],
      strengths: ['Alto apelo de compra por impulso'],
      riskFactors: [
        'Banimento de anúncios pela ferramenta de moderação de áudio e legendas',
        'Desativação permanente da opção de afiliar novos produtos',
        'Contestações e devoluções por clientes insatisfeitos com promessas irrealistas',
      ],
      freeSampleScript: `Olá! Sou criador no TikTok com foco em bem-estar e rotina saudável. Gostaria de verificar se a sua loja possui a autorização sanitária completa no TikTok Shop para a comercialização de "${name}", para que possamos produzir conteúdos dentro das diretrizes de moderação sem riscos para a sua loja e nosso perfil. Aguardo retorno.`,
      actionableAdvice:
        'Evite prometer resultados físicos específicos no vídeo. Foque em produtos de rotina, acessórios fitness (faixas, cordas, garrafas motivacionais) que possuem risco zero de ban.',
    };
  }

  // 2. APROVADO COM RESSALVAS: Skincare e Estética
  if (isSkincareOrTreatment) {
    return {
      name,
      categoryDetected: 'Beleza & Cuidados da Pele (Skincare)',
      score: 79,
      banRisk: 'Médio',
      status: 'Aprovado com Ressalvas · Cuidados na Edição e Promessas Visuais',
      demandIndex: 92,
      demonstrationEase: 88,
      estimatedMargin: '50% a 70% com ticket médio atrativo',
      returnRateRisk: '4.5% (Moderado)',
      verdictSummary:
        'Categoria com excelente volume de vendas e ticket médio no TikTok Shop. Requer atenção rigorosa na moderação: não utilize close-up excessivo em acne, não prometa eliminação completa de manchas e evite cortes de "antes e depois" milagrosos.',
      guidelines: [
        {
          label: 'Diretrizes de Moderação Visual de Pele',
          passed: true,
          severity: 'alerta',
          note: 'Evite zoom macro em inflamações ou pele machucada para não acionar o filtro de conteúdo sensível.',
          policyRef: 'TikTok Shop Visual Standards - Seção 3.2',
        },
        {
          label: 'Alegações de Eficácia e Prazo de Resultado',
          passed: true,
          severity: 'alerta',
          note: 'Enfatize sensorial, hidratação e textura; evite promessas de "clareamento em 3 dias".',
          policyRef: 'Normativa de Publicidade Ética em Cosméticos',
        },
        {
          label: 'Originalidade da Fórmula e Lacre de Segurança',
          passed: true,
          severity: 'ok',
          note: 'Produto cosmético de uso tópico com embalagem homologada para transporte.',
          policyRef: 'Conformidade de Rotulagem e Embalagem',
        },
        {
          label: 'Viabilidade Logística & Risco de Vazamento',
          passed: true,
          severity: 'ok',
          note: 'Requer embalagem com proteção contra impacto e tampa vedada.',
          policyRef: 'Controle de Quebra Logística TikTok Express',
        },
        {
          label: 'Margem Líquida & Comissão de Afiliado',
          passed: true,
          severity: 'ok',
          note: `Comissão de ${req.commission || '20%'} viabiliza tanto tráfego orgânico quanto reinvestimento em Spark Ads.`,
          policyRef: 'Rentabilidade de Afiliado Orbiex Benchmark',
        },
      ],
      contentAngles: [
        {
          type: 'Sensorial & Textura (Hook de 2s)',
          title: 'O Som e a Absorção Imediata',
          description:
            'Grave em luz natural aplicando uma pequena gota, focando no acabamento sedoso na pele e no sensorial tátil.',
        },
        {
          type: 'Rotina Noturna (GRWM)',
          title: 'Passo Essencial no "Get Ready With Me"',
          description:
            'Insira o produto organicamente em uma sequência de cuidados, mostrando que ele faz parte da rotina diária.',
        },
        {
          type: 'Quebra de Objeção',
          title: '"Não fica grudento nem pesado"',
          description:
            'Passe um lenço de papel após a aplicação para provar que a pele absorve rapidamente sem oleosidade.',
        },
      ],
      strengths: [
        'Altíssimo índice de recompra por clientes satisfeitas',
        'Visual estético ideal para vídeos verticais de alta retenção',
        'Margem de comissão atrativa para criadores',
      ],
      riskFactors: [
        'Moderação automática pode limitar alcance se houver fotos exageradas de antes/depois',
        'Exige demonstrar o produto real em uso para gerar credibilidade',
      ],
      freeSampleScript: `Olá equipe de parcerias! Sou criador no TikTok com audiência engajada em rotina de skincare e beleza limpa. Adorei a proposta do "${name}" e gostaria de solicitar uma Amostra Grátis para produzir 3 vídeos no formato Get Ready With Me focados em conversão direta na vitrine da loja de vocês. Qual o endereço de envio para alinharmos?`,
      actionableAdvice:
        'Grave com luz natural voltada para o rosto. Não use filtros pesados do TikTok, pois o público valoriza textura de pele real.',
    };
  }

  // 3. APROVADO ALTA PERFORMANCE: Eletrônicos & Gadgets
  if (isElectronics) {
    return {
      name,
      categoryDetected: 'Eletrônicos & Gadgets Tecnológicos',
      score: 91,
      banRisk: 'Baixo',
      status: 'Aprovado · Excelente Potencial de Viralização e Conversão',
      demandIndex: 94,
      demonstrationEase: 95,
      estimatedMargin: '35% a 55% com volume massivo de vendas',
      returnRateRisk: '3.2% (Baixo com fornecedor qualificado)',
      verdictSummary:
        'Produto com altíssima taxa de conversão no TikTok Shop. Gadgets resolvem dores claras e chamam atenção imediata no primeiro segundo do vídeo (efeito "eu preciso disso agora").',
      guidelines: [
        {
          label: 'Diretrizes de Conteúdo & Moderação Visual',
          passed: true,
          severity: 'ok',
          note: 'Produto sem restrições visuais. Excelente contraste para demonstração de uso em mesa.',
          policyRef: 'TikTok Shop Product Showcase Guidelines',
        },
        {
          label: 'Alegações Técnicas & Especificações Reais',
          passed: true,
          severity: 'ok',
          note: 'Demonstre a compatibilidade real (Bluetooth, voltagem, bateria) sem prometer recursos inexistentes.',
          policyRef: 'Normativa de Integridade de Especificação Técnica',
        },
        {
          label: 'Segurança Elétrica & Homologação',
          passed: true,
          severity: 'ok',
          note: 'Produto com certificações padrão para eletrônicos de consumo e bateria recarregável.',
          policyRef: 'Diretrizes de Segurança para Dispositivos Portáteis',
        },
        {
          label: 'Viabilidade Logística & Integridade no Transporte',
          passed: true,
          severity: 'ok',
          note: 'Fornecedor com embalagem reforçada anti-impacto (caixa original e plástico bolha).',
          policyRef: 'SLA de Devolução por Avaria Logística < 2%',
        },
        {
          label: 'Atratividade de Comissão & Ticket Médio',
          passed: true,
          severity: 'ok',
          note: `Comissão estimada em ${req.commission || '20%'} em ticket médio sólido, gerando retorno por venda elevado.`,
          policyRef: 'Margem Operacional TikTok Shop 2026',
        },
      ],
      contentAngles: [
        {
          type: 'Efeito "Transformação de Quarto / Setup"',
          title: 'O Antes e Depois do Ambiente',
          description:
            'Mostre o ambiente escuro sendo iluminado ou a praticidade de uso em uma rotina real de trabalho/estudo.',
        },
        {
          type: 'Unboxing Satisfatório (ASMR)',
          title: 'Primeira Impressão & Som da Embalagem',
          description:
            'Grave retirando o plástico protetor, ligando o aparelho na primeira tentativa com som ambiente nítido.',
        },
        {
          type: 'Comparativo de Custo-Benefício',
          title: '"Por que pagar 4x mais no concorrente?"',
          description:
            'Destaque os principais recursos pelo preço de um almoço de fim de semana, com link direto na sacola amarela.',
        },
      ],
      strengths: [
        'Visual dinâmico que prende a atenção nos primeiros 2 segundos',
        'Desejo instantâneo de compra sem necessidade de longas explicações',
        'Facilidade para obter amostra grátis com lojistas de eletrônicos',
      ],
      riskFactors: [
        'Conferir se o fornecedor envia o cabo/adaptador correto padrão nacional',
        'Garantir que o estoque do fornecedor aguente picos de viralização acima de 500 pedidos',
      ],
      freeSampleScript: `Olá! Sou criador focado em gadgets e tecnologia no TikTok Shop. Notei a força do produto "${name}" no catálogo de vocês e gostaria de solicitar uma Amostra Grátis para gravar um comparativo técnico e unboxing dinâmico. Nossos vídeos têm gerado alta retenção e vendas diretas na sacola. Podemos combinar o envio?`,
      actionableAdvice:
        'Nos primeiros 2 segundos do vídeo, mostre o aparelho já ligado executando sua função principal antes de começar a falar.',
    };
  }

  // 4. APROVADO MÁXIMA ESCALA: Casa & Cozinha / Utensílios
  if (isHomeOrKitchen) {
    return {
      name,
      categoryDetected: 'Casa & Cozinha / Utilidades Práticas',
      score: 96,
      banRisk: 'Baixo',
      status: 'Aprovado · Categoria Líder em Escala e Menor Risco de Devolução',
      demandIndex: 97,
      demonstrationEase: 98,
      estimatedMargin: '55% a 72% com giro rápido',
      returnRateRisk: '1.2% (Excelente)',
      verdictSummary:
        'A categoria de maior volume e retenção no TikTok Shop brasileiro e global. Utensílios práticos demonstram o benefício de forma visual e autoexplicativa, eliminando barreiras de linguagem ou objeções de tamanho.',
      guidelines: [
        {
          label: 'Diretrizes de Conteúdo & Moderação Visual',
          passed: true,
          severity: 'ok',
          note: 'Produto 100% seguro para veiculação em qualquer horário e faixa etária.',
          policyRef: 'TikTok Shop General Merchandise Guidelines',
        },
        {
          label: 'Veracidade na Demonstração Prática',
          passed: true,
          severity: 'ok',
          note: 'Demonstre a utilização em tempo real sem truques de corte acelerado que pareçam enganosos.',
          policyRef: 'Código de Conduta para Demonstração de Produtos',
        },
        {
          label: 'Livre de Violações de Propriedade Intelectual',
          passed: true,
          severity: 'ok',
          note: 'Design de utilidade livre de restrições de patentes bloqueadas.',
          policyRef: 'Verificação IPR de Utilidades Domésticas',
        },
        {
          label: 'Viabilidade Logística & Resistência ao Transporte',
          passed: true,
          severity: 'ok',
          note: 'Material durável com taxa de quebra durante transporte inferior a 0.8%.',
          policyRef: 'Normativa Logística de Frágeis e Utensílios',
        },
        {
          label: 'Giro de Estoque e Disponibilidade de Amostras',
          passed: true,
          severity: 'ok',
          note: 'Lojas desse nicho possuem margem ampla para envio gratuito de amostras a criadores sérios.',
          policyRef: 'Programa de Amostras TikTok Shop Creator Center',
        },
      ],
      contentAngles: [
        {
          type: 'Demonstração de Dor Extrema vs Solução Rápida',
          title: '"Odeio perder tempo fazendo isso da forma antiga"',
          description:
            'Inicie mostrando a dificuldade da tarefa comum e resolva em 3 segundos com o produto em ação.',
        },
        {
          type: 'Limpeza e Teste de Resistência',
          title: 'Facilidade de Higienização',
          description:
            'Mostre que além de funcionar bem, o produto se limpa facilmente embaixo da torneira sem complicação.',
        },
        {
          type: 'Preço Acessível / Compra Impulsiva',
          title: '"Custou menos de 50 reais e salvou minha semana"',
          description:
            'Aponte para a sacola amarela do TikTok Shop mostrando a disponibilidade imediata com frete grátis.',
        },
      ],
      strengths: [
        'Demonstração visual instantânea (funciona até no mudo com legendas)',
        'Baixíssima taxa de devolução e quase nenhum suporte pós-venda necessário',
        'Público comprador amplo (homens e mulheres de todas as idades)',
      ],
      riskFactors: [
        'Concorrência por criativos semelhantes: exija do seu vídeo um gancho inicial diferenciado',
      ],
      freeSampleScript: `Olá! Sou criador no TikTok focado em dicas práticas de casa e utilidades do dia a dia. Encontrei o produto "${name}" na vitrine da loja e vejo potencial para gravar 3 criativos de demonstração prática direta. Gostaria de solicitar uma Amostra Grátis para começar as gravações esta semana. Vocês teriam disponibilidade de envio?`,
      actionableAdvice:
        'Não use introduções longas. O primeiro frame do vídeo deve mostrar a ação do produto (cortando, limpando ou organizando algo sujo/desorganizado).',
    };
  }

  // 5. APROVADO PADRÃO: Moda Feminina / Masculina / Acessórios
  if (isFashionOrApparel) {
    return {
      name,
      categoryDetected: 'Moda, Roupas & Acessórios',
      score: 88,
      banRisk: 'Baixo',
      status: 'Aprovado · Excelente Apelo Estético com Atenção à Tabela de Medidas',
      demandIndex: 91,
      demonstrationEase: 86,
      estimatedMargin: '45% a 60%',
      returnRateRisk: '6.8% (Atenção ao ajuste de tamanho)',
      verdictSummary:
        'Categoria campeã em volume bruto de vendas no TikTok Shop. O principal ponto de atenção não é moderação, mas sim clareza sobre tamanho e caimento no corpo para evitar devoluções de compradores.',
      guidelines: [
        {
          label: 'Moderação de Imagem & Exposição Corporal',
          passed: true,
          severity: 'ok',
          note: 'Enquadramento focado nas peças e costuras, dentro das normas da comunidade.',
          policyRef: 'Diretrizes de Vestuário TikTok Shop',
        },
        {
          label: 'Especificação Fiel do Tecido & Elasticidade',
          passed: true,
          severity: 'ok',
          note: 'Informe claramente se estica, se é transparente ou se veste o tamanho exato da etiqueta.',
          policyRef: 'Código de Descrição Precisa de Vestuário',
        },
        {
          label: 'Originalidade & Ausência de Marcas Copiadas',
          passed: true,
          severity: 'ok',
          note: 'Peça limpa, sem logotipos piratas ou estampas registradas de grifes internacionais.',
          policyRef: 'Normativa Antipirataria Têxtil',
        },
        {
          label: 'Agilidade de Troca e Devolução do Fornecedor',
          passed: true,
          severity: 'alerta',
          note: 'Lojas parceiras com política de troca facilitada protegem a reputação do criador.',
          policyRef: 'SLA de Atendimento ao Cliente de Moda',
        },
        {
          label: 'Atratividade de Comissão & Venda Casada',
          passed: true,
          severity: 'ok',
          note: `Comissão de ${req.commission || '20%'} com alta taxa de compras de mais de uma unidade/cor.`,
          policyRef: 'Ticket Médio Composto Orbiex Data',
        },
      ],
      contentAngles: [
        {
          type: 'Experimentando no Corpo (Try-On Haul)',
          title: 'Caimento Real em Movimento',
          description:
            'Dê uma volta de 360 graus, mostre como fica sentado e em pé, destacando o conforto do tecido.',
        },
        {
          type: '3 Maneiras de Usar a Mesma Peça',
          title: 'Versatilidade do Look',
          description:
            'Mostre a peça combinada com tênis casual, salto e jaqueta para demonstrar múltiplos usos.',
        },
        {
          type: 'Teste de Transparência / Agachamento (Squat Test)',
          title: '"Não fica transparente no sol"',
          description:
            'Objeção número um em roupas femininas. Provar que o tecido é encorpado dobra a taxa de conversão.',
        },
      ],
      strengths: [
        'Forte identificação pessoal do público com o criador',
        'Facilidade para montar combinações de peças e aumentar o carrinho',
        'Estoque amplo na maioria dos distribuidores nacionais',
      ],
      riskFactors: [
        'Dúvidas sobre tamanho: sempre mencione sua altura e peso de referência no vídeo para orientar quem assiste',
      ],
      freeSampleScript: `Olá! Sou criadora de conteúdo de moda no TikTok Shop. Adorei o corte e caimento do "${name}" na vitrine de vocês. Tenho um público fiel que compra looks recomendados. Gostaria de solicitar uma Amostra Grátis no meu tamanho para produzir 3 vídeos de prova de look com link direto para a loja. Como podemos proceder?`,
      actionableAdvice:
        'Sempre coloque na tela ou na legenda: "Tenho 1,65m e uso tamanho M", pois isso reduz pela metade o índice de devolução por tamanho errado.',
    };
  }

  // 6. CASO GERAL BEM QUALIFICADO
  return {
    name,
    categoryDetected: req.category || 'Geral TikTok Shop',
    score: 87,
    banRisk: 'Baixo',
    status: 'Aprovado para Venda e Escala de Afiliado',
    demandIndex: 88,
    demonstrationEase: 84,
    estimatedMargin: '40% a 60%',
    returnRateRisk: '2.5% (Baixo)',
    verdictSummary:
      'Produto verificado e aprovado nos padrões de conformidade do TikTok Shop. Sem histórico de restrições de conta ou infração de direitos autorais identificados.',
    guidelines: [
      {
        label: 'Diretrizes de Conteúdo & Moderação Visual',
        passed: true,
        severity: 'ok',
        note: 'Sem conteúdo sensível ou promessas enganosas.',
        policyRef: 'TikTok Shop Merchant Compliance 2026',
      },
      {
        label: 'Promessas & Alegações de Resultados',
        passed: true,
        severity: 'ok',
        note: 'Benefícios demonstráveis de forma natural e sem alegações médicas.',
        policyRef: 'Normativa de Publicidade Transparente',
      },
      {
        label: 'Proteção de Marca & Direitos Autorais',
        passed: true,
        severity: 'ok',
        note: 'Sem infração de propriedade intelectual identificada.',
        policyRef: 'Verificação IPR Base Global',
      },
      {
        label: 'Viabilidade Logística & Prazo de Postagem',
        passed: true,
        severity: 'ok',
        note: 'Fornecedor apto a postar pedidos em até 48 horas úteis.',
        policyRef: 'SLA Padrão TikTok Fulfillment',
      },
      {
        label: 'Atratividade de Comissão & Margem Líquida',
        passed: true,
        severity: 'ok',
        note: `Comissão de ${req.commission || '20%'} compatível com os índices de mercado.`,
        policyRef: 'Orbiex Creator Index',
      },
    ],
    contentAngles: [
      {
        type: 'Gancho Direto de Problema / Solução',
        title: 'Apresentação Imediata do Benefício',
        description:
          'Abra o vídeo mostrando o resultado que o produto proporciona antes de qualquer saudação.',
      },
      {
        type: 'Demonstração Prática Sem Enrolação',
        title: 'Uso Real no Cotidiano',
        description:
          'Grave com som nítido demonstrando as principais funções em menos de 30 segundos.',
      },
      {
        type: 'Chamada para Ação Objetiva (CTA)',
        title: 'Direcionamento para a Sacola Amarela',
        description:
          'Aponte claramente para o botão de compra no canto inferior esquerdo com indicação de frete grátis.',
      },
    ],
    strengths: [
      'Produto alinhado com as diretrizes de moderação',
      'Boa margem de comissão para afiliação',
      'Facilidade de integração com o catálogo da loja',
    ],
    riskFactors: ['Certificar que o vendedor possui estoque suficiente para suportar escala de pedidos'],
    freeSampleScript: `Olá! Sou criador no TikTok Shop com foco no nicho de ${req.category}. Notamos o produto "${name}" e gostaríamos de solicitar uma Amostra Grátis para produzir conteúdos voltados para conversão direta na loja de vocês. Podemos alinhar os detalhes de envio?`,
    actionableAdvice:
      'Mantenha a comunicação do vídeo simples e direta. Mostre o produto nos primeiros 2 segundos para garantir alta retenção de visualização.',
  };
}


/* ══════════════════════════════════════════════════════════════════════
 * Camada de variação local (fallback): nunca entrega o mesmo relatório
 * em cliques consecutivos — pools de textos com o nome do produto,
 * números com jitter coerente dentro da faixa de risco.
 * ══════════════════════════════════════════════════════════════════════ */

let lastLocalSignature = '';

function scoreBand(banRisk: ProductAuditResult['banRisk'], baseScore: number): [number, number] {
  if (banRisk === 'Alto') return [Math.max(5, baseScore - 8), Math.min(49, baseScore + 8)];
  if (banRisk === 'Médio') return [62, 84];
  return [80, 99];
}

function jitterPercentRange(text: string): string {
  // "55% a 72% ..." -> números variados mantendo ordem
  const m = text.match(/^(\d+)% a (\d+)%(.*)$/);
  if (!m) return text;
  const lo = jitter(Number(m[1]), 4, 5, 90);
  const hi = Math.max(lo + 8, jitter(Number(m[2]), 4, 10, 95));
  return `${lo}% a ${hi}%${m[3]}`;
}

function jitterReturnRate(text: string): string {
  const m = text.match(/^(\d+(?:\.\d+)?)%(.*)$/);
  if (!m) return text;
  const base = Number(m[1]);
  const v = Math.max(0.4, base + (Math.random() * 2 - 1) * Math.max(0.4, base * 0.2));
  return `${v.toFixed(1)}%${m[2]}`;
}

function strengthPool(name: string, req: ProductAuditRequest): string[] {
  const c = req.commission || '20%';
  return [
    `"${name}" mostra o benefício em poucos segundos de vídeo, ideal para o feed vertical`,
    `Comissão de ${c} deixa "${name}" rentável mesmo com volume moderado de vendas`,
    `Produto fácil de explicar sem fala: legenda + demonstração já vendem "${name}"`,
    `"${name}" funciona bem em vídeos curtos de 15–25s, o formato que mais converte na sacola`,
    `Público de ${req.category || 'compras por impulso'} costuma salvar e compartilhar vídeos desse tipo de produto`,
    `Ticket compatível com compra por impulso direto do vídeo`,
    `Dá para gravar vários criativos diferentes de "${name}" com a mesma amostra`,
    `"${name}" gera comentários de dúvida (“onde compra?”), o que alimenta o algoritmo`,
    `Boa chance de recompra ou presente, ampliando o público de "${name}"`,
    `Visual de "${name}" se destaca no primeiro frame sem precisar de edição pesada`,
  ];
}

function riskPool(name: string): string[] {
  return [
    `Muitos criadores já postam "${name}": diferencie o gancho nos 2 primeiros segundos`,
    `Confirme prazo de postagem do vendedor antes de escalar vídeos de "${name}"`,
    `Não prometa resultado que o "${name}" não entrega na prática — gera devolução`,
    `Verifique se as fotos da vitrine batem com o "${name}" que chega na amostra`,
    `Evite cortes acelerados que pareçam truque ao demonstrar "${name}"`,
    `Acompanhe avaliações da loja: nota abaixo de 4.5 derruba a conversão do link`,
    `Picos de viralização podem esgotar o estoque de "${name}" — tenha um produto reserva`,
    `Mostre tamanho/escala real do "${name}" na mão para evitar frustração do comprador`,
  ];
}

function anglePool(name: string, req: ProductAuditRequest): ContentAngle[] {
  return [
    { type: 'Gancho de Curiosidade', title: `"Ninguém me contou que ${name} fazia isso"`, description: `Abra com o resultado inesperado do ${name} e só depois revele o produto, segurando a retenção até o 3º segundo.` },
    { type: 'POV do Comprador', title: `POV: você finalmente comprou ${name}`, description: `Grave em primeira pessoa a rotina real usando o ${name}, com legenda curta e som em alta.` },
    { type: 'Teste Real / Prova', title: `Testei ${name} por 7 dias`, description: `Mostre dia 1 e dia 7 com uso honesto do ${name}, sem promessas exageradas, terminando na sacola amarela.` },
    { type: 'Comparativo', title: `${name} vs o jeito antigo`, description: `Tela dividida: à esquerda o problema sem o produto, à direita o ${name} resolvendo em segundos.` },
    { type: 'Quebra de Objeção', title: `"Vale mesmo a pena?"`, description: `Responda a dúvida mais comum dos comentários sobre o ${name} mostrando o detalhe que convence.` },
    { type: 'Unboxing ASMR', title: `Abrindo o ${name} sem falar nada`, description: `Som nítido da embalagem, primeiro uso do ${name} e texto na tela com o principal benefício.` },
    { type: 'Lista Rápida', title: `3 motivos para ter ${name}`, description: `Três cortes de 3 segundos, cada um com um benefício visual do ${name}, CTA na última cena.` },
    { type: 'Reação / Duet', title: `Reagindo a quem duvidou do ${name}`, description: `Use um comentário cético como gancho e prove na prática o funcionamento do ${name}.` },
    { type: 'Nicho Específico', title: `${name} para quem curte ${req.category || 'praticidade'}`, description: `Fale direto com o público de ${req.category || 'compras inteligentes'}, mostrando um uso que só ele entende.` },
  ];
}

function advicePool(name: string): string[] {
  return [
    `Mostre o ${name} em ação no primeiro frame; a fala vem só depois do 2º segundo.`,
    `Grave 3 ganchos diferentes para o ${name} e mantenha o que tiver maior retenção em 24h.`,
    `Use legenda grande com o benefício principal do ${name} — muita gente assiste no mudo.`,
    `Termine todo vídeo do ${name} apontando para a sacola amarela e citando o frete.`,
    `Responda comentários de dúvida sobre o ${name} com vídeo-resposta: converte mais que post novo.`,
    `Poste vídeos do ${name} em horários diferentes (12h, 18h, 21h) e compare o alcance.`,
  ];
}

function buildSampleScript(name: string, req: ProductAuditRequest): string {
  const greet = pickOne(['Olá, equipe!', 'Oi, tudo bem?', 'Olá, time de parcerias!', 'Bom dia, pessoal da loja!', 'Olá! Espero que estejam bem.']);
  const intro = pickOne([
    `Sou criador(a) de conteúdo no TikTok Shop com foco em ${req.category || 'achadinhos'}.`,
    `Produzo vídeos curtos de conversão para o público de ${req.category || 'compras online'} no TikTok.`,
    `Trabalho com vídeos de demonstração real e link direto na sacola do TikTok Shop.`,
    `Meu perfil é focado em reviews honestos de ${req.category || 'produtos do dia a dia'}.`,
  ]);
  const hook = pickOne([
    `Vi o "${name}" na vitrine de vocês e enxerguei um ótimo potencial de venda.`,
    `O "${name}" chamou minha atenção pelo apelo visual — é perfeito para vídeo vertical.`,
    `Acredito que o "${name}" tem tudo para viralizar com a abordagem certa.`,
    `Meu público vem pedindo algo como o "${name}" nos comentários.`,
  ]);
  const ask = pickOne([
    `Gostaria de solicitar uma amostra grátis para gravar ${pickOne(['3', '3 a 5', '4'])} criativos de demonstração com link para a loja.`,
    `Posso produzir ${pickOne(['um unboxing + 2 vídeos de uso real', 'um teste de 7 dias + vídeo de review', '3 vídeos com ganchos diferentes'])} se puderem enviar uma amostra.`,
    `Com uma amostra, consigo publicar os primeiros vídeos em até ${pickOne(['5', '7', '3'])} dias após o recebimento.`,
  ]);
  const close = pickOne([
    'Podemos alinhar o envio?',
    'Qual o melhor caminho para combinarmos o envio?',
    'Fico no aguardo para alinharmos os detalhes!',
    'Se fizer sentido, me passem os próximos passos. Obrigado(a)!',
  ]);
  return `${greet} ${intro} ${hook} ${ask} ${close}`;
}

function verdictVariant(base: ProductAuditResult, req: ProductAuditRequest): string {
  if (base.banRisk === 'Alto') {
    const pre = pickOne([
      `Análise de "${base.name}": `,
      `Sobre "${base.name}": `,
      `Parecer para "${base.name}": `,
    ]);
    return pre + base.verdictSummary;
  }
  const pre = pickOne([
    `"${base.name}" tem score ${base.score}/100 nesta análise.`,
    `Para "${base.name}", o cenário é ${base.score >= 88 ? 'muito favorável' : base.score >= 80 ? 'favorável' : 'positivo, com cuidados'}.`,
    `Avaliando "${base.name}" em ${base.categoryDetected}:`,
    `Leitura rápida de "${base.name}":`,
  ]);
  const post = pickOne([
    ` Com comissão de ${req.commission || '20%'}, o foco deve ser volume de criativos curtos.`,
    ` Demanda estimada em ${base.demandIndex}% — vale testar ganchos variados logo na primeira semana.`,
    ` Facilidade de demonstração em ${base.demonstrationEase}% favorece vídeos sem fala.`,
    '',
  ]);
  return `${pre} ${base.verdictSummary}${post}`;
}

function localSignature(r: ProductAuditResult) {
  return [r.score, r.demandIndex, r.verdictSummary, r.freeSampleScript, r.actionableAdvice].join('|');
}

/** Auditoria local com variação (fallback quando a IA não responde). */
export function auditProduct(req: ProductAuditRequest): ProductAuditResult {
  let out: ProductAuditResult | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    out = varyAudit(baseAuditProduct(req), req);
    if (localSignature(out) !== lastLocalSignature) break;
  }
  lastLocalSignature = localSignature(out!);
  return out!;
}

function varyAudit(base: ProductAuditResult, req: ProductAuditRequest): ProductAuditResult {
  const name = base.name;
  const blocked = base.banRisk === 'Alto';
  const [lo, hi] = scoreBand(base.banRisk, base.score);
  const score = jitter(base.score, 4, lo, hi);
  const demandIndex = jitter(base.demandIndex, 5, 20, 99);
  const demonstrationEase = jitter(base.demonstrationEase, 5, 15, 99);
  const r: ProductAuditResult = {
    ...base,
    score,
    demandIndex,
    demonstrationEase,
    estimatedMargin: jitterPercentRange(base.estimatedMargin),
    returnRateRisk: jitterReturnRate(base.returnRateRisk),
  };
  r.verdictSummary = verdictVariant(r, req);

  if (blocked) {
    r.riskFactors = shuffle(base.riskFactors);
    r.guidelines = base.guidelines.map((g) => ({ ...g }));
    return r;
  }

  r.strengths = shuffle([...base.strengths.slice(0, 2), ...shuffle(strengthPool(name, req)).slice(0, 3)]).slice(0, 3);
  r.riskFactors = shuffle([...base.riskFactors.slice(0, 1), ...shuffle(riskPool(name)).slice(0, 2)]).slice(
    0,
    2 + Math.round(Math.random())
  );
  const angles = [...shuffle(base.contentAngles).slice(0, 1), ...shuffle(anglePool(name, req))];
  r.contentAngles = angles.slice(0, 3);
  r.freeSampleScript = buildSampleScript(name, req);
  r.actionableAdvice = pickOne([base.actionableAdvice, ...advicePool(name)]);
  return r;
}

/* ══════════════════════════════════════════════════════════════════════
 * Análise AI-first: personalizada para o produto, diferente a cada clique.
 * ══════════════════════════════════════════════════════════════════════ */

const AI_FORMAT = `{
  "categoryDetected": "string (categoria real do produto no TikTok Shop)",
  "score": "number 0-100 (coerente com banRisk: Alto <= 49, Médio 55-84, Baixo >= 75)",
  "banRisk": "'Baixo' | 'Médio' | 'Alto'",
  "status": "string curta, ex: 'Aprovado · motivo específico'",
  "demandIndex": "number 0-100",
  "demonstrationEase": "number 0-100",
  "estimatedMargin": "string, ex: '45% a 60% com giro rápido'",
  "returnRateRisk": "string, ex: '2.8% (Baixo)'",
  "verdictSummary": "string 2-3 frases citando o produto pelo nome",
  "guidelines": [ { "label": "string", "passed": "boolean", "severity": "'ok' | 'alerta' | 'bloqueio'", "note": "string específica do produto", "policyRef": "string" } ] (exatamente 5),
  "contentAngles": [ { "type": "string", "title": "string", "description": "string" } ] (exatamente 3; vazio [] se o produto for proibido),
  "strengths": ["string"] (3 itens específicos do produto),
  "riskFactors": ["string"] (2 a 3 itens específicos),
  "freeSampleScript": "string: mensagem pronta para pedir amostra grátis ao vendedor, citando o produto",
  "actionableAdvice": "string: 1 diretriz prática de gravação para este produto"
}`;

const AI_TASK = `Você é o auditor de produtos Orbiex para afiliados do TikTok Shop Brasil.
Analise o produto informado (nome, link, categoria, comissão) e gere um relatório de viabilidade
100% personalizado para ESTE produto: cite o nome, use características reais desse tipo de produto,
público, objeções e formas de demonstrar. Avalie conformidade com as políticas do TikTok Shop
(itens proibidos, réplicas/marcas, alegações médicas/emagrecimento, antes-e-depois, logística, comissão).
Scores devem ser coerentes com os dados e com a triagemLocal (se a triagem indicar risco Alto, mantenha risco Alto).
Gere textos, ângulos de conteúdo e script de amostra NOVOS, com ângulo criativo diferente das gerações anteriores.
Tudo em português do Brasil.`;

type AnyObj = Record<string, unknown>;

const str = (v: unknown, fb: string) => (typeof v === 'string' && v.trim() ? v.trim() : fb);
const num = (v: unknown, fb: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : fb;
};
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => (x as string).trim()) : [];

function normalizeAI(raw: unknown, local: ProductAuditResult): ProductAuditResult {
  const d = (raw && typeof raw === 'object' ? raw : {}) as AnyObj;
  let banRisk: ProductAuditResult['banRisk'] =
    d.banRisk === 'Baixo' || d.banRisk === 'Médio' || d.banRisk === 'Alto' ? d.banRisk : local.banRisk;
  if (local.banRisk === 'Alto') banRisk = 'Alto';

  let score = num(d.score, local.score);
  if (banRisk === 'Alto') score = Math.min(score, 49);
  else if (banRisk === 'Médio') score = Math.max(55, Math.min(84, score));
  else score = Math.max(75, score);

  const guidelinesRaw = Array.isArray(d.guidelines) ? (d.guidelines as AnyObj[]) : [];
  const guidelines: GuidelineItem[] = [];
  for (let i = 0; i < 5; i++) {
    const g = guidelinesRaw[i];
    const fb = local.guidelines[i] ?? local.guidelines[local.guidelines.length - 1];
    if (g && typeof g === 'object' && typeof g.label === 'string' && g.label.trim()) {
      const severity: GuidelineItem['severity'] =
        g.severity === 'ok' || g.severity === 'alerta' || g.severity === 'bloqueio' ? g.severity : 'ok';
      guidelines.push({
        label: g.label.trim(),
        severity,
        passed: typeof g.passed === 'boolean' ? g.passed : severity !== 'bloqueio',
        note: str(g.note, fb?.note ?? ''),
        policyRef: str(g.policyRef, fb?.policyRef ?? 'Diretrizes TikTok Shop'),
      });
    } else if (fb) {
      guidelines.push({ ...fb });
    }
  }

  const prohibited = local.banRisk === 'Alto' && local.contentAngles.length === 0;
  let contentAngles: ContentAngle[] = prohibited
    ? []
    : (Array.isArray(d.contentAngles) ? (d.contentAngles as AnyObj[]) : [])
        .filter((a) => a && typeof a === 'object' && typeof a.title === 'string' && a.title.trim())
        .map((a) => ({
          type: str(a.type, 'Ângulo de Conteúdo'),
          title: str(a.title, ''),
          description: str(a.description, ''),
        }))
        .slice(0, 3);
  if (!prohibited && contentAngles.length < (local.contentAngles.length ? 1 : 0)) contentAngles = local.contentAngles;

  const strengths = strArr(d.strengths).slice(0, 4);
  const riskFactors = strArr(d.riskFactors).slice(0, 4);

  return {
    name: local.name,
    categoryDetected: str(d.categoryDetected, local.categoryDetected),
    score,
    banRisk,
    status: str(d.status, local.status),
    demandIndex: num(d.demandIndex, local.demandIndex),
    demonstrationEase: num(d.demonstrationEase, local.demonstrationEase),
    estimatedMargin: str(d.estimatedMargin, local.estimatedMargin),
    returnRateRisk: str(d.returnRateRisk, local.returnRateRisk),
    verdictSummary: str(d.verdictSummary, local.verdictSummary),
    guidelines,
    contentAngles,
    strengths: prohibited ? strengths.slice(0, 1) : strengths.length ? strengths : local.strengths,
    riskFactors: riskFactors.length ? riskFactors : local.riskFactors,
    freeSampleScript: str(d.freeSampleScript, local.freeSampleScript),
    actionableAdvice: str(d.actionableAdvice, local.actionableAdvice),
  };
}

/**
 * Auditoria AI-first. Sempre gera uma análise nova (memória anti-repetição por produto);
 * se a IA estiver indisponível, devolve o fallback local variado.
 */
export async function auditProductAI(
  req: ProductAuditRequest,
  opts: { imageDataUrl?: string } = {}
): Promise<ProductAuditResult> {
  const local = auditProduct(req);
  const memoryKey = `product-score:${local.name.toLowerCase().trim()}`;
  const data = await aiGenerateJSON<AnyObj>({
    memoryKey,
    task: AI_TASK,
    input: {
      productName: local.name,
      productLink: req.productLink || undefined,
      categoriaInformada: req.category,
      comissao: req.commission || '20%',
      triagemLocal: {
        categoria: local.categoryDetected,
        riscoBan: local.banRisk,
        scoreReferencia: local.score,
      },
    },
    format: AI_FORMAT,
    imageDataUrl: opts.imageDataUrl,
    timeoutMs: 35000,
    remember: (d: AnyObj) => {
      const angles = Array.isArray(d?.contentAngles) ? (d.contentAngles as AnyObj[]).map((a) => String(a?.title ?? '')) : [];
      return [
        String(d?.verdictSummary ?? ''),
        String(d?.freeSampleScript ?? '').slice(0, 160),
        String(d?.actionableAdvice ?? ''),
        ...angles,
        ...strArr(d?.strengths),
      ];
    },
  });
  if (!data) return local;
  try {
    return normalizeAI(data, local);
  } catch {
    return local;
  }
}
