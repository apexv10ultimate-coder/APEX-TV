export interface AppCustomizerOptions {
  appName: string;
  packageName: string;
  primaryColor: string;
  backgroundColor: string;
  targetUrl: string;
  versionCode: number;
  versionName: string;
  orientation: 'unspecified' | 'landscape' | 'portrait';
  keepScreenOn: boolean;
  cleartextTraffic: boolean;
}

export interface AndroidFile {
  path: string;
  language: 'kotlin' | 'xml' | 'properties' | 'groovy' | 'proguard' | 'json';
  content: string;
  description: string;
}

export interface IPTVChannel {
  id: string;
  name: string;
  category: string;
  url: string;
  logoUrl?: string;
  epgProgram?: string;
  epgTime?: string;
}
