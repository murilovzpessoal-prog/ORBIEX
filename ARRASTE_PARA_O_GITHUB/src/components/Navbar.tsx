
import { useState } from 'react';
import { Menu, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 top-6 md:top-8">
        <div className="w-full max-w-5xl glass-panel bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 md:px-8 h-14 md:h-16 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
          <div className="flex items-center gap-3">
            <img alt="MVZ Comunidade" className="h-8 md:h-9 w-auto object-contain" src="https://i.imgur.com/KnWPQ6N.png" />
            <span className="font-bold text-lg md:text-xl tracking-tight flex items-center">
              <span className="text-brand-500 mr-1.5 md:mr-2">MVZ</span>
              <span className="text-white hidden md:inline">Comunidade</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Início</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Como funciona</a>
            <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <a href="#pricing" className="hidden md:block custom-btn !px-6 !py-2 !text-sm !rounded-xl">Começar</a>
            <button 
              className="md:hidden text-white p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors active:scale-95" 
              aria-label="Menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu width="24" height="24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Mobile Menu Content */}
      <div className={`fixed top-20 right-4 left-4 z-50 md:hidden transition-all duration-300 transform origin-top ${isMobileMenuOpen ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-95 opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="glass-panel bg-[#121212]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 overflow-y-auto max-h-[80vh]">
          <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-4 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-all flex items-center justify-between group active:bg-white/5">
            <span className="font-medium">Início</span>
            <ChevronDown width="16" height="16" className="-rotate-90 text-white/20 group-hover:text-white transition-colors" />
          </a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-4 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-all flex items-center justify-between group active:bg-white/5">
            <span className="font-medium">Como funciona</span>
            <ChevronDown width="16" height="16" className="-rotate-90 text-white/20 group-hover:text-white transition-colors" />
          </a>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-4 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-all flex items-center justify-between group active:bg-white/5">
            <span className="font-medium">Recursos</span>
            <ChevronDown width="16" height="16" className="-rotate-90 text-white/20 group-hover:text-white transition-colors" />
          </a>
          <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-4 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-all flex items-center justify-between group active:bg-white/5">
            <span className="font-medium">Preços</span>
            <ChevronDown width="16" height="16" className="-rotate-90 text-white/20 group-hover:text-white transition-colors" />
          </a>
          <div className="h-px bg-white/5 my-2 mx-4"></div>
          <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="custom-btn w-full mt-2 !rounded-xl text-center justify-center">Começar Agora</a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
