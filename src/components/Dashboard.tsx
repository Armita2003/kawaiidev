import React from 'react';
import { APKProject, GlobalStats } from '../types';
import { 
  Rocket, 
  // Github, 
  Download, 
  Coffee, 
  Bug, 
  Cpu, 
  Smartphone, 
  Sparkles, 
  TrendingUp, 
  Moon, 
  Zap, 
  HelpCircle,
  Eye,
  Info,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';

interface DashboardProps {
  projects: APKProject[];
  stats: GlobalStats;
  onProjectSelect: (project: APKProject) => void;
  onDownloadAPK: (projectId: string) => void;
  // onBoopGitHub: () => void;
  isAdminLoggedIn: boolean;
  onTriggerLogin: () => void;
  onGoToAdmin: () => void;
}

export default function Dashboard({ 
  projects, 
  stats, 
  onProjectSelect, 
  onDownloadAPK,
  // onBoopGitHub,
  isAdminLoggedIn,
  onTriggerLogin,
  onGoToAdmin
}: DashboardProps) {

  // Map icon strings to Lucide elements
  const renderCardIcon = (iconType: string, colorClass: string) => {
    switch (iconType) {
      case 'coffee':
        return <Coffee className={`w-16 h-16 ${colorClass}`} />;
      case 'bug':
        return <Bug className={`w-16 h-16 ${colorClass}`} />;
      case 'alarm':
        return <Cpu className={`w-16 h-16 ${colorClass}`} />;
      case 'dog':
        return <Sparkles className={`w-16 h-16 ${colorClass}`} />;
      case 'vibe':
        return <Zap className={`w-16 h-16 ${colorClass}`} />;
      default:
        return <Smartphone className={`w-16 h-16 ${colorClass}`} />;
    }
  };

  const getContainerBg = (index: number) => {
    const bgs = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container'];
    return bgs[index % bgs.length];
  };

  const getTextColor = (index: number) => {
    const textColors = ['text-on-primary-container', 'text-on-secondary-container', 'text-on-tertiary-container'];
    return textColors[index % textColors.length];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      {/* Hero Section */}
      <section className="py-12 md:py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
            {/* <img src={LANDING_LOGO_URL} alt="KawaiiDev logo" className="h-12 w-12 rounded-full border-2 border-on-background object-cover shadow-[3px_3px_0px_0px_rgba(22,29,31,1)]" /> */}
            <h1 className="font-display text-4xl md:text-5.5xl leading-tight text-primary font-extrabold">
              KawaiiDev's APK Stash - <br />
              <span className="text-secondary">Now with 20% more bugs!</span>
            </h1>
          </div>
          <p className="font-sans text-base md:text-lg text-on-surface-variant mb-8 max-w-2xl leading-relaxed">
            Welcome to the digital sandbox where code somersaults into chaos. Explore my collection of React Native and Expo experiments, each crafted with love, caffeine, and a questionable amount of sanity.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <a 
              href="#vault"
              className="px-6 py-3 bg-primary-container text-on-primary-container border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] font-display font-bold rounded-xl flex items-center gap-2 active-squish cursor-pointer"
            >
              <Rocket className="w-5 h-5 text-primary" />
              Explore Apps
            </a>
            
            {/* {isAdminLoggedIn ? (
              <button 
                id="hero-go-to-admin-btn"
                onClick={onGoToAdmin}
                className="px-6 py-3 bg-secondary-container text-on-secondary-container border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] font-display font-bold rounded-xl active-squish flex items-center gap-2 text-on-secondary cursor-pointer"
              >
                <Unlock className="w-5 h-5 text-secondary animate-bounce" />
                Admin Panel
              </button>
            ) : (
              <button 
                id="hero-login-shield-btn"
                onClick={onTriggerLogin}
                className="px-6 py-3 bg-secondary-container text-on-secondary-container border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] font-display font-bold rounded-xl active-squish flex items-center gap-2 text-on-secondary cursor-pointer"
              >
                <Lock className="w-5 h-5 text-secondary" />
                Login Shield (Admin)
              </button>
            )} */}

            {/* <button 
              onClick={onBoopGitHub}
              className="px-6 py-3 bg-surface-container-highest border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] font-display font-bold rounded-xl active-squish flex items-center gap-2 text-on-surface cursor-pointer"
            >
              <Github className="w-5 h-5" />
              View GitHub
            </button> */}
          </div>
        </div>

        {/* Mascot Large Card representation */}
        <div className="flex-1 relative w-full max-w-md">
          <div className="w-full aspect-square bg-tertiary-container border-2 border-on-background rounded-[40px] shadow-[8px_8px_0px_0px_rgba(22,29,31,1)] flex items-center justify-center overflow-hidden">
            <div 
              className="w-full h-full bg-cover bg-center hover:scale-105 duration-300 transition-transform" 
              style={{ backgroundImage: `url('/images/MainImage.jpg')` }}
              title="KawaiiDev mascot bot sitting on blocks"
            ></div>
          </div>
          <div className="absolute -bottom-4 -right-2 px-4 py-2 bg-secondary-container border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] rounded-full font-display font-bold text-xs rotate-6 text-on-secondary-container animate-bounce">
            🐾 "It works on my machine!"
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section id="vault" className="mt-16 scroll-mt-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-on-surface">The APK Vault</h2>
            <p className="text-on-surface-variant text-sm font-sans">Boop any card to view detailed specifications, code structures, and live download links.</p>
          </div>
          <div className="flex gap-2 font-display text-xs font-bold">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container border border-on-background rounded-full">React Native</span>
            <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container border border-on-background rounded-full">Expo Go</span>
            <span className="px-3 py-1 bg-primary-container text-on-primary-container border border-on-background rounded-full">Hermes</span>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => {
            const isAsymmetricLarge = project.id === 'nap-master-pro';
            const cardBgClass = getContainerBg(idx);
            const cardTextClass = getTextColor(idx);

            if (isAsymmetricLarge) {
              return (
                <div 
                  key={project.id}
                  className="md:col-span-2 lg:col-span-2 bg-surface-container border-2 border-on-background rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden group hover:bg-surface-container-high duration-200"
                >
                  <div className="flex-1 w-full flex flex-col justify-between h-full">
                    <div>
                      <div className="flex gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-on-error-container text-error-container-custom border border-on-background rounded-full text-[10px] font-bold font-mono">
                          PREMIUM CRASHES
                        </span>
                        <span className="px-2.5 py-1 bg-surface-container-highest border border-on-background rounded-full text-[10px] font-bold font-mono text-on-surface">
                          {project.framework.toUpperCase()}
                        </span>
                      </div>
                      <h3 
                        onClick={() => onProjectSelect(project)}
                        className="font-display text-2xl md:text-3xl mb-3 text-on-surface font-extrabold hover:text-primary hover:underline cursor-pointer flex items-center gap-2"
                      >
                        {project.title} <Info className="w-5 h-5 text-on-surface-variant inline opacity-60" />
                      </h3>
                      <p className="font-sans text-sm text-on-surface-variant mb-6 leading-relaxed">
                        {project.longDescription}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                      <button 
                        onClick={() => onDownloadAPK(project.id)}
                        className="px-5 py-2.5 bg-primary text-on-primary border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] font-display font-bold rounded-xl flex items-center gap-2 active-squish cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Boop to Download ({project.version})
                      </button>
                      <button 
                        onClick={() => onProjectSelect(project)}
                        className="px-4 py-2.5 bg-white border-2 border-on-background rounded-xl font-display font-bold flex items-center gap-1.5 active-squish hover:bg-surface-container text-on-surface text-sm"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </div>
                  </div>

                  <div 
                    className="w-full md:w-56 shrink-0 aspect-square border-2 border-on-background rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] relative flex items-center justify-center"
                    style={{ backgroundColor: project.screenshotBgColor || '#f1f5f9' }}
                  >
                    <img 
                      className="w-full h-full select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                      src={project.coverUrl || project.screenshotUrl} 
                      alt={`${project.title} Interface Screenshot`}
                      style={project.coverUrl ? { objectFit: 'cover' } : {
                        objectFit: project.screenshotFit || 'cover',
                        transform: `translate(${project.screenshotXOffset || 0}px, ${project.screenshotYOffset || 0}px) scale(${(project.screenshotScale !== undefined ? project.screenshotScale : 100) / 100}) rotate(${project.screenshotRotate || 0}deg)`,
                      }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={project.id}
                className="bg-surface border-2 border-on-background rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] flex flex-col group hover:bg-surface-bright transition-colors duration-200"
              >
                {/* Custom Styled Screenshot Cover Image (replaces the icon logo box) */}
                <div 
                  onClick={() => onProjectSelect(project)}
                  className="w-full h-44 border-2 border-on-background rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: project.screenshotBgColor || '#f1f5f9' }}
                >
                  <img 
                    src={project.coverUrl || project.screenshotUrl} 
                    alt={`${project.title} Cover`}
                    className="w-full h-full select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                    style={project.coverUrl ? { objectFit: 'cover' } : {
                      objectFit: project.screenshotFit || 'cover',
                      transform: `translate(${(project.screenshotXOffset || 0) * 0.7}px, ${(project.screenshotYOffset || 0) * 0.7}px) scale(${(project.screenshotScale !== undefined ? project.screenshotScale : 100) / 100}) rotate(${project.screenshotRotate || 0}deg)`,
                    }}
                  />
                </div>

                {/* Tags block */}
                <div className="flex flex-wrap gap-1.5 mb-3 font-mono text-[9px] font-bold">
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container border border-on-background rounded-full">
                    {project.status.toUpperCase()}
                  </span>
                  {project.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container border border-on-background rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 
                  onClick={() => onProjectSelect(project)}
                  className="font-display text-xl mb-2 text-on-surface font-extrabold hover:text-primary hover:underline cursor-pointer"
                >
                  {project.title}
                </h3>
                
                <p className="font-sans text-xs text-on-surface-variant flex-grow mb-5 leading-relaxed">
                  {project.description}
                </p>

                <div className="space-y-2 mt-auto">
                  <button 
                    onClick={() => onDownloadAPK(project.id)}
                    className="w-full py-2.5 bg-primary text-on-primary border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(22,29,31,1)] text-xs font-display font-bold rounded-lg flex justify-center items-center gap-1.5 active-squish cursor-pointer hover:bg-primary/95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Boop to Download
                  </button>
                  <button
                    onClick={() => onProjectSelect(project)}
                    className="w-full py-2 bg-white text-on-surface border-2 border-on-background text-xs font-display font-bold rounded-lg flex justify-center items-center gap-1 hover:bg-surface-container active-squish"
                  >
                    Details & Specs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface-container border-2 border-on-background rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] hover:scale-102 duration-200">
          <div className="text-4xl md:text-5xl font-display text-primary font-extrabold mb-1">
            {stats.boops.toLocaleString()}+
          </div>
          <div className="text-xs font-display font-bold text-on-surface-variant uppercase tracking-wider">
            Boops Registered
          </div>
        </div>

        <div className="p-6 bg-surface-container border-2 border-on-background rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] hover:scale-102 duration-200">
          <div className="text-4xl md:text-5xl font-display text-secondary font-extrabold mb-1">
            {stats.bugs === Infinity ? '∞' : stats.bugs}
          </div>
          <div className="text-xs font-display font-bold text-on-surface-variant uppercase tracking-wider">
            Bugs Encountered
          </div>
        </div>

        <div className="p-6 bg-surface-container border-2 border-on-background rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] hover:scale-102 duration-200">
          <div className="text-4xl md:text-5xl font-display text-tertiary font-extrabold mb-1">
            {stats.coffeeLitres.toFixed(1)}L
          </div>
          <div className="text-xs font-display font-bold text-on-surface-variant uppercase tracking-wider">
            Coffee Fuel Consumed
          </div>
        </div>
      </section>
    </div>
  );
}
