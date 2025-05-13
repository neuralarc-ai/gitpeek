import type { FileTree } from '../types/fileTree';
import type { GitHubFile } from '../types/github';

// Process a batch of files into FileTree nodes
function processFiles(files: GitHubFile[], owner: string, repo: string): FileTree[] {
  return files.map(file => ({
    name: file.name,
    type: file.type === 'dir' ? 'directory' : 'file',
    path: file.path,
    size: file.size,
    children: file.type === 'dir' ? [] : undefined,
    lastModified: file.lastModified,
    language: file.language,
    content: file.content,
    url: file.url,
    owner,
    repo
  }));
}

// Listen for messages from the main thread
self.onmessage = (e: MessageEvent) => {
  const { files, owner, repo } = e.data;
  const processedFiles = processFiles(files, owner, repo);
  self.postMessage(processedFiles);
}; 