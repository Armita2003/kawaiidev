export type AppStatus = 'Live' | 'Buggy' | 'Sleeping';

export interface BugReport {
  id: string;
  description: string;
  createdAt: string;
  resolved?: boolean;
}

export interface APKProject {
  id: string;
  title: string;
  version: string;
  description: string;
  longDescription: string;
  category: string; // e.g. "RPG", "Fitness", "E-commerce", "Reader", "Utility"
  framework: string; // e.g. "React Native", "Expo Go", "Expo", "Reanimated", "Hermes"
  tags: string[];
  size: string; // e.g. "42.5 MB"
  minApi: string; // e.g. "Android 10"
  updatedAt: string; // e.g. "2h ago" or "2 days ago"
  license: string; // e.g. "MIT"
  downloads: number;
  status: AppStatus;
  screenshotUrl: string; // fallback preview image / illustration
  iconType: 'coffee' | 'dog' | 'bug' | 'alarm' | 'vibe' | 'joystick' | 'fitness' | 'cart' | 'book' | 'rocket';
  worksGreat: string[];
  spontaneousFeatures: string[];
  mascotQuote: string;
  screenshotFit?: 'cover' | 'contain';
  screenshotScale?: number;
  screenshotXOffset?: number;
  screenshotYOffset?: number;
  screenshotBgColor?: string;
  screenshotRotate?: number;
  coverUrl?: string;
  bugReports?: BugReport[];
}

export interface GlobalStats {
  boops: number;
  bugs: number;
  coffeeLitres: number;
}
