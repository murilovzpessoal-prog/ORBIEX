import { useRef, useEffect } from 'react';

const steps = [
  {
    num: "01",
    title: "Seja Bem Vindo",
    desc: "Comece sua jornada na Comunidade Oficial MVZ Shop e prepare-se para escalar.",
    image: "https://i.imgur.com/gVkllUv.png",
    tag: "Introdução"
  },
  {
    num: "02",
    title: "Nichos Virais",
    desc: "Descubra os nichos mais lucrativos e com maior potencial de viralização no momento.",
    image: "https://i.imgur.com/QYyMYTj.png",
    tag: "Estratégia"
  },
  {
    num: "03",
    title: "Comunidade WhatsApp",
    desc: "Acesso exclusivo ao nosso grupo de networking para troca de experiências e suporte.",
    image: "https://i.imgur.com/aoKfE0J.png",
    tag: "Networking"
  },
  {
    num: "04",
    title: "Flow Ultra",
    desc: "Aprenda a dominar o Flow Ultra para otimizar suas criações e edições.",
    image: "https://i.imgur.com/SkVGLnJ.png",
    tag: "Edição"
  },
  {
    num: "05",
    title: "Escolhendo Seus Produtos",
    desc: "Critérios essenciais para selecionar os produtos vencedores que vão explodir em vendas.",
    image: "https://i.imgur.com/v3eRNNp.png",
    tag: "Mineração"
  },
  {
    num: "06",
    title: "Algoritmo do TikTok Shop",
    desc: "Entenda como o algoritmo funciona para posicionar seus vídeos no topo e vender mais.",
    image: "https://i.imgur.com/Ypuzwh0.png",
    tag: "Algoritmo"
  },
  {
    num: "07",
    title: "Estrutura Validada",
    desc: "O passo a passo da estrutura que testamos e validamos para garantir consistência.",
    image: "https://i.imgur.com/KNRH1Yn.png",
    tag: "Processos"
  },
  {
    num: "08",
    title: "1K em 30 Dias",
    desc: "Plano de ação focado em resultado acelerado para você atingir seus primeiros mil reais.",
    image: "https://i.imgur.com/PNZra7R.png",
    tag: "Desafio"
  },
  {
    num: "09",
    title: "Módulo Bônus",
    desc: "Conteúdos extras e surpresas exclusivas para impulsionar ainda mais sua operação.",
    image: "https://i.imgur.com/hunqJe8.png",
    tag: "Bônus"
  },
  {
    num: "10",
    title: "Bônus Avatar Dançando",
    desc: "Crie avatares dinâmicos que engajam e geram conexão instantânea com o público.",
    image: "https://i.imgur.com/WHkCwbX.png",
    tag: "Bônus"
  },
  {
    num: "11",
    title: "Bônus Motion",
    desc: "Técnicas de motion graphics para deixar seus criativos hiper atrativos.",
    image: "https://i.imgur.com/EOrLRjM.png",
    tag: "Bônus"
  },
  {
    num: "12",
    title: "Reuniões Gravadas",
    desc: "Acesso ao acervo de mentorias e reuniões gravadas para você estudar quando quiser.",
    image: "https://i.imgur.com/faaXDko.png",
    tag: "Acervo"
  }
];

export default function WorkflowSteps() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

  useEffect(() => {
    let animationId: number;
    
    const scroll = () => {
      if (scrollRef.current && !isPaused.current) {
        scrollRef.current.scrollLeft += 1.5; // Ajuste fino da velocidade
        
        // Loop infinito: quando atingir a metade do tamanho total (exatamente no fim dos itens originais)
        if (scrollRef.current.scrollLeft >= scrollRef.current.scrollWidth / 2) {
          scrollRef.current.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <section id="how-it-works" className="pt-12 pb-24 md:pt-20 md:pb-32 relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-900 to-gray-500">
            Do zero ao resultado
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mt-4 md:mt-6">
            Veja exatamente o que você vai aprender em cada módulo e como aplicar na prática.
          </p>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-6 md:gap-8 pb-10 px-1"
          onMouseEnter={() => isPaused.current = true}
          onMouseLeave={() => isPaused.current = false}
          onTouchStart={() => isPaused.current = true}
          onTouchEnd={() => isPaused.current = false}
        >
          {[...steps, ...steps].map((step, index) => (
            <div key={index} className="flex flex-col self-stretch w-[85vw] md:w-[400px] shrink-0">
              <div className="flex-1 relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gray-50 border border-gray-200 min-h-[380px] md:min-h-[420px] flex flex-col justify-between shadow-lg">
                <div className="p-8 md:p-10 relative z-20 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-5xl md:text-6xl font-bold text-gray-200 font-sans tracking-tighter">
                      {step.num}
                    </span>
                    <div className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-500 backdrop-blur-md">
                      {step.tag}
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base max-w-sm">
                    {step.desc}
                  </p>
                </div>
                <div className="w-full shrink-0 flex justify-center pb-6 md:pb-8">
                  <div 
                    className="relative w-[85%] md:w-[75%] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-gray-100 bg-white shadow-lg"
                    style={{ aspectRatio: '4/5' }}
                  >
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-100" 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
        <svg className="relative block w-full h-[50px] md:h-[70px] text-[#050505]" viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L200,0 C240,0 260,50 300,50 L1140,50 C1180,50 1200,0 1240,0 L1440,0 V70 H0 V0Z" fill="currentColor"></path>
        </svg>
      </div>
    </section>
  );
}
