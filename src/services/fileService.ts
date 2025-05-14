import { FileTree } from "@/types/fileTree";
import { toast } from "@/components/ui/sonner";

// File content cache to store retrieved files
const fileContentCache = new Map<string, string>();

// File types to ignore (binaries, large files, etc.)
const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.mp4', '.mp3', '.wav', '.pdf', '.zip', '.tar',
  '.gz', '.rar', '.7z', '.exe', '.dll', '.so',
  '.dylib', '.bin', '.dat', '.db', '.sqlite'
]);

// Maximum file size to process (in bytes)
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

interface FileChunk {
  path: string;
  content: string;
  startLine: number;
  endLine: number;
}

interface SearchResult {
  path: string;
  content: string;
  score: number;
  context: {
    startLine: number;
    endLine: number;
  };
}

export class FileService {
  private static instance: FileService;
  private fileTree: FileTree | null = null;
  private isProcessing: boolean = false;

  private constructor() {}

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  // Set the file tree for the current repository
  async setFileTree(tree: FileTree) {
    if (!tree) {
      throw new Error('Invalid file tree provided');
    }
    
    this.fileTree = tree;
    this.clearCache();
    
    // Start processing files in the background
    this.processFileTree(tree).catch(error => {
      console.error('Error processing file tree:', error);
      toast.error('Failed to process some files. Some features may be limited.');
    });
  }

  // Clear the file content cache
  clearCache() {
    fileContentCache.clear();
  }

  // Get file content with caching
  async getFileContent(path: string): Promise<string | null> {
    if (!path) {
      throw new Error('Invalid file path provided');
    }

    // Check cache first
    if (fileContentCache.has(path)) {
      return fileContentCache.get(path) || null;
    }

    try {
      // Fetch file content from GitHub API
      const response = await fetch(`/api/github/content/${path}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }

      // First try to get the raw content
      const rawResponse = await fetch(`/api/github/raw/${path}`);
      if (rawResponse.ok) {
        const content = await rawResponse.text();
        fileContentCache.set(path, content);
        return content;
      }

      // If raw content fails, try the GitHub API response
      const data = await response.json();
      let content: string;

      if (data.content) {
        try {
          content = atob(data.content);
        } catch (error) {
          content = data.content;
        }
      } else if (data.download_url) {
        const downloadResponse = await fetch(data.download_url);
        if (!downloadResponse.ok) {
          throw new Error(`Failed to fetch raw content: ${downloadResponse.statusText}`);
        }
        content = await downloadResponse.text();
      } else {
        throw new Error('No content available for this file');
      }

      // Cache the content
      fileContentCache.set(path, content);
      return content;
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      toast.error(`Failed to load file: ${path}`);
      return null;
    }
  }

  // Process and store file contents
  async processFileTree(tree: FileTree) {
    if (this.isProcessing) {
      console.warn('File tree processing already in progress');
      return;
    }

    this.isProcessing = true;
    try {
      await this.cacheRelevantFiles(tree);
    } finally {
      this.isProcessing = false;
    }
  }

  // Cache relevant files from the file tree
  private async cacheRelevantFiles(node: FileTree, path: string = '') {
    const currentPath = path ? `${path}/${node.name}` : node.name;

    // Skip ignored files
    if (this.shouldIgnoreFile(currentPath, node.size)) {
      return;
    }

    // Process file content
    if (node.type === 'file') {
      const content = await this.getFileContent(currentPath);
      if (content) {
        fileContentCache.set(currentPath, content);
      }
    }

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        await this.cacheRelevantFiles(child, currentPath);
      }
    }
  }

  // Check if a file should be ignored
  private shouldIgnoreFile(path: string, size?: number): boolean {
    const extension = path.split('.').pop()?.toLowerCase();
    if (!extension) return true;

    // Check file extension
    if (IGNORED_EXTENSIONS.has(`.${extension}`)) {
      return true;
    }

    // Check file size
    if (size && size > MAX_FILE_SIZE) {
      return true;
    }

    return false;
  }

  // Search for relevant files based on query
  async searchFiles(query: string): Promise<SearchResult[]> {
    if (!this.fileTree) {
      // If file tree is not available, try to get basic results from cache
      const results: SearchResult[] = [];
      const searchTerms = query.toLowerCase().split(' ');

      for (const [path, content] of fileContentCache.entries()) {
        const score = this.calculateRelevanceScore(path, content, searchTerms);
        if (score > 0) {
          const chunks = this.getRelevantChunks(content, searchTerms);
          chunks.forEach(chunk => {
            results.push({
              path,
              content: chunk.content,
              score: score * chunk.relevance,
              context: {
                startLine: chunk.startLine,
                endLine: chunk.endLine
              }
            });
          });
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    // If file tree is available, proceed with full search
    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    // Search through cached files
    for (const [path, content] of fileContentCache.entries()) {
      const score = this.calculateRelevanceScore(path, content, searchTerms);
      if (score > 0) {
        const chunks = this.getRelevantChunks(content, searchTerms);
        chunks.forEach(chunk => {
          results.push({
            path,
            content: chunk.content,
            score: score * chunk.relevance,
            context: {
              startLine: chunk.startLine,
              endLine: chunk.endLine
            }
          });
        });
      }
    }

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  // Calculate relevance score for a file
  private calculateRelevanceScore(path: string, content: string, searchTerms: string[]): number {
    let score = 0;
    const pathLower = path.toLowerCase();
    const contentLower = content.toLowerCase();

    // Check filename match
    if (searchTerms.some(term => pathLower.includes(term))) {
      score += 2;
    }

    // Check content match
    searchTerms.forEach(term => {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches * 0.1;
    });

    return score;
  }

  // Get relevant chunks from file content
  private getRelevantChunks(content: string, searchTerms: string[]): Array<{ content: string; startLine: number; endLine: number; relevance: number }> {
    const lines = content.split('\n');
    const chunks: Array<{ content: string; startLine: number; endLine: number; relevance: number }> = [];
    const CHUNK_SIZE = 10; // Number of lines per chunk

    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
      const chunk = lines.slice(i, i + CHUNK_SIZE).join('\n');
      const relevance = this.calculateChunkRelevance(chunk, searchTerms);

      if (relevance > 0) {
        chunks.push({
          content: chunk,
          startLine: i + 1,
          endLine: Math.min(i + CHUNK_SIZE, lines.length),
          relevance
        });
      }
    }

    return chunks;
  }

  // Calculate relevance score for a chunk
  private calculateChunkRelevance(chunk: string, searchTerms: string[]): number {
    const chunkLower = chunk.toLowerCase();
    let score = 0;

    searchTerms.forEach(term => {
      const matches = (chunkLower.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    });

    return score;
  }

  // Get context for RAG
  async getRAGContext(query: string): Promise<string> {
    try {
      const results = await this.searchFiles(query);
      
      if (results.length === 0) {
        return 'No relevant files found. Please try a different search query or wait for more files to be processed.';
      }

      // Format results for the prompt
      return results.map(result => {
        return `---
File: ${result.path}
Lines: ${result.context.startLine}-${result.context.endLine}
Content:
\`\`\`
${result.content}
\`\`\`
---`;
      }).join('\n\n');
    } catch (error) {
      console.error('Error getting RAG context:', error);
      return 'Error retrieving relevant files. Please try again.';
    }
  }
}

export const fileService = FileService.getInstance(); 