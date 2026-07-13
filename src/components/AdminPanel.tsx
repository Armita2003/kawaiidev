import React, { useState, useRef, useEffect } from 'react';
import { APKProject, AppStatus } from '../types';
import { saveApkFile, getApkFile, deleteApkFile } from '../utils/apkDb';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload, 
  Trash, 
  PlusSquare, 
  Sparkles, 
  HelpCircle,
  AlertTriangle,
  Play,
  BarChart,
  Shield,
  Clock,
  Dribbble,
  X,
  Coffee,
  Bug,
  ListChecks
} from 'lucide-react';

interface AdminPanelProps {
  projects: APKProject[];
  onAddProject: (newProject: APKProject) => void;
  onDeleteProject: (id: string) => void;
  onEditProject: (project: APKProject) => void;
  activeTab: 'all_projects' | 'add_apk' | 'analytics' | 'settings' | 'bugs';
  onTabChange: (tab: 'all_projects' | 'add_apk' | 'analytics' | 'settings' | 'bugs') => void;
  onProjectSelect: (project: APKProject) => void;
  onToggleBugStatus: (projectId: string, bugId: string) => void;
}

export default function AdminPanel({
  projects,
  onAddProject,
  onDeleteProject,
  onEditProject,
  activeTab,
  onTabChange,
  onProjectSelect,
  onToggleBugStatus
}: AdminPanelProps) {
  
  // States for general search/filter
  const [searchTerm, setSearchTerm] = useState('');

  // States for new project form
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Utility');
  const [framework, setFramework] = useState('React Native');
  const [status, setStatus] = useState<AppStatus>('Live');
  const [size, setSize] = useState('15.4 MB');
  const [minApi, setMinApi] = useState('Android 11');
  const [tags, setTags] = useState<string[]>(['EXPO', 'HERMES']);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Simulated files upload states
  const [apkFileName, setApkFileName] = useState<string | null>(null);
  const [selectedApkFile, setSelectedApkFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('/images/MainImage.jpg');
  const [coverUrl, setCoverUrl] = useState<string>('');
  
  // Custom screenshot editor states
  const [screenshotFit, setScreenshotFit] = useState<'cover' | 'contain'>('cover');
  const [screenshotScale, setScreenshotScale] = useState<number>(100);
  const [screenshotXOffset, setScreenshotXOffset] = useState<number>(0);
  const [screenshotYOffset, setScreenshotYOffset] = useState<number>(0);
  const [screenshotBgColor, setScreenshotBgColor] = useState<string>('#f1f5f9');
  const [screenshotRotate, setScreenshotRotate] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // States for edit mode
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (editingProjectId) {
      getApkFile(editingProjectId).then(stored => {
        if (stored) {
          setApkFileName(stored.fileName);
          setSize(stored.size);
        } else {
          setApkFileName(null);
        }
      }).catch(err => {
        console.warn('Error reading apk from IndexedDB:', err);
        setApkFileName(null);
      });
    } else {
      setApkFileName(null);
      setSelectedApkFile(null);
    }
  }, [editingProjectId]);

  // Stats
  const liveCount = projects.filter(p => p.status === 'Live').length;
  const buggyCount = projects.filter(p => p.status === 'Buggy').length;
  const sleepingCount = projects.filter(p => p.status === 'Sleeping').length;
  const totalDownloads = projects.reduce((acc, curr) => acc + curr.downloads, 0);

  // Filtered projects
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.framework.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add tags handler
  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.toUpperCase())) {
      setTags([...tags, newTagInput.trim().toUpperCase()]);
      setNewTagInput('');
    }
  };

  // Remove tag handler
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Helper to format real file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Drag and drop simulator
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropApk = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setApkFileName(file.name);
      setSelectedApkFile(file);
      setSize(formatFileSize(file.size));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setApkFileName(file.name);
      setSelectedApkFile(file);
      setSize(formatFileSize(file.size));
    }
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshotPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setEditingProjectId(null);
    setTitle('');
    setVersion('');
    setDescription('');
    setCategory('Utility');
    setFramework('React Native');
    setStatus('Live');
    setSize('0 Bytes');
    setMinApi('Android 11');
    setTags(['EXPO', 'HERMES']);
    setApkFileName(null);
    setSelectedApkFile(null);
    setScreenshotPreview('/images/MainImage.jpg');
    setCoverUrl('');
    setScreenshotFit('cover');
    setScreenshotScale(100);
    setScreenshotXOffset(0);
    setScreenshotYOffset(0);
    setScreenshotBgColor('#f1f5f9');
    setScreenshotRotate(0);
  };

  // Handle new deployment creation
  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('🐾 Mascot says: Please provide a descriptive title for your APK!');
      return;
    }

    const projectId = editingProjectId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Save selected apk file to IndexedDB if present
    if (selectedApkFile) {
      try {
        await saveApkFile(projectId, selectedApkFile, selectedApkFile.name, size);
      } catch (err) {
        console.error('Failed to save APK file to IndexedDB:', err);
      }
    }

    const newApp: APKProject = {
      id: projectId,
      title: title.trim(),
      version: version.trim() || 'v1.0.0',
      description: description.trim() || 'No description available.',
      longDescription: description.trim() 
        ? `${description.trim()} Built dynamically using advanced Neo-Brutalist design parameters.` 
        : 'A highly responsive layout built from the super admin deployment desk.',
      category,
      framework,
      tags: tags.length > 0 ? tags : ['CUSTOM'],
      size,
      minApi,
      updatedAt: 'Just now',
      license: 'MIT',
      downloads: editingProjectId ? (projects.find(p => p.id === editingProjectId)?.downloads || 0) : 0,
      status,
      screenshotUrl: screenshotPreview,
      screenshotFit,
      screenshotScale,
      screenshotXOffset,
      screenshotYOffset,
      screenshotBgColor,
      screenshotRotate,
      coverUrl: coverUrl || undefined,
      iconType: category.toLowerCase().includes('coffee') ? 'coffee' : 'alarm',
      worksGreat: [
        // 'Passed rigorous automated simulated health checks.',
        'Features optimal memory bounds management.',
        'Mascot approved button-clicking haptics.'
      ],
      spontaneousFeatures: [
        'May emit a tiny purring sound on launch.',
        'Contains unreleased experimental modules.'
      ],
      mascotQuote: 'This project is freshly deployed! Handle with care and lots of double-shot espresso.'
    };

    if (editingProjectId) {
      onEditProject(newApp);
    } else {
      onAddProject(newApp);
    }

    resetForm();
    onTabChange('all_projects');
  };

  const startEdit = (project: APKProject) => {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setVersion(project.version);
    setDescription(project.description);
    setCategory(project.category);
    setFramework(project.framework);
    setStatus(project.status);
    setSize(project.size);
    setMinApi(project.minApi);
    setTags(project.tags);
    setScreenshotPreview(project.screenshotUrl);
    setCoverUrl(project.coverUrl || '');
    setScreenshotFit(project.screenshotFit || 'cover');
    setScreenshotScale(project.screenshotScale !== undefined ? project.screenshotScale : 100);
    setScreenshotXOffset(project.screenshotXOffset !== undefined ? project.screenshotXOffset : 0);
    setScreenshotYOffset(project.screenshotYOffset !== undefined ? project.screenshotYOffset : 0);
    setScreenshotBgColor(project.screenshotBgColor || '#f1f5f9');
    setScreenshotRotate(project.screenshotRotate !== undefined ? project.screenshotRotate : 0);
    onTabChange('add_apk');
  };

  const handleDelete = (id: string, title: string) => {
    const check = window.confirm(`🐾 Mascot warning: Are you absolutely sure you want to delete ${title}? There is no backup coffee!`);
    if (check) {
      onDeleteProject(id);
      deleteApkFile(id).catch(err => {
        console.warn('Failed to delete apk from IndexedDB:', err);
      });
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full animate-fadeIn">
      {/* Tab: All Projects List */}
      {activeTab === 'all_projects' && (
        <div className="space-y-8">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface">
                Project Repository
              </h2>
              <p className="text-on-surface-variant font-sans text-sm">
                Welcome back, Dev! You have <span className="font-bold text-primary">{projects.length} projects</span> currently floating in local stash.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                onTabChange('add_apk');
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-primary text-on-primary font-display font-extrabold text-base rounded-xl border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] active-squish cursor-pointer"
            >
              <PlusSquare className="w-5 h-5" />
              NEW APK
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-primary-container rounded-xl border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] flex flex-col justify-between h-28">
              <Sparkles className="w-5 h-5 text-on-primary-container opacity-80" />
              <div>
                <p className="font-display text-[10px] font-bold text-on-primary-container/80 uppercase">Live</p>
                <p className="font-display text-3xl font-extrabold text-on-primary-container leading-none">0{liveCount}</p>
              </div>
            </div>

            <div className="p-4 bg-error-container-custom rounded-xl border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] flex flex-col justify-between h-28">
              <AlertTriangle className="w-5 h-5 text-on-error-container opacity-80" />
              <div>
                <p className="font-display text-[10px] font-bold text-on-error-container/80 uppercase">Bugy</p>
                <p className="font-display text-3xl font-extrabold text-on-error-container leading-none">0{buggyCount}</p>
              </div>
            </div>

            <div className="p-4 bg-secondary-container rounded-xl border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] flex flex-col justify-between h-28">
              <Clock className="w-5 h-5 text-on-secondary-container opacity-80" />
              <div>
                <p className="font-display text-[10px] font-bold text-on-secondary-container/80 uppercase">Sleeping</p>
                <p className="font-display text-3xl font-extrabold text-on-secondary-container leading-none">0{sleepingCount}</p>
              </div>
            </div>

            <div className="p-4 bg-surface-container-highest rounded-xl border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] flex flex-col justify-between h-28 relative overflow-hidden">
              <BarChart className="w-5 h-5 text-on-surface opacity-80 z-10" />
              <div className="absolute right-0 bottom-0 opacity-10 font-display font-extrabold text-6xl select-none leading-none -mr-2">DL</div>
              <div className="z-10">
                <p className="font-display text-[10px] font-bold text-on-surface/80 uppercase">Total DLs</p>
                <p className="font-display text-2xl font-extrabold text-on-surface leading-none">{totalDownloads >= 1000 ? `${(totalDownloads/1000).toFixed(1)}k` : totalDownloads}</p>
              </div>
            </div>
          </div>

          {/* Table container with hard border/shadow */}
          <div className="bg-surface-container-lowest rounded-2xl border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] overflow-hidden">
            
            {/* Search filter banner header */}
            <div className="px-6 py-4 bg-surface-container-high border-b-2 border-on-background flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-display text-lg font-bold text-on-surface">Existing Projects</h3>
              <div className="relative w-full sm:w-64 group">
                <input
                  type="text"
                  placeholder="Filter apps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white rounded-lg border-2 border-on-background px-3 py-1.5 pl-9 focus:ring-0 focus:border-primary outline-none font-sans text-xs transition-all"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              </div>
            </div>

            {/* Main scrollable table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-display font-bold text-xs border-b border-on-background/10">
                    <th className="px-6 py-3.5">APP IDENTITY</th>
                    <th className="px-6 py-3.5">VERSION</th>
                    <th className="px-6 py-3.5">STATUS</th>
                    <th className="px-6 py-3.5">LAST UPDATED</th>
                    <th className="px-6 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-on-background/5">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-sans text-sm italic">
                        No projects found matching that filter. Deploy a new one! 🚀
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-primary-container/10 transition-colors duration-100">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg border-2 border-on-background bg-tertiary-container flex items-center justify-center">
                              <span className="text-xl">🐾</span>
                            </div>
                            <div>
                              <p className="font-display font-bold text-sm text-on-surface leading-tight">
                                {project.title}
                              </p>
                              <p className="font-mono text-[10px] text-on-surface-variant">
                                {project.category} • {project.framework}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{project.version}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-display font-bold rounded-full border ${
                            project.status === 'Live'
                              ? 'bg-primary-container text-on-primary-container border-on-primary-container'
                              : project.status === 'Buggy'
                              ? 'bg-error-container-custom text-on-error-container border-on-error-container'
                              : 'bg-surface-container-high text-on-surface-variant border-outline'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              project.status === 'Live' ? 'bg-primary animate-pulse' : project.status === 'Buggy' ? 'bg-error-custom' : 'bg-slate-400'
                            }`} />
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">{project.updatedAt}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(project)}
                              title="Edit configuration"
                              className="w-7 h-7 rounded border border-on-background flex items-center justify-center hover:bg-surface-container active:scale-90 duration-100 text-on-surface"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onProjectSelect(project)}
                              title="Preview detail screen"
                              className="w-7 h-7 rounded border border-on-background flex items-center justify-center hover:bg-surface-container active:scale-90 duration-100 text-primary"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id, project.title)}
                              title="Delete project"
                              className="w-7 h-7 rounded border border-on-background flex items-center justify-center hover:bg-error-container-custom active:scale-90 duration-100 text-error-custom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Form "Add New APK" / Edit */}
      {activeTab === 'add_apk' && (
        <section className="bg-surface-container-lowest border-2 border-on-background rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(22,29,31,1)]">
          <div className="flex items-center gap-2 mb-6">
            <span className="p-2 bg-secondary-container border border-on-background rounded-lg">
              <Plus className="w-5 h-5 text-secondary" />
            </span>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-secondary">
              {editingProjectId ? 'Modify Deployment' : 'New Deployment'}
            </h2>
          </div>

          <form onSubmit={handleDeploy} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Form Column */}
              <div className="space-y-4">
                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">App Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Kawaii Counter 3000"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">Version Indicator</label>
                  <input
                    type="text"
                    placeholder="e.g., v1.0.0-maybe"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">App Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none"
                  >
                    <option>Utility</option>
                    <option>Productivity</option>
                    <option>AI Assistant</option>
                    <option>Developer Tool</option>
                    <option>Social</option>
                    <option>Health</option>
                  </select>
                </div>

                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">Target Engine / Framework</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none"
                  >
                    <option>React Native</option>
                    <option>Expo Go</option>
                    <option>Expo Router</option>
                    <option>Native Modules</option>
                  </select>
                </div>

                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">Current App Vibe/Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AppStatus)}
                    className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none"
                  >
                    <option value="Live">🟢 Live (No crash warnings yet)</option>
                    <option value="Buggy">🔴 Buggy (20% more fun!)</option>
                    <option value="Sleeping">💤 Sleeping (Requires caffeine)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-display font-bold text-xs text-on-surface mb-1">File Size</label>
                    <input
                      type="text"
                      placeholder="e.g., 24.5 MB"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-display font-bold text-xs text-on-surface mb-1">Min Android API</label>
                    <input
                      type="text"
                      placeholder="e.g., Android 11"
                      value={minApi}
                      onChange={(e) => setMinApi(e.target.value)}
                      className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe what this squishy app does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border-2 border-on-background rounded-lg p-2.5 font-sans text-xs focus:ring-0 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Right Form Column: File Drag Drop & Screenshots */}
              <div className="space-y-4">
                {/* Drag Drop Box */}
                <div>
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">APK Binary Stash</label>
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDropApk}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline hover:border-primary bg-surface-container-low rounded-xl p-6 text-center cursor-pointer transition-all duration-100 flex flex-col items-center justify-center relative group"
                  >
                    <Upload className="w-8 h-8 text-primary mb-2 group-hover:bounce" />
                    <p className="font-display font-bold text-xs text-on-surface">
                      {apkFileName ? `Selected: ${apkFileName}` : 'Drop your APK here or click to browse'}
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                      Max size 50MB of sheer potential • Custom Size: {size}
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      accept=".apk" 
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* Screenshot upload container */}
                <div className="space-y-3">
                  <label className="block font-display font-bold text-xs text-on-surface">
                    Preview Screenshot mockup
                  </label>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div 
                      onClick={() => screenshotInputRef.current?.click()}
                      className="aspect-square bg-white border-2 border-on-background border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-surface-container cursor-pointer transition-all p-3 text-center"
                    >
                      <Plus className="w-5 h-5 text-on-surface-variant mb-1" />
                      <span className="font-display font-bold text-[9px] text-on-surface-variant">Upload custom interface</span>
                      <input 
                        type="file" 
                        ref={screenshotInputRef} 
                        onChange={handleScreenshotSelect} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <div 
                      className="aspect-square border-2 border-on-background rounded-lg relative overflow-hidden group flex items-center justify-center"
                      style={{ backgroundColor: screenshotBgColor }}
                    >
                      <img 
                        src={screenshotPreview} 
                        alt="Screenshot Preview" 
                        className="w-full h-full select-none pointer-events-none"
                        style={{
                          objectFit: screenshotFit,
                          transform: `translate(${screenshotXOffset / 2}px, ${screenshotYOffset / 2}px) scale(${screenshotScale / 100}) rotate(${screenshotRotate}deg)`,
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setScreenshotPreview('/images/MainImage.jpg');
                          setScreenshotFit('cover');
                          setScreenshotScale(100);
                          setScreenshotXOffset(0);
                          setScreenshotYOffset(0);
                          setScreenshotBgColor('#f1f5f9');
                          setScreenshotRotate(0);
                        }}
                        className="absolute top-1 right-1 bg-error-custom text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 duration-100 cursor-pointer"
                        title="Reset to default mock screenshot"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Custom Screenshot Fine-Tuning Console */}
                  <div className="bg-surface-container-low border-2 border-on-background rounded-xl p-3.5 space-y-3 shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]">
                    <div className="flex items-center justify-between border-b border-on-background/10 pb-1.5">
                      <span className="font-display font-bold text-[11px] text-on-surface flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        Mascot's Photo Fitting Lab
                      </span>
                      <span className="text-[8px] font-mono text-primary font-bold px-1.5 py-0.5 bg-primary-container border border-on-background rounded-full">
                        ACTIVE TUNER
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                      {/* Left: Mini phone mockup showing live feedback */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white/40 p-2 rounded-lg border border-on-background/10">
                        <p className="text-[9px] font-display font-bold text-on-surface-variant mb-1">Live Mobile Fit</p>
                        <div className="w-24 bg-white border-2 border-on-background rounded-2xl p-1 shadow-[2px_2px_0px_0px_rgba(22,29,31,1)] relative overflow-hidden">
                          {/* Notch */}
                          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-2 bg-on-background rounded-full z-20"></div>
                          {/* Content display */}
                          <div 
                            className="relative overflow-hidden rounded-lg aspect-[9/19] flex items-center justify-center border border-on-background"
                            style={{ backgroundColor: screenshotBgColor }}
                          >
                            <img 
                              src={screenshotPreview} 
                              alt="Live tuning" 
                              className="w-full h-full select-none pointer-events-none" 
                              style={{
                                objectFit: screenshotFit,
                                transform: `translate(${screenshotXOffset / 2.5}px, ${screenshotYOffset / 2.5}px) scale(${screenshotScale / 100}) rotate(${screenshotRotate}deg)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Sliders and Toggles */}
                      <div className="sm:col-span-7 space-y-2 text-xs">
                        {/* Fit Mode Switcher */}
                        <div>
                          <span className="block font-display font-bold text-[9px] text-on-surface-variant mb-0.5">Fitting Mode</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setScreenshotFit('cover')}
                              className={`py-1 text-[9px] font-display font-bold border rounded-md transition-all active-squish ${
                                screenshotFit === 'cover'
                                  ? 'bg-primary text-on-primary border-on-background shadow-[1px_1px_0px_0px_rgba(22,29,31,1)] font-extrabold'
                                  : 'bg-white text-on-surface border-on-background/20 hover:border-on-background'
                              }`}
                            >
                              Cover (Fill)
                            </button>
                            <button
                              type="button"
                              onClick={() => setScreenshotFit('contain')}
                              className={`py-1 text-[9px] font-display font-bold border rounded-md transition-all active-squish ${
                                screenshotFit === 'contain'
                                  ? 'bg-primary text-on-primary border-on-background shadow-[1px_1px_0px_0px_rgba(22,29,31,1)] font-extrabold'
                                  : 'bg-white text-on-surface border-on-background/20 hover:border-on-background'
                              }`}
                            >
                              Contain (Box)
                            </button>
                          </div>
                        </div>

                        {/* Scale / Zoom */}
                        <div>
                          <div className="flex justify-between font-display text-[9px] text-on-surface-variant font-bold">
                            <span>Zoom Scale</span>
                            <span className="font-mono text-primary font-bold">{screenshotScale}%</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="250"
                            value={screenshotScale}
                            onChange={(e) => setScreenshotScale(Number(e.target.value))}
                            className="w-full accent-primary h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                          />
                        </div>

                        {/* X Offset */}
                        <div>
                          <div className="flex justify-between font-display text-[9px] text-on-surface-variant font-bold">
                            <span>Horizontal Align (X)</span>
                            <span className="font-mono text-primary font-bold">{screenshotXOffset}px</span>
                          </div>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            value={screenshotXOffset}
                            onChange={(e) => setScreenshotXOffset(Number(e.target.value))}
                            className="w-full accent-primary h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                          />
                        </div>

                        {/* Y Offset */}
                        <div>
                          <div className="flex justify-between font-display text-[9px] text-on-surface-variant font-bold">
                            <span>Vertical Align (Y)</span>
                            <span className="font-mono text-primary font-bold">{screenshotYOffset}px</span>
                          </div>
                          <input
                            type="range"
                            min="-150"
                            max="150"
                            value={screenshotYOffset}
                            onChange={(e) => setScreenshotYOffset(Number(e.target.value))}
                            className="w-full accent-primary h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                          />
                        </div>

                        {/* Rotation */}
                        <div>
                          <div className="flex justify-between font-display text-[9px] text-on-surface-variant font-bold">
                            <span>Rotate</span>
                            <span className="font-mono text-primary font-bold">{screenshotRotate}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={screenshotRotate}
                            onChange={(e) => setScreenshotRotate(Number(e.target.value))}
                            className="w-full accent-primary h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                          />
                        </div>

                        {/* Background Color Presets */}
                        <div>
                          <span className="block font-display font-bold text-[9px] text-on-surface-variant mb-0.5">Letterbox Color</span>
                          <div className="flex gap-1.5">
                            {[
                              { name: 'Slate', value: '#f1f5f9' },
                              { name: 'Dark', value: '#1e293b' },
                              { name: 'Lemon', value: '#fef08a' },
                              { name: 'Sky', value: '#bae6fd' },
                              { name: 'Sakura', value: '#fbcfe8' },
                            ].map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setScreenshotBgColor(c.value)}
                                style={{ backgroundColor: c.value }}
                                className={`w-4.5 h-4.5 rounded-full border transition-transform active-squish cursor-pointer ${
                                  screenshotBgColor === c.value ? 'border-on-background scale-110 ring-1 ring-primary' : 'border-on-background/20'
                                }`}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Cover Photo container */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block font-display font-bold text-xs text-on-surface">
                      Thumbnail Cover Photo (Landscape Banner)
                    </label>
                    <span className="block text-[10px] text-on-surface-variant font-sans mt-0.5">
                      Recommended aspect ratio 16:9. If set, this replaces the vertical screenshot on the landing page's main grid.
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <div className="space-y-2">
                      <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="h-20 bg-white border-2 border-on-background border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-surface-container cursor-pointer transition-all p-2 text-center"
                      >
                        <Plus className="w-4 h-4 text-on-surface-variant mb-0.5" />
                        <span className="font-display font-bold text-[9px] text-on-surface-variant">Upload cover image</span>
                        <input 
                          type="file" 
                          ref={coverInputRef} 
                          onChange={handleCoverSelect} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Or paste image URL (https://...)" 
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        className="w-full bg-white border-2 border-on-background rounded-lg p-2 font-sans text-xs focus:ring-0 focus:border-primary outline-none"
                      />
                    </div>

                    <div className="aspect-[16/9] border-2 border-on-background rounded-lg relative overflow-hidden group flex items-center justify-center bg-slate-100">
                      {coverUrl ? (
                        <>
                          <img 
                            src={coverUrl} 
                            alt="Cover Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button 
                            type="button"
                            onClick={() => setCoverUrl('')}
                            className="absolute top-1.5 right-1.5 bg-error-custom text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 duration-100 cursor-pointer shadow-md"
                            title="Remove cover photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant font-sans italic p-4 text-center">
                          No cover photo selected. Falls back to screenshot mockup.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Feature Tags */}
                <div className="pt-2">
                  <label className="block font-display font-bold text-xs text-on-surface mb-1">Feature Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container text-on-primary-container border border-on-background rounded-full font-mono text-[9px] font-bold">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-error-custom font-sans font-bold">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add tag (e.g., SQLITE)"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="bg-white border-2 border-on-background rounded-lg p-1.5 font-sans text-[10px] focus:ring-0 focus:border-primary outline-none flex-1 uppercase"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddTag}
                      className="px-3 py-1 bg-surface-container border-2 border-on-background rounded-lg text-xs font-display font-bold active-squish cursor-pointer text-on-surface"
                    >
                      + Add
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t-2 border-on-background flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 p-3 bg-error-container-custom text-on-error-container rounded-lg border-2 border-error-custom text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-error-custom animate-pulse" />
                <span className="font-display font-bold">Mascot check: Are you sure this won't explode our SQLite instances?</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onTabChange('all_projects')}
                  className="flex-1 sm:flex-none px-6 py-2.5 font-display font-bold border-2 border-on-background rounded-xl hover:bg-surface-container active-squish text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 font-display font-extrabold bg-primary text-on-primary border-2 border-on-background shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] rounded-xl active-squish cursor-pointer"
                >
                  {editingProjectId ? 'Save Changes' : 'Deploy APK'}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Tab: Analytics representation */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-tertiary-container border border-on-background rounded-lg">
              <BarChart className="w-5 h-5 text-tertiary" />
            </span>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-tertiary">
              Caffeine & Glitch Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 1: Simulated bugs vs downloads */}
            <div className="p-5 bg-white border-2 border-on-background rounded-xl shadow-[4px_4px_0px_0px_rgba(22,29,31,1)]">
              <h3 className="font-display font-bold text-sm mb-4 text-on-surface">Weekly Exception Frequency</h3>
              <div className="h-48 bg-slate-50 border border-on-background/10 rounded-lg flex items-end justify-between p-4 relative">
                {/* Grid guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-10">
                  <div className="border-b border-on-background"></div>
                  <div className="border-b border-on-background"></div>
                  <div className="border-b border-on-background"></div>
                </div>

                {/* Customized SVG bars for Neo-brutalist visual charts */}
                <div className="w-8 bg-primary border-2 border-on-background h-32 relative group cursor-help rounded-t">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded whitespace-nowrap z-20 transition-opacity">Mon: 32 exceptions</div>
                </div>
                <div className="w-8 bg-secondary border-2 border-on-background h-40 relative group cursor-help rounded-t">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded whitespace-nowrap z-20 transition-opacity">Tue: 48 exceptions</div>
                </div>
                <div className="w-8 bg-tertiary border-2 border-on-background h-16 relative group cursor-help rounded-t">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded whitespace-nowrap z-20 transition-opacity">Wed: 12 exceptions</div>
                </div>
                <div className="w-8 bg-primary-container border-2 border-on-background h-24 relative group cursor-help rounded-t">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded whitespace-nowrap z-20 transition-opacity">Thu: 24 exceptions</div>
                </div>
                <div className="w-8 bg-secondary-container border-2 border-on-background h-44 relative group cursor-help rounded-t">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded whitespace-nowrap z-20 transition-opacity">Fri: 56 exceptions</div>
                </div>
                <div className="w-8 bg-error-custom border-2 border-on-background h-20 relative group cursor-help rounded-t">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded whitespace-nowrap z-20 transition-opacity">Sat: 20 exceptions</div>
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant font-mono mt-2 text-center">X-Axis: Days of the week • Y-Axis: Simulated crash levels</p>
            </div>

            {/* Chart 2: Coffee fueling vs build success */}
            <div className="p-5 bg-white border-2 border-on-background rounded-xl shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-sm mb-3 text-on-surface">Coffee correlation index</h3>
                <p className="font-sans text-xs text-on-surface-variant mb-4">
                  Based on proprietary telemetry data analyzed directly from local keyboard typing frequency. More double-shots lead directly to decreased compile wait times!
                </p>
              </div>

              {/* Progress bars representing analytics stats */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span>Espresso level (ml)</span>
                    <span>94%</span>
                  </div>
                  <div className="w-full bg-slate-100 border border-on-background rounded-full h-2">
                    <div className="bg-primary h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span>Hermes garbage collection speed</span>
                    <span>78%</span>
                  </div>
                  <div className="w-full bg-slate-100 border border-on-background rounded-full h-2">
                    <div className="bg-secondary h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span>Mascot happiness ratio</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-slate-100 border border-on-background rounded-full h-2">
                    <div className="bg-tertiary h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bugs */}
      {activeTab === 'bugs' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-error-container-custom border border-on-background rounded-lg">
              <Bug className="w-5 h-5 text-error-custom" />
            </span>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-on-surface">
              Bug reports by app
            </h2>
          </div>

          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border-2 border-on-background bg-white p-5 shadow-[4px_4px_0px_0px_rgba(22,29,31,1)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-on-surface">{project.title}</h3>
                    <p className="font-sans text-xs text-on-surface-variant">
                      {(project.bugReports?.filter((report) => !report.resolved).length ?? 0)} active issue{(project.bugReports?.filter((report) => !report.resolved).length ?? 0) === 1 ? '' : 's'} / {(project.bugReports?.length ?? 0)} total
                    </p>
                  </div>
                  <span className="rounded-full border-2 border-on-background bg-secondary-container px-3 py-1 font-display text-[10px] font-bold text-on-secondary-container">
                    {project.status}
                  </span>
                </div>

                {(project.bugReports?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-on-background/40 p-3 text-center font-sans text-xs text-on-surface-variant">
                    No bug reports for this app yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.bugReports?.map((report) => (
                      <div key={report.id} className="rounded-xl border-2 border-on-background bg-surface-container-low p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(report.resolved)}
                              onChange={() => onToggleBugStatus(project.id, report.id)}
                              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-2 border-on-background accent-primary"
                            />
                            <p className={`font-sans text-xs ${report.resolved ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface-variant'}`}>
                              {report.description}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-on-background bg-white px-2 py-0.5 font-mono text-[9px] text-on-surface-variant">
                            {report.createdAt}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-surface-container-highest border border-on-background rounded-lg">
              <Shield className="w-5 h-5 text-on-surface" />
            </span>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-on-surface">
              Super Admin Core Settings
            </h2>
          </div>

          <div className="p-6 bg-white border-2 border-on-background rounded-xl shadow-[4px_4px_0px_0px_rgba(22,29,31,1)] space-y-6">
            <div className="border-b border-on-background/10 pb-4">
              <h3 className="font-display font-bold text-sm text-on-surface mb-1">Caffeine Calibration</h3>
              <p className="font-sans text-xs text-on-surface-variant">Calibrate how virtual espresso shots affect simulated memory leaks.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-2 border-on-background text-primary focus:ring-0 w-4 h-4" 
                />
                <span className="font-sans text-xs font-bold text-on-surface">Allow critical bugs to spawn on weekend deadlines (Recommended)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-2 border-on-background text-primary focus:ring-0 w-4 h-4" 
                />
                <span className="font-sans text-xs font-bold text-on-surface">Enable cute dinosaur purring feedback upon APK download boops</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="rounded border-2 border-on-background text-primary focus:ring-0 w-4 h-4" 
                />
                <span className="font-sans text-xs font-bold text-on-surface">Synthesize infinite downloads to look extremely popular to recruiters</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked
                  className="rounded border-2 border-on-background text-primary focus:ring-0 w-4 h-4" 
                />
                <span className="font-sans text-xs font-bold text-on-surface">Keep local storage automatically synchronized with biscuit crumbs</span>
              </label>
            </div>

            <div className="pt-4 border-t border-on-background/10 flex justify-end">
              <button 
                type="button"
                onClick={() => alert('🐾 Mascot says: Admin settings saved! Everything is perfectly fine.')}
                className="px-5 py-2.5 bg-secondary text-on-secondary border-2 border-on-background shadow-[3px_3px_0px_0px_rgba(22,29,31,1)] font-display font-bold text-xs rounded-xl active-squish cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
