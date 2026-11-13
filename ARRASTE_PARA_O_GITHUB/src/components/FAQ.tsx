import { useState } from 'react';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
  
    const faqs = [
      {
        question: "Como eu acho os produtos para vender?",
        answer: "Dentro da Comunidade MVZ, você terá acesso ao grupo de produtos, onde você terá acesso aos produtos validados que estão em alta dentro do TikTok Shop."
      },
      {
        question: "Preciso aparecer nos vídeos?",
        answer: "Não! Na Comunidade MVZ nós ensinamos o passo a passo completo de como faturar com Perfis Dark. Você vai aprender a vender muito sem precisar mostrar o rosto, utilizando estratégias validadas de edição e até mesmo como criar a sua própria influenciadora virtual ultra-realista usando inteligência artificial."
      },
      {
        question: "Isso funciona apenas para o TikTok Shop?",
        answer: "Embora o nosso foco principal seja o TikTok Shop, você aprenderá a criar suas próprias influenciadoras virtuais ultra-realistas. Você poderá utilizar essas influenciadoras para divulgação de produtos físicos e digitais em qualquer tipo de negócio ou rede."
      },
      {
        question: "Terei acesso às novidades futuras?",
        answer: "Sim. A Comunidade MVZ está em constante evolução. Entrando no plano mensal, você garante acesso a todas as novidades exclusivas, novas estratégias e atualizações de materiais que forem adicionadas à comunidade."
      },
      {
        question: "Como funciona a garantia?",
        answer: "Temos a Garantia de Risco Zero de 7 dias. Entre e tenha acesso imediato a todo o conteúdo. Se em até 7 dias você achar que a comunidade não superou suas expectativas, basta solicitar o reembolso diretamente lá dentro da plataforma de pagamento com apenas alguns cliques e devolveremos 100% do seu dinheiro. Sem pegadinhas."
      }
    ];
  
    return (
      <section id="faq" className="py-24 md:py-32 relative bg-[#050505]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-16 md:mb-20 text-center transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ transitionDelay: '0ms', transitionDuration: '1000ms' }}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Perguntas <span className="text-brand-500">Frequentes</span></h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">Tire suas dúvidas e venha fazer parte da revolução.</p>
          </div>
  
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '1000ms' }}>
                  <div 
                    className={`glass-panel rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${isOpen ? 'border-brand-500/50 bg-brand-500/5' : 'border-white/10 hover:border-white/20'}`}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <div className="p-5 md:p-6 flex justify-between items-center gap-4">
                      <h3 className={`font-bold text-base md:text-lg transition-colors ${isOpen ? 'text-white' : 'text-gray-300'}`}>
                        {faq.question}
                      </h3>
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-brand-500 border-brand-500 text-white rotate-180' : 'border-white/20 text-gray-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-5 h-5" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-5 md:p-6 pt-0 text-gray-400 text-sm md:text-base leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };
  
  export default FAQ;
