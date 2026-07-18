import React, { useState } from 'react';
import { APKProject } from '../types';
import { getProjectApkUrl } from '../utils/apkUrl';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Smartphone, 
  ClipboardCheck, 
  Sprout,
  Check,
  AlertCircle,
  Bug,
  Send,
  Icon,
  X
} from 'lucide-react';

interface ProjectDetailProps {
  project: APKProject;
  onBack: () => void;
  onDownloadAPK: (projectId: string) => void;
  onReportBug: (projectId: string, description: string) => void;
}

export default function ProjectDetail({ project, onBack, onDownloadAPK, onReportBug }: ProjectDetailProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [bugInput, setBugInput] = useState('');
  const [showBugModal, setShowBugModal] = useState(false);

  const downloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${getProjectApkUrl(project)}`
    : getProjectApkUrl(project);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(downloadUrl)}&color=000000&bgcolor=FFFFFF`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl)
        .then(() => {
          setCopiedLink(true);
        })
        .catch(() => {
          setCopiedLink(true);
        });
    } else {
      setCopiedLink(true);
    }
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    onReportBug(project.id, bugInput);
    setBugInput('');
    setShowBugModal(false);
  };

  const visibleBugReports = (project.bugReports ?? []).filter((report) => !report.resolved);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fadeIn">
      {/* Back to Dashboard Navigation */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-display font-bold text-sm bg-white hover:bg-surface-container-low border-2 border-on-background px-4 py-2 rounded-xl squishy-shadow-sm active-squish cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          Back to Dashboard
        </button>
      </div>

      <div id="project-detail-layout-grid" className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Left Column: Phone mockup frame & Mascot */}
        <div id="project-detail-left-col" className="md:col-span-5 flex flex-col gap-8">
          
          {/* Screenshot Frame mockup */}
          <div className="relative group max-w-[320px] mx-auto w-full">
            {/* Ambient Background Squishy Blobs */}
            <div className="absolute -top-6 -left-6 w-48 h-48 bg-primary-container opacity-40 blob-bg z-0 animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-60 h-60 bg-secondary-container opacity-40 blob-bg z-0 animate-bounce duration-4000"></div>
            
            {/* Neumorphic/NeoBrutalist Phone Outer Shell */}
            <div className="relative z-10 bg-white border-3 border-on-background rounded-[36px] p-2.5 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)]">
              {/* Dynamic camera notch mockup */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 bg-on-background rounded-full z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ml-2"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ml-auto mr-3"></div>
              </div>

              {/* Screenshot container */}
              <div 
                className="relative overflow-hidden rounded-[28px] border-2 border-on-background aspect-[9/19] flex items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: project.screenshotBgColor || '#f1f5f9' }}
              >
                <img 
                  className="w-full h-full select-none pointer-events-none" 
                  src={project.screenshotUrl} 
                  alt={`${project.title} Interface Screenshot`}
                  style={{
                    objectFit: project.screenshotFit || 'cover',
                    transform: `translate(${project.screenshotXOffset || 0}px, ${project.screenshotYOffset || 0}px) scale(${(project.screenshotScale !== undefined ? project.screenshotScale : 100) / 100}) rotate(${project.screenshotRotate || 0}deg)`,
                  }}
                />
              </div>
            </div>

            {/* Rotating Badges */}
            <div className="absolute -top-4 -right-4 z-20 bg-tertiary-container text-on-tertiary-container border-2 border-on-background rounded-full px-4 py-1.5 font-display font-bold text-xs shadow-[3px_3px_0px_0px_rgba(22,29,31,1)] rotate-12">
              {project.version}
            </div>
          </div>

          {/* Quirky Mascot Message box */}
          <div className="bg-surface-container-low border-2 border-on-background rounded-xl p-5 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(22,29,31,1)]">
            <div className="w-12 h-12 shrink-0 bg-primary-container rounded-full border-2 border-on-background flex items-center justify-center">
              <Sprout className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-on-surface mb-1">Mascot says:</p>
              <p className="font-sans text-xs text-on-surface-variant italic leading-relaxed">
                "{project.mascotQuote}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed parameters & Call to Action */}
        <div id="project-detail-right-col" className="md:col-span-7 flex flex-col gap-8">
          <header>
            {/* {project.coverUrl && (
              <div className="w-full h-44 border-2 border-on-background rounded-2xl overflow-hidden mb-6 shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] relative">
                <img 
                  src={project.coverUrl} 
                  alt={`${project.title} Cover Banner`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )} */}
            <h1 className="font-display text-4xl md:text-5xl text-on-background font-extrabold mb-4 leading-tight">
              {project.title}
            </h1>
            
            {/* Tags stack */}
            <div className="flex flex-wrap gap-2 mb-6 font-display text-xs font-bold">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full border border-on-background shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {project.framework}
              </span>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full border border-on-background shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                Category: {project.category}
              </span>
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full border border-on-background shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {project.license} License
              </span>
            </div>

            <p className="font-sans text-base md:text-lg text-on-surface-variant leading-relaxed max-w-2xl">
              {project.longDescription}
            </p>
          </header>

          {/* Feature Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-on-background/10">
            {/* Works Great green checkmarks */}
            <section className="flex flex-col gap-3">
              <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                Works Great
              </h3>
              <ul className="space-y-2 font-sans text-xs text-on-surface-variant">
                {project.worksGreat.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Bugs/Spontaneous features warning exclamations */}
            <section className="flex flex-col gap-3">
              <h3 className="font-display text-lg font-bold text-secondary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-secondary shrink-0" />
                Spontaneous "Features"
              </h3>
              <ul className="space-y-2 font-sans text-xs text-on-surface-variant">
                {project.spontaneousFeatures.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-4 p-6 bg-surface-container rounded-2xl border-2 border-on-background flex flex-col md:flex-row items-center gap-8 shadow-[6px_6px_0px_0px_rgba(22,29,31,1)]">
            <div className="flex-1 w-full text-center md:text-left">
              <h2 className="font-display text-2xl font-extrabold text-on-surface mb-2">Ready to try it?</h2>
              <p className="font-sans text-xs text-on-surface-variant mb-6 leading-relaxed">
                Scan the QR code to install directly on your device, copy a mock download link, or hit the big squishy button below.
              </p>
              
              <button 
                onClick={() => onDownloadAPK(project.id)}
                className="w-full md:w-auto bg-primary hover:bg-primary/95 text-on-primary px-6 py-3 rounded-xl border-2 border-on-background font-display font-bold text-base shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] flex items-center justify-center gap-2 active-squish cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Download APK ({project.size})
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div 
                onClick={handleCopyLink}
                className="p-3 bg-white border-2 border-on-background rounded-xl shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] cursor-pointer hover:-translate-y-1 transition-all"
                title="Click to copy install URL!"
              >
                <div className="w-28 h-28 bg-white rounded-lg overflow-hidden flex items-center justify-center relative p-1">
                  <img 
                    className="w-full h-full object-contain" 
                    src={qrCodeUrl} 
                    alt="Scan Code QR" 
                  />
                </div>
              </div>
              <span className="font-display font-bold text-[10px] text-on-surface-variant text-center flex items-center gap-1 mt-1">
                {copiedLink ? (
                  <span className="text-primary flex items-center gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Link Copied!
                  </span>
                ) : (
                  "Boop QR to copy link"
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 p-6 bg-surface-container rounded-2xl border-2 border-on-background shadow-[6px_6px_0px_0px_rgba(22,29,31,1)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-on-surface">Bug reports</h2>
                <p className="font-sans text-xs text-on-surface-variant">
                  {visibleBugReports.length} active issue{visibleBugReports.length === 1 ? '' : 's'} for this app.
                </p>
              </div>
              <button
                onClick={() => setShowBugModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container border-2 border-on-background rounded-xl font-display font-bold text-xs active-squish cursor-pointer"
              >
                <Bug className="w-4 h-4" />
                Report bug
              </button>
            </div>

            <div className="space-y-2">
              {visibleBugReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-on-background/40 p-4 text-center text-[11px] font-sans text-on-surface-variant">
                  No active bugs reported right now. The mascot is ready to hear about them.
                </div>
              ) : (
                visibleBugReports.map((report) => (
                  <div key={report.id} className="rounded-xl border-2 border-on-background bg-surface-container-low p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`font-sans text-xs ${report.resolved ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface-variant'}`}>
                        {report.description}
                      </p>
                      <span className="shrink-0 rounded-full border border-on-background bg-white px-2 py-0.5 font-mono text-[9px] text-on-surface-variant">
                        {report.createdAt}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Technical Specs bento grid list */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div className="p-4 border-2 border-on-background rounded-xl bg-surface-container-low text-center shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]">
              <p className="font-display font-bold text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">File Size</p>
              <p className="font-display font-extrabold text-sm text-on-surface">{project.size}</p>
            </div>
            <div className="p-4 border-2 border-on-background rounded-xl bg-surface-container-low text-center shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]">
              <p className="font-display font-bold text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Min Android API</p>
              <p className="font-display font-extrabold text-sm text-on-surface">{project.minApi}</p>
            </div>
            <div className="p-4 border-2 border-on-background rounded-xl bg-surface-container-low text-center shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]">
              <p className="font-display font-bold text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Last Updated</p>
              <p className="font-display font-extrabold text-sm text-on-surface">{project.updatedAt}</p>
            </div>
            <div className="p-4 border-2 border-on-background rounded-xl bg-surface-container-low text-center shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]">
              <p className="font-display font-bold text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">License Code</p>
              <p className="font-display font-extrabold text-sm text-on-surface">{project.license}</p>
            </div>
          </div>

        </div>
      </div>

      {showBugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-3 border-on-background bg-white p-6 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div >
                <h3 className="font-display text-lg font-extrabold text-on-surface">Report a bug</h3>
                <p className="font-sans text-xs text-on-surface-variant">Tell the mascot what went wrong with {project.title}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBugModal(false)}
                className="h-10 aspect-square shrink-0 rounded-full border-2 border-on-background bg-surface-container p-2 text-on-surface"
              >
                
              <X className="w-5 h-5 text-on-surface" />
              </button>
            </div>

            <form onSubmit={handleSubmitBug} className="space-y-4">
              <label className="block font-display font-bold text-[11px] text-on-surface">What happened?</label>
              <textarea
                rows={4}
                value={bugInput}
                onChange={(e) => setBugInput(e.target.value)}
                placeholder="Describe the issue you saw..."
                className="w-full rounded-lg border-2 border-on-background bg-white p-2.5 font-sans text-xs outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  className="rounded-lg border-2 border-on-background bg-surface-container px-4 py-2 font-display font-bold text-xs text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg border-2 border-on-background bg-primary px-4 py-2 font-display font-bold text-xs text-on-primary"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
