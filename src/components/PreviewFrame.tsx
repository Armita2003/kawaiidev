import React from 'react';
import { APKProject } from '../types';

type PreviewProject = Pick<
  APKProject,
  | 'title'
  | 'version'
  | 'screenshotUrl'
  | 'screenshotFit'
  | 'screenshotScale'
  | 'screenshotXOffset'
  | 'screenshotYOffset'
  | 'screenshotBgColor'
  | 'screenshotRotate'
  | 'previewFrame'
>;

interface PreviewFrameProps {
  project: PreviewProject;
  /** Scale offsets for compact admin previews */
  compact?: boolean;
  showVersionBadge?: boolean;
  className?: string;
}

const screenshotStyle = (project: PreviewProject, compact: boolean) => ({
  objectFit: project.screenshotFit || 'cover',
  transform: `translate(${(project.screenshotXOffset || 0) / (compact ? 2.5 : 1)}px, ${(project.screenshotYOffset || 0) / (compact ? 2.5 : 1)}px) scale(${(project.screenshotScale !== undefined ? project.screenshotScale : 100) / 100}) rotate(${project.screenshotRotate || 0}deg)`,
});

export default function PreviewFrame({
  project,
  compact = false,
  showVersionBadge = true,
  className = '',
}: PreviewFrameProps) {
  const frame = project.previewFrame || 'mobile';
  const imgStyle = screenshotStyle(project, compact);

  if (frame === 'desktop') {
    return (
      <div className={`relative group w-full ${compact ? 'max-w-[140px]' : 'max-w-[520px]'} mx-auto ${className}`}>
        {!compact && (
          <>
            <div className="absolute -top-6 -left-6 w-48 h-48 bg-primary-container opacity-40 blob-bg z-0 animate-pulse" />
            <div className="absolute -bottom-8 -right-8 w-60 h-60 bg-secondary-container opacity-40 blob-bg z-0 animate-bounce duration-4000" />
          </>
        )}

        <div className="relative z-10 bg-white border-3 border-on-background rounded-xl shadow-[8px_8px_0px_0px_rgba(22,29,31,1)] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b-2 border-on-background">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error-custom border border-on-background" />
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary border border-on-background" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary border border-on-background" />
            </div>
            <div className="flex-1 min-w-0 rounded-md border border-on-background bg-white px-2 py-0.5 font-mono text-[9px] text-on-surface-variant truncate">
              {project.title.toLowerCase().replace(/\s+/g, '-')}.app
            </div>
          </div>

          <div
            className="relative overflow-hidden border-t-0 aspect-[16/10] flex items-center justify-center"
            style={{ backgroundColor: project.screenshotBgColor || '#f1f5f9' }}
          >
            <img
              className="w-full h-full select-none pointer-events-none"
              src={project.screenshotUrl}
              alt={`${project.title} preview`}
              style={imgStyle}
            />
          </div>
        </div>

        {showVersionBadge && (
          <div className="absolute -top-4 -right-4 z-20 bg-tertiary-container text-on-tertiary-container border-2 border-on-background rounded-full px-4 py-1.5 font-display font-bold text-xs shadow-[3px_3px_0px_0px_rgba(22,29,31,1)] rotate-12">
            {project.version}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative group ${compact ? 'max-w-[96px]' : 'max-w-[320px]'} mx-auto w-full ${className}`}>
      {!compact && (
        <>
          <div className="absolute -top-6 -left-6 w-48 h-48 bg-primary-container opacity-40 blob-bg z-0 animate-pulse" />
          <div className="absolute -bottom-8 -right-8 w-60 h-60 bg-secondary-container opacity-40 blob-bg z-0 animate-bounce duration-4000" />
        </>
      )}

      <div className="relative z-10 bg-white border-3 border-on-background rounded-[36px] p-2.5 shadow-[8px_8px_0px_0px_rgba(22,29,31,1)]">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 bg-on-background rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ml-2" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ml-auto mr-3" />
        </div>

        <div
          className="relative overflow-hidden rounded-[28px] border-2 border-on-background aspect-[9/19] flex items-center justify-center transition-colors duration-200"
          style={{ backgroundColor: project.screenshotBgColor || '#f1f5f9' }}
        >
          <img
            className="w-full h-full select-none pointer-events-none"
            src={project.screenshotUrl}
            alt={`${project.title} preview`}
            style={imgStyle}
          />
        </div>
      </div>

      {showVersionBadge && (
        <div className="absolute -top-4 -right-4 z-20 bg-tertiary-container text-on-tertiary-container border-2 border-on-background rounded-full px-4 py-1.5 font-display font-bold text-xs shadow-[3px_3px_0px_0px_rgba(22,29,31,1)] rotate-12">
          {project.version}
        </div>
      )}
    </div>
  );
}
