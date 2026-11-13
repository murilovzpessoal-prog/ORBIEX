const Features = () => {
    return (
      <section id="features" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-x-0" style={{ transitionDelay: '0ms', transitionDuration: '1000ms' }}>
            <div className="mb-12 md:mb-20 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                Explore a <span className="text-brand-500">Comunidade MVZ</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto md:mx-0">
                Tudo o que você precisa para dominar o TikTok Shop: produtos validados, influenciadoras de IA e estratégias de escala.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-24 md:mb-32">
            <div className="md:col-span-2">
              <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 scale-100 h-full" style={{ transitionDelay: '0ms', transitionDuration: '1000ms' }}>
                <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative group h-full min-h-[400px]">
                  <div className="relative z-10">
                    <div className="mb-6 w-12 h-12 md:w-14 md:h-14 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center text-brand-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up md:w-7 md:h-7" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Produtos virais do momento</h3>
                    <p className="text-gray-400 mb-8 max-w-md text-sm md:text-base">
                      Dentro da comunidade, você acessa os produtos mais validados do TikTok Shop e aprende como utilizá-los para gerar vendas todos os dias.
                    </p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-xl border border-white/5 p-3 md:p-4 relative overflow-hidden z-10">
                    <div className="flex justify-between items-center mb-4 text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold px-2">
                      <span>Produto Viral</span>
                      <span>Faturamento (7d)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-white/5 mb-2 border border-white/5">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('https://i.imgur.com/4b8qE4r.png')" }}></div>
                        <div>
                          <div className="text-xs md:text-sm font-medium text-white">Modelador Postural</div>
                          <div className="text-[10px] md:text-xs text-green-400 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg> Em alta
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs md:text-sm font-bold text-white">R$ 245.920,00</div>
                        <div className="text-[10px] md:text-xs text-gray-500">12.4k vendas</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-white/5 mb-2 border border-white/5">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('https://i.imgur.com/MtzHk8Q.png')" }}></div>
                        <div>
                          <div className="text-xs md:text-sm font-medium text-white">Kit Clareador Dental</div>
                          <div className="text-[10px] md:text-xs text-green-400 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg> Tendência
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs md:text-sm font-bold text-white">R$ 182.450,00</div>
                        <div className="text-[10px] md:text-xs text-gray-500">8.1k vendas</div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none"></div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                </div>
              </div>
            </div>
            
            <div className="md:row-span-2">
              <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 scale-100 h-full" style={{ transitionDelay: '200ms', transitionDuration: '1000ms' }}>
                <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/10 flex flex-col relative overflow-hidden h-full min-h-[400px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                  <div className="mb-6 w-12 h-12 md:w-14 md:h-14 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users md:w-6 md:h-6" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Influencers Virtuais</h3>
                  <p className="text-gray-400 mb-8 text-sm md:text-base">
                    Aprenda a criar sua própria influenciadora ultra-realista e venda sem precisar aparecer.
                  </p>
                  <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-gray-800 shadow-2xl border border-white/5">
                    <img alt="Avatar AI" className="w-full h-full object-cover" src="https://i.imgur.com/3ZdF8XU.png" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></div><span className="truncate">Gerado por IA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 scale-100 h-full" style={{ transitionDelay: '150ms', transitionDuration: '1000ms' }}>
                <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden group h-full">
                  <div className="mb-6 w-12 h-12 md:w-14 md:h-14 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center text-brand-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play ml-1 md:w-6 md:h-6" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">Área de Membros 100% Atualizada</h3>
                  <p className="text-gray-400 text-sm">Esqueça aulas teóricas intermináveis. Acesse direto o que está convertendo agora e aplique no seu negócio hoje mesmo.</p>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-brand-500/20 transition-colors"></div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 scale-100 h-full" style={{ transitionDelay: '300ms', transitionDuration: '1000ms' }}>
                <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden group h-full">
                  <div className="mb-6 w-12 h-12 md:w-14 md:h-14 bg-pink-500/20 border border-pink-500/30 rounded-full flex items-center justify-center text-pink-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-column md:w-6 md:h-6" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">Raio-X de Criadores</h3>
                  <p className="text-gray-400 text-sm">Descubra o que os tubarões do seu nicho estão fazendo. Veja os padrões de postagem e as abordagens que estão gerando milhões em vendas.</p>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-pink-500/20 transition-colors"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 md:mt-32 flex flex-col lg:flex-row items-center gap-20 lg:gap-24 overflow-visible">
            <div className="flex-1 text-center lg:text-left space-y-8 px-4 min-w-[300px]">
              <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-x-0" style={{ transitionDelay: '0ms', transitionDuration: '1000ms' }}>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15] text-white">
                  Entrar na Comunidade MVZ é como ter uma <span className="text-brand-500 inline-block">central de inteligência</span> que monitora o que está performando e organiza tudo em tempo real para você.
                </h3>
              </div>
              <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ transitionDelay: '200ms', transitionDuration: '1000ms' }}>
                <div className="flex justify-center lg:justify-start">
                  <a href="#pricing" className="custom-btn w-full md:w-auto !py-4 !px-8 !text-lg !rounded-xl shadow-brand-500/25 shadow-lg">Quero viralizar ainda hoje!</a>
                </div>
              </div>
            </div>
            <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-x-0 flex-1 relative w-full flex flex-col items-center select-none lg:translate-x-0" style={{ transitionDelay: '300ms', transitionDuration: '1000ms' }}>
              <div className="mockup-wrapper">
                <div className="macbook-lid">
                  <div className="macbook-screen">
                    <div className="mac-notch"><div className="mac-camera"></div></div>
                    <img className="w-full h-full object-cover" alt="Interface Vyral Desktop" src="https://i.imgur.com/bIXfEHy.png" />
                  </div>
                </div>
                <div className="macbook-base"><div className="base-notch"></div></div>
                <div className="iphone-container">
                  <div className="dynamic-island"></div>
                  <div className="iphone-screen">
                    <img className="w-full h-full object-cover" alt="Interface Vyral Mobile" src="https://i.imgur.com/hDhk98O.png" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  export default Features;
