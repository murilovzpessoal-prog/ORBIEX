

const Testimonials = () => {
  const testimonials = [
    "https://i.imgur.com/MDlGQQA.png",
    "https://i.imgur.com/qRsN3JN.png",
    "https://i.imgur.com/0ki5Sdv.png",
    "https://i.imgur.com/siBPDqw.png"
  ];

  return (
    <section className="pt-24 pb-32 md:pt-32 md:pb-40 relative bg-white overflow-hidden text-gray-900 border-none">
      {/* Top Divider (Transição do fundo dark de Features para o bg-white) */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20" style={{ transform: 'rotate(180deg)' }}>
        <svg className="relative block w-full h-[50px] md:h-[70px] text-[#050505]" viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L200,0 C240,0 260,50 300,50 L1140,50 C1180,50 1200,0 1240,0 L1440,0 V70 H0 V0Z" fill="currentColor"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-30">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-900 to-gray-500 pb-2 md:pb-3">
            Resultados de quem já aplica <span className="text-brand-500 bg-none" style={{ WebkitTextFillColor: 'currentColor' }}>o método</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto items-start md:items-stretch">
          {testimonials.map((image, index) => (
            <div 
              key={index} 
              className="relative overflow-hidden rounded-[1.5rem] bg-[#0A0A0A] border border-gray-200/50 flex flex-col items-center justify-center transition-all hover:border-brand-500/50 hover:shadow-xl group w-full md:h-[460px] lg:h-[540px]"
            >
              {/* Blur background effect inside card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-brand-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-brand-500/20 transition-colors"></div>
              
              <img 
                src={image} 
                alt={`Depoimento ${index + 1}`} 
                className="relative w-full h-auto md:h-full md:object-contain md:object-center block z-20 group-hover:scale-[1.02] transition-transform duration-500" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Divider (Transição do bg-white de volta para o dark de Pricing) */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
        <svg className="relative block w-full h-[50px] md:h-[70px] text-[#050505]" viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L200,0 C240,0 260,50 300,50 L1140,50 C1180,50 1200,0 1240,0 L1440,0 V70 H0 V0Z" fill="currentColor"></path>
        </svg>
      </div>
    </section>
  );
};

export default Testimonials;
