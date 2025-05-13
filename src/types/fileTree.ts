export interface FileTree {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileTree[];
  lastModified?: string;
  language?: string;
  content?: string;
  url?: string;
  owner?: string;
  repo?: string;
  description?: string;
  languages?: Record<string, number>;
  contributors?: Array<{
    login: string;
    contributions: number;
    avatar_url: string;
  }>;
  readme?: string;
  fileStructure?: Array<{
    path: string;
    type: 'file' | 'directory';
    size?: number;
  }>;
} 