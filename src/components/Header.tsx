import React, { useState } from 'react';
import { Coffee, Shield, Eye, Lock, Unlock, Menu, X, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const HEADER_LOGO_URL = '../src/assets/MainImage.jpg';

interface HeaderProps {
  currentView: 'dashboard' | 'detail' | 'admin' | 'add_apk';
  onViewChange: (view: 'dashboard' | 'admin') => void;
  onBoopCoffee: () => void;
  coffeeCount: number;
  isAdminLoggedIn: boolean;
  onTriggerLogin: () => void;
  onLogout: () => void;
}

export default function Header({ 
  currentView, 
  onViewChange, 
  onBoopCoffee, 
  coffeeCount,
  isAdminLoggedIn,
  onTriggerLogin,
  onLogout
}: HeaderProps) {
  const [showCoffeeToast, setShowCoffeeToast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCoffeeClick = () => {
    onBoopCoffee();
    setShowCoffeeToast(true);
    setTimeout(() => {
      setShowCoffeeToast(false);
    }, 2000);
  };

  const isAdmin = currentView === 'admin' || currentView === 'add_apk';

  return (
    <header id="app-header" className="bg-surface-container-lowest sticky top-0 z-40 w-full border-b-2 border-on-background ">
      <div className="flex justify-between items-center px-4 md:px-8 py-3 max-w-7xl mx-auto">
        <div 
          id="header-logo"
          onClick={() => {
            onViewChange('dashboard');
            setIsMobileMenuOpen(false);
          }} 
          className="font-display text-lg sm:text-xl md:text-2xl text-primary font-bold cursor-pointer hover:scale-105 active:scale-95 duration-100 flex items-center gap-1.5 sm:gap-2"
        >
          <img src={HEADER_LOGO_URL} alt="KawaiiDev logo" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-on-background object-cover" />
          <span>KawaiiDev <span className="hidden xs:inline">APKs</span></span>
        </div>

        <nav id="header-nav-desktop" className="hidden md:flex items-center gap-4">
          <button
            id="nav-my-apps"
            onClick={() => onViewChange('dashboard')}
            className={`font-display font-bold px-3 py-1 rounded-lg border-2 border-transparent transition-all active:translate-x-[2px] active:translate-y-[2px] cursor-pointer ${
              !isAdmin
                ? 'text-primary border-primary bg-primary-container/40'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            My Apps
          </button>
          
          {isAdminLoggedIn && (
            <button
              id="nav-admin-panel"
              onClick={() => onViewChange('admin')}
              className={`font-display font-bold px-3 py-1 rounded-lg border-2 border-transparent transition-all active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1.5 cursor-pointer ${
                isAdmin
                  ? 'text-secondary border-secondary bg-secondary-container/40'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Conditional Admin Lock/Unlock Shield Button (Hidden on Mobile, handled inside mobile menu) */}
          <div className="hidden sm:flex items-center gap-2">
            {isAdminLoggedIn ? (
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="font-display font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 bg-error-container-custom hover:bg-error-container-custom/90 text-on-error-container border-2 border-on-background rounded-xl shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] active-squish cursor-pointer"
                title="Lock Admin Panel"
              >
                <Unlock className="w-4 h-4 text-error-custom" />
                <span className="hidden md:inline">Lock Admin</span>
              </button>
            ) : (
              <button
                id="header-login-shield-btn"
                onClick={onTriggerLogin}
                className="font-display font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-container border-2 border-on-background rounded-xl shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] active-squish cursor-pointer animate-pulse"
                title="Unlock Admin Panel"
              >
                <Lock className="w-4 h-4 text-secondary" />
                <span>Unlock Admin</span>
              </button>
            )}
          </div>

          <button
            id="header-coffee-btn"
            onClick={handleCoffeeClick}
            className="group font-bold flex items-center gap-1 px-2.5 sm:gap-1.5 sm:px-3 py-1.5 bg-tertiary-container hover:bg-tertiary-container/90 border-2 border-on-background rounded-xl shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] active-squish cursor-pointer text-on-tertiary-container"
          >
            <Coffee className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-tertiary group-hover:animate-bounce" />
            <span className="text-[10px] sm:text-xs font-mono font-bold bg-white/75 px-1 sm:px-1.5 py-0.5 rounded-full border border-on-background/10">
              {coffeeCount}
            </span>
          </button>

          {/* Mobile responsive navigation toggle */}
          <button
            id="header-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 border-2 border-on-background rounded-lg bg-surface-container active-squish flex items-center justify-center text-primary cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-on-surface" />
            ) : (
              <Menu className="w-5 h-5 text-on-surface" />
            )}
          </button>

          {/* Floating funny coffee bubble */}
          {showCoffeeToast && (
            <div id="coffee-bubble" className="absolute right-0 top-12 bg-white border-2 border-on-background rounded-xl p-2.5 squishy-shadow-sm text-xs font-bold text-tertiary w-48 animate-bounce z-50">
              ☕ Slurp! Your coffee boop has fueled our virtual bugs! +0.1L 🚀
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer/Dropdown Navigation Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-t-2 border-on-background bg-surface-container-lowest overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3 flex flex-col shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="text-[10px] uppercase font-mono font-bold text-on-surface-variant tracking-wider border-b border-on-background/10 pb-1.5">
                Stash Navigation
              </div>

              {/* View Dashboard */}
              <button
                onClick={() => {
                  onViewChange('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`font-display font-bold px-4 py-2.5 rounded-xl border-2 text-left flex items-center gap-2.5 transition-all active-squish cursor-pointer ${
                  !isAdmin
                    ? 'text-primary border-primary bg-primary-container/40'
                    : 'text-on-surface border-on-background/10 hover:border-on-background bg-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span className="text-xs">My Apps Vault</span>
              </button>

              {/* Conditional Admin buttons inside Mobile Drawer */}
              {isAdminLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      onViewChange('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`font-display font-bold px-4 py-2.5 rounded-xl border-2 text-left flex items-center gap-2.5 transition-all active-squish cursor-pointer ${
                      isAdmin
                        ? 'text-secondary border-secondary bg-secondary-container/40'
                        : 'text-on-surface border-on-background/10 hover:border-on-background bg-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-secondary" />
                    <span className="text-xs">Admin Panel</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full font-display font-bold text-xs flex items-center justify-between px-4 py-2.5 bg-error-container-custom text-on-error-container border-2 border-on-background rounded-xl shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] active-squish cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-error-custom" />
                      <span>Lock Admin Vault</span>
                    </div>
                    <span className="text-[9px] font-mono bg-white/50 px-1.5 py-0.5 rounded border border-on-background/10">Active</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onTriggerLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full font-display font-bold text-xs flex items-center gap-2 px-4 py-2.5 bg-secondary-container text-on-secondary-container border-2 border-on-background rounded-xl shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] active-squish cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-secondary" />
                    <span>Unlock Admin Terminal</span>
                  </button>
                </>
              )}

              {/* Extra cute Mascot Stats block at the bottom of the drawer */}
              <div className="mt-2 p-3 bg-tertiary-container/25 border border-on-background/10 rounded-xl flex items-center justify-between text-[11px] font-sans">
                <span className="text-on-surface-variant">☕ Coffee Boops Completed:</span>
                <span className="font-mono font-bold text-tertiary">{coffeeCount} boops</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
