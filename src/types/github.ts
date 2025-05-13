export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  children?: GitHubFile[];
  lastModified?: string;
  language?: string;
  content?: string;
  url?: string;
} 