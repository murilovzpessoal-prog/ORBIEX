const Pricing = () => {
    return (
      <section id="pricing" className="py-24 md:py-32 relative">
        <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-brand-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ width: 'auto', transitionDelay: '0ms', transitionDuration: '1000ms' }}>
            <div className="mb-16 md:mb-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                Faça parte da elite <span className="text-brand-500">do TikTok Shop</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                Tenha acesso imediato a estratégias de escala validadas e uma área de membros 100% atualizada com o que está funcionando hoje.
              </p>
            </div>
          </div>
          <div className="max-w-sm md:max-w-md mx-auto mb-12 md:mb-16">
            <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ width: 'auto', transitionDelay: '100ms', transitionDuration: '1000ms' }}>
              <div className="glass-panel p-8 md:p-10 rounded-3xl border-2 border-brand-500 relative h-full flex flex-col overflow-hidden shadow-[0_0_50px_rgba(253,32,98,0.15)] group z-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-brand-500/20 transition-colors"></div>
                <div className="absolute top-0 inset-x-0 mx-auto w-32 h-1 bg-brand-500 shadow-[0_0_20px_rgba(253,32,98,1)] rounded-b-full"></div>
                
                <h3 className="text-2xl font-bold mb-2">Acesso Vitalício</h3>
                <p className="text-gray-400 mb-6 border-b border-white/10 pb-6 text-sm md:text-base">Acesso total e imediato.</p>
                <div className="mb-2">
                  <span className="text-4xl md:text-5xl font-bold">R$ 147</span>
                  <span className="text-gray-500 font-medium tracking-wide"> / valor único</span>
                </div>
                <div className="text-xs md:text-sm text-gray-500 mb-8 border-b border-white/10 pb-8 invisible">Espaço reservado</div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 text-brand-500 shrink-0 mt-0.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                    <span className="text-xs md:text-sm text-gray-300">Curso completo de TikTok Shop</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 text-brand-500 shrink-0 mt-0.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                    <span className="text-xs md:text-sm text-gray-300">Edição na prática: perfil dark</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 text-brand-500 shrink-0 mt-0.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                    <span className="text-xs md:text-sm text-gray-300">Comunidade VIP</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 text-brand-500 shrink-0 mt-0.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                    <span className="text-xs md:text-sm text-gray-300">Calls semanais com alunos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 text-brand-500 shrink-0 mt-0.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                    <span className="text-xs md:text-sm text-gray-300">Suporte prioritário</span>
                  </li>
                </ul>
                
                <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/30">
                  <div className="flex items-center gap-2 mb-4 border-b border-brand-500/20 pb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect width="20" height="5" x="2" y="7"></rect><line x1="12" x2="12" y1="22" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                    <span className="font-bold text-white text-sm uppercase tracking-wider text-brand-500">Bônus Exclusivos</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0 mt-1"><path d="M20 6 9 17l-5-5"></path></svg>
                      <span className="text-xs md:text-sm text-gray-300 font-medium">Grupo VIP de Estratégias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0 mt-1"><path d="M20 6 9 17l-5-5"></path></svg>
                      <span className="text-xs md:text-sm text-gray-300 font-medium">Grupo de Troca de Seguidores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0 mt-1"><path d="M20 6 9 17l-5-5"></path></svg>
                      <span className="text-xs md:text-sm text-gray-300 font-medium">Grupo de Produtos Validados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0 mt-1"><path d="M20 6 9 17l-5-5"></path></svg>
                      <span className="text-xs md:text-sm text-gray-300 font-medium">Você vai aprender a fazer IA ultra-realista</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0 mt-1"><path d="M20 6 9 17l-5-5"></path></svg>
                      <span className="text-xs md:text-sm text-gray-300 font-medium">Estratégia pra escalar sua live SHOP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0 mt-1"><path d="M20 6 9 17l-5-5"></path></svg>
                      <span className="text-xs md:text-sm text-gray-300 font-medium">Estratégia para escalar 10K por mês</span>
                    </li>
                  </ul>
                </div>
                <a href="https://pay.cakto.com.br/rjdos6v" target="_blank" rel="noopener noreferrer" className="custom-btn w-full py-4 shadow-brand-500/25 shadow-lg group text-center flex justify-center">
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm md:text-base">
                    Garantir Acesso
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ width: 'auto', transitionDelay: '400ms', transitionDuration: '1000ms' }}>
            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-6 justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check w-8 h-8 md:w-10 md:h-10 text-black" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-lg md:text-xl font-bold mb-2">Risco Zero - Garantia de 7 Dias</h4>
                <p className="text-gray-400 text-sm md:text-base">Use a Comunidade MVZ. Se não encontrar seu primeiro produto viral ou não gostar do conteúdo, devolvemos 100% do seu dinheiro. Sem perguntas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
};
  
export default Pricing;
