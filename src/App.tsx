/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import AdminPanel from './components/AdminPanel';
import { APKProject, GlobalStats } from './types';
import { INITIAL_PROJECTS, INITIAL_STATS } from './data';
import { fetchProjects, saveProjects, fetchStats, saveStats } from './utils/api';
import { getProjectApkUrl } from './utils/apkUrl';
import { Sparkles, Terminal, Download, Check, Coffee, Heart, Lock, Unlock } from 'lucide-react';

export default function App() {
  // Navigation states
  const [view, setView] = useState<'dashboard' | 'detail' | 'admin'>('dashboard');
  const [adminTab, setAdminTab] = useState<'all_projects' | 'add_apk' | 'analytics' | 'settings' | 'bugs'>('all_projects');
  
  // Admin authentication states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_logged_in') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Data states
  const [projects, setProjects] = useState<APKProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [selectedProject, setSelectedProject] = useState<APKProject | null>(null);
  
  // Statistics and health
  const [stats, setStats] = useState<GlobalStats>(INITIAL_STATS);
  const [systemHealth, setSystemHealth] = useState(82);

  // Download simulation dialog state
  const [activeDownloadApp, setActiveDownloadApp] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Easter egg states
  // const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState<string | null>(null);

  // Load shared data from server so all devices see the same APKs
  useEffect(() => {
    async function loadData() {
      try {
        const [serverProjects, serverStats] = await Promise.all([
          fetchProjects(),
          fetchStats(),
        ]);
        setProjects(serverProjects);
        setStats({
          boops: serverStats.boops ?? 0,
          bugs: serverStats.bugs ?? 0,
          coffeeLitres: serverStats.coffeeLitres ?? 0,
          likes: serverStats.likes ?? 0,
        });
      } catch (err) {
        console.error('Failed to load from server, using defaults:', err);
        setProjects(INITIAL_PROJECTS);
      }
      setLoadingProjects(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    setStats((prevStats) => ({
      ...prevStats,
      bugs: projects.reduce((count, project) => count + (project.bugReports?.filter((report) => !report.resolved).length ?? 0), 0)
    }));
  }, [projects]);

  // Update System Health based on status distributions
  useEffect(() => {
    if (projects.length === 0) return;
    const buggyCount = projects.filter(p => p.status === 'Buggy').length;
    const totalApps = projects.length;
    // Base health is 100%. Each buggy app decreases health.
    const calculatedHealth = Math.max(50, 100 - Math.round((buggyCount / totalApps) * 50));
    setSystemHealth(calculatedHealth);
  }, [projects]);

  const persistProjects = (updatedProjects: APKProject[]) => {
    setProjects(updatedProjects);
    saveProjects(updatedProjects).catch((err) => console.error('Failed to save projects:', err));
  };

  const persistStats = (updatedStats: GlobalStats) => {
    setStats(updatedStats);
    saveStats(updatedStats).catch((err) => console.error('Failed to save stats:', err));
  };

  // Handlers
  const handleAddProject = (newProject: APKProject) => {
    const updated = [newProject, ...projects];
    persistProjects(updated);
    
    // Add bug count slightly!
    const updatedStats = {
      ...stats,
      bugs: stats.bugs + 2
    };
    persistStats(updatedStats);

    triggerToast(`🚀 "${newProject.title}" successfully deployed!`);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    persistProjects(updated);
    
    // Decrease bugs count somewhat
    const updatedStats = {
      ...stats,
      bugs: Math.max(0, stats.bugs - 1)
    };
    persistStats(updatedStats);

    triggerToast('🗑️ APK successfully decommissioned!');
  };

  const handleEditProject = (editedProject: APKProject) => {
    const updated = projects.map(p => p.id === editedProject.id ? editedProject : p);
    persistProjects(updated);
    triggerToast('📝 App configuration updated!');
  };

  const handleBoopCoffee = () => {
    setStats((prevStats) => {
      const updated = {
        ...prevStats,
        boops: prevStats.boops + 1,
        coffeeLitres: prevStats.coffeeLitres + 0.1
      };
      persistStats(updated);
      return updated;
    });
  };

  const handleLikeHeart = () => {
    setStats((prevStats) => {
      const updated = {
        ...prevStats,
        likes: prevStats.likes + 1,
        boops: prevStats.boops + 1,
      };
      persistStats(updated);
      return updated;
    });
  };

  const handleReportBug = (projectId: string, description: string) => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription) return;

    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    const updatedProjects = projects.map((item) =>
      item.id === projectId
        ? {
            ...item,
            bugReports: [
              ...(item.bugReports ?? []),
              {
                id: `${item.id}-${Date.now()}`,
                description: trimmedDescription,
                createdAt: new Date().toLocaleString(),
                resolved: false
              }
            ]
          }
        : item
    );

    persistProjects(updatedProjects);
    setSelectedProject((currentSelectedProject) => {
      if (currentSelectedProject?.id === projectId) {
        return updatedProjects.find((item) => item.id === projectId) ?? currentSelectedProject;
      }
      return currentSelectedProject;
    });
    triggerToast(`🐛 Bug reported for ${project.title}.`);
  };

  const handleToggleBugStatus = (projectId: string, bugId: string) => {
    const updatedProjects = projects.map((item) => {
      if (item.id !== projectId) return item;

      return {
        ...item,
        bugReports: (item.bugReports ?? []).map((report) =>
          report.id === bugId ? { ...report, resolved: !report.resolved } : report
        )
      };
    });

    persistProjects(updatedProjects);
    setSelectedProject((currentSelectedProject) => {
      if (currentSelectedProject?.id === projectId) {
        return updatedProjects.find((item) => item.id === projectId) ?? currentSelectedProject;
      }
      return currentSelectedProject;
    });
  };

  const triggerActualFileDownload = (project: APKProject) => {
    const safeTitle = project.title ? project.title.replace(/\s+/g, '_') : project.id;
    const fileName = `${safeTitle}.apk`;
    const link = document.createElement('a');
    link.href = getProjectApkUrl(project);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAPK = (projectId: string) => {
    const app = projects.find(p => p.id === projectId);
    if (!app) return;

    // Must fire synchronously on click — async fetch breaks downloads on mobile Chrome
    triggerActualFileDownload(app);

    setActiveDownloadApp(app.title);
    setDownloadProgress(0);
    setDownloadComplete(false);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setDownloadProgress(100);
        setDownloadComplete(true);
        
        // Increment download stats
        setProjects((prevProjects) => {
          const updated = prevProjects.map(p => 
            p.id === projectId ? { ...p, downloads: p.downloads + 1 } : p
          );
          saveProjects(updated).catch((err) => console.error('Failed to save download count:', err));
          return updated;
        });

        setStats((prevStats) => {
          const updated = {
            ...prevStats,
            boops: prevStats.boops + 1,
            coffeeLitres: prevStats.coffeeLitres + 0.2
          };
          saveStats(updated).catch((err) => console.error('Failed to save stats:', err));
          return updated;
        });
      } else {
        setDownloadProgress(currentProgress);
      }
    }, 200);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPwd = adminPassword.trim().toLowerCase();
    if (cleanPwd === 'ilikefood') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('is_admin_logged_in', 'true');
      setShowLoginModal(false);
      setAdminPassword('');
      setLoginError('');
      setView('admin'); // Go directly to the admin view!
      setAdminTab('all_projects');
      triggerToast('🐾 Welcome back, Boss! Admin powers unlocked!');
    } else {
      setLoginError('❌ Wrong biscuit flavor! Please check password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.setItem('is_admin_logged_in', 'false');
    setView('dashboard');
    setSelectedProject(null);
    triggerToast('🔒 Admin panel locked. Goodbye, Boss!');
  };

  // const handleBoopGitHub = () => {
  //   setShowGitHubModal(true);
  // };

  const triggerToast = (message: string) => {
    setShowSuccessNotification(message);
    setTimeout(() => {
      setShowSuccessNotification(null);
    }, 4000);
  };

  const handleViewChange = (newView: 'dashboard' | 'admin') => {
    setView(newView);
    setSelectedProject(null);
    if (newView === 'admin') {
      setAdminTab('all_projects');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex flex-col justify-between overflow-x-hidden">
      
      {/* Dynamic Header */}
      <Header 
        currentView={selectedProject ? 'detail' : view} 
        onViewChange={handleViewChange} 
        onBoopCoffee={handleBoopCoffee} 
        coffeeCount={Math.round(stats.coffeeLitres * 10)}
        isAdminLoggedIn={isAdminLoggedIn}
        onTriggerLogin={() => { setAdminPassword(''); setLoginError(''); setShowLoginModal(true); }}
        onLogout={handleAdminLogout}
      />

      {/* Main Body Layout */}
      <div className="flex-grow flex flex-col">
        {selectedProject ? (
          /* Detail Screen View */
          <main className="flex-grow">
            <ProjectDetail 
              project={selectedProject} 
              onBack={() => setSelectedProject(null)} 
              onDownloadAPK={handleDownloadAPK}
              onReportBug={handleReportBug}
            />
          </main>
        ) : view === 'admin' ? (
          /* Admin View Split Layout (Guarded) */
          !isAdminLoggedIn ? (
            <main className="flex-grow flex items-center justify-center p-4">
              <div className="bg-white border-3 border-on-background rounded-2xl max-w-md w-full p-8 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)] text-center relative my-12">
                <div className="w-16 h-16 bg-error-container-custom rounded-full border-2 border-on-background flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Lock className="w-8 h-8 text-error-custom" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-on-surface mb-3">
                  Admin Vault Guarded
                </h3>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed mb-6">
                  🐾 Mascot dinosaur stops you! This terminal is strictly for KawaiiDev. Unlocking requires high clearance password.
                </p>
                <button
                  onClick={() => { setAdminPassword(''); setLoginError(''); setShowLoginModal(true); }}
                  className="w-full py-2.5 bg-primary text-on-primary border-2 border-on-background font-display font-bold text-xs rounded-xl active-squish cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Unlock Terminal
                </button>
              </div>
            </main>
          ) : (
            <div className="flex-grow flex flex-col md:flex-row border-b-2 border-on-background">
              <Sidebar 
                activeTab={adminTab} 
                onTabChange={setAdminTab} 
                systemHealth={systemHealth} 
              />
              <main className="flex-grow flex bg-white/50">
                <AdminPanel 
                  projects={projects}
                  onAddProject={handleAddProject}
                  onDeleteProject={handleDeleteProject}
                  onEditProject={handleEditProject}
                  activeTab={adminTab}
                  onTabChange={setAdminTab}
                  onProjectSelect={(proj) => setSelectedProject(proj)}
                  onToggleBugStatus={handleToggleBugStatus}
                />
              </main>
            </div>
          )
        ) : (
          /* Public Stash Portfolio Dashboard */
          <main className="flex-grow">
            <Dashboard 
              loading={loadingProjects}
              projects={projects} 
              stats={stats} 
              onProjectSelect={(proj) => setSelectedProject(proj)} 
              onDownloadAPK={handleDownloadAPK}
              // onBoopGitHub={handleBoopGitHub}
              isAdminLoggedIn={isAdminLoggedIn}
              onTriggerLogin={() => { setAdminPassword(''); setLoginError(''); setShowLoginModal(true); }}
              onGoToAdmin={() => handleViewChange('admin')}
            />
          </main>
        )}
      </div>

      {/* Shared Footer representation */}
      <footer className="w-full bg-surface-container-low border-t-2 border-on-background py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display font-bold text-tertiary">KawaiiDev Stash</span>
            <p className="text-[11px] font-mono text-on-surface-variant">© 2026 Crafted with coffee & 20% more bugs</p>
          </div>
          
          <nav className="flex gap-6 text-xs font-display font-bold text-on-surface-variant">
            <button 
              onClick={() => alert('🔒 Mascot privacy: Your cookies are only stored in local biscuit tins!')} 
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => alert('📄 Terms of Service: Agree to feed at least 1 virtual bug per downloaded APK!')} 
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Terms of Use
            </button>
            <button 
              onClick={() => alert('💬 Support: File an issue by shouting at the nearest lavender bush.')} 
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Support Desk
            </button>
          </nav>

          <div className="flex gap-2">
            <button 
              onClick={() => triggerToast('🐾 Purrrr! Keyboard typing is healthy.')}
              className="w-9 h-9 rounded-full border-2 border-on-background bg-primary-container flex items-center justify-center hover:scale-110 active-squish cursor-pointer text-primary"
            >
              <Terminal className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLikeHeart}
              className="w-9 h-9 rounded-full border-2 border-on-background bg-secondary-container flex items-center justify-center hover:scale-110 active-squish cursor-pointer text-secondary"
            >
              <Heart className="w-4 h-4" />
              <span className="ml-1 text-[10px] font-mono font-bold">{stats.likes}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Dialog: APK Download Loading Simulation */}
      {activeDownloadApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-on-background rounded-2xl max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)] text-center relative animate-zoomIn">
            <div className="w-16 h-16 bg-primary-container rounded-full border-2 border-on-background flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Download className="w-8 h-8 text-primary" />
            </div>

            <h3 className="font-display font-extrabold text-lg text-on-surface mb-2">
              Downloading {activeDownloadApp}
            </h3>

            {!downloadComplete ? (
              <div className="space-y-3">
                <p className="font-sans text-xs text-on-surface-variant">
                  Assembling custom React Native Hermes engine modules...
                </p>
                <div className="w-full bg-slate-100 border-2 border-on-background rounded-full h-4 overflow-hidden relative p-0.5">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
                <span className="font-mono text-xs font-bold text-primary">{downloadProgress}%</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-on-primary-container border border-on-background rounded-full font-mono text-[10px] font-bold mx-auto">
                  <Check className="w-3.5 h-3.5" /> COMPILE SUCCESS
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  APK assembly complete! The file was safely dispatched to your virtual downloads. Mascot purrs with joy. 🐾
                </p>
                <button
                  onClick={() => setActiveDownloadApp(null)}
                  className="w-full py-2 bg-primary text-on-primary border-2 border-on-background font-display font-bold text-xs rounded-xl active-squish cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Boop to Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog: GitHub Easter Egg */}
      {/* {showGitHubModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-on-background rounded-2xl max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)] text-center animate-zoomIn">
            <div className="w-16 h-16 bg-secondary-container rounded-full border-2 border-on-background flex items-center justify-center mx-auto mb-4">
              <Terminal className="w-8 h-8 text-secondary" />
            </div>

            <h3 className="font-display font-extrabold text-lg text-on-surface mb-2">
              GitHub Pipeline Redirect
            </h3>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed mb-6">
              Our codebases contain highly-energized mascot dinosaurs, lavender sensory units, and 20% more bugs. GitHub servers couldn't handle the kawaii levels!
            </p>

            <div className="bg-surface-container border border-on-background p-3 rounded-lg text-left font-mono text-[10px] text-on-surface-variant mb-6 select-all">
              git clone https://github.com/KawaiiDev/too-many-bugs.git
            </div>

            <button
              onClick={() => setShowGitHubModal(false)}
              className="w-full py-2.5 bg-secondary text-on-secondary border-2 border-on-background font-display font-bold text-xs rounded-xl active-squish cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Understood, let's keep booping
            </button>
          </div>
        </div>
      )} */}

      {/* Dialog: Admin Login Shield Modal */}
      {showLoginModal && (
        <div id="admin-login-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div id="admin-login-modal-card" className="bg-white border-3 border-on-background rounded-2xl max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)] relative animate-zoomIn text-center">
            
            {/* Header section */}
            <div className="mb-5 flex flex-col items-center">
              <div className="w-16 h-16 bg-secondary-container rounded-full border-2 border-on-background flex items-center justify-center mb-3">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-on-surface">
                Admin Control Lock
              </h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed mt-1">
                Unlock project deployments and caffeine analytics logs.
              </p>
            </div>

            {/* Mascot message */}
            {/* <div className="bg-primary-container/20 border border-on-background/10 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-left">
              <span className="text-lg">🐾</span>
              <div>
                <p className="font-display font-bold text-[10px] text-primary uppercase">Mascot Hint</p>
                <p className="font-sans text-[11px] text-on-surface-variant italic">
                  Password is <span className="font-bold text-secondary font-mono">kawaiidev</span> or <span className="font-bold text-secondary font-mono">Ilikefood1</span>
                </p>
              </div>
            </div> */}

            {/* Login form */}
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block font-display font-bold text-xs text-on-surface mb-1.5">
                  Enter Admin Passphrase
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-secondary outline-none transition-all"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="font-display font-bold text-xs text-error-custom text-center animate-pulse">
                  {loginError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setAdminPassword(''); setLoginError(''); }}
                  className="flex-1 py-2 font-display font-bold border-2 border-on-background rounded-xl hover:bg-surface-container active-squish text-xs text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-display font-extrabold bg-secondary text-on-secondary border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl active-squish text-xs cursor-pointer"
                >
                  Unlock Gate
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Floating Success Notifications */}
      {showSuccessNotification && (
        <div className="fixed bottom-6 right-6 bg-white border-2 border-on-background rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] z-50 flex items-center gap-2.5 animate-slideUp text-xs font-display font-bold text-primary">
          <Sparkles className="w-4 h-4 text-secondary animate-spin" />
          <span>{showSuccessNotification}</span>
        </div>
      )}

    </div>
  );
}

