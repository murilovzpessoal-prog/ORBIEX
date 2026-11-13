

const Hero = () => {
    return (
      <section id="home" className="pt-32 md:pt-40 pb-32 md:pb-48 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[500px] bg-brand-500/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ width: 'auto', transitionDelay: '0ms', transitionDuration: '1000ms' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-500 text-xs font-semibold tracking-wider uppercase mb-6 md:mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap fill-current" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> Comunidade MVZ
            </div>
          </div>
          
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 blur-0" style={{ width: 'auto', transitionDelay: '100ms', transitionDuration: '1500ms' }}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-[1.1]">
              O processo que gerou <br />
              <span className="text-brand-500">3 milhões em GMV</span> <br />
              no TikTok Shop
            </h1>
          </div>
          
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 translate-y-0" style={{ width: 'auto', transitionDelay: '200ms', transitionDuration: '1000ms' }}>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
              Uma comunidade que executa um método validado diariamente, transformando conteúdo em vendas com consistência.
            </p>
          </div>
          
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 scale-100" style={{ width: 'auto', transitionDelay: '300ms', transitionDuration: '1000ms' }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 md:mb-16 w-full px-4 sm:px-0">
              <a href="#pricing" className="custom-btn w-full sm:w-auto text-center justify-center">Começar agora</a>
            </div>
          </div>
          
          <div className="transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform opacity-100 scale-100 w-full px-2 md:px-0" style={{ width: 'auto', transitionDelay: '400ms', transitionDuration: '1200ms' }}>
            <div className="relative mx-auto w-full max-w-5xl animate-float perspective-1000">
              <div className="relative rounded-[1rem] md:rounded-2xl bg-[#0d0d0d] border border-gray-800 p-[1.5%] shadow-2xl">
                <div className="relative rounded-[0.5rem] md:rounded-xl overflow-hidden bg-black aspect-[16/10] border border-white/5">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20%] md:w-32 h-[3%] md:h-4 bg-[#0d0d0d] rounded-b-md md:rounded-b-lg z-20 flex justify-center items-center">
                    <div className="w-[10%] h-[30%] rounded-full bg-[#1f1f1f] shadow-inner"></div>
                  </div>
                  <img alt="Dashboard Comunidade MVZ" className="w-full h-full object-cover opacity-90" src="https://i.imgur.com/eZdSuH1.png" />
                </div>
              </div>
              <div className="relative mx-auto w-[100.5%] h-1.5 md:h-3 bg-[#1a1a1a] rounded-b-lg shadow-xl border-t border-black flex justify-center items-start">
                <div className="w-1/4 h-[2px] bg-[#2a2a2a] rounded-b-md mt-0"></div>
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-10 bg-brand-500/20 blur-2xl rounded-[100%] pointer-events-none opacity-40"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-px left-0 w-full overflow-hidden leading-[0] z-20">
          <svg className="relative block w-full h-[50px] md:h-[70px] text-white" viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 L200,0 C240,0 260,50 300,50 L1140,50 C1180,50 1200,0 1240,0 L1440,0 V70 H0 V0Z" fill="currentColor"></path>
          </svg>
        </div>
      </section>
    );
};

export default Hero;
