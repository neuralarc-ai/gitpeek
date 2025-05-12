import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, Search, Download, X, ExternalLink } from "lucide-react";
import { GitHubFile, buildFileTree, fetchRepoData } from "@/services/githubService";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getFileIcon } from "@/lib/utils";

interface FileExplorerProps {
  owner: string;
  repo: string;
}

interface TreeNodeProps {
  node: GitHubFile;
  level: number;
  onToggle: (path: string) => void;
  expandedPaths: Set<string>;
  onFileClick: (path: string) => void;
  expandedFile: string | null;
  fileContent: string | null;
  fileLoading: boolean;
  searchQuery: string;
  defaultBranch: string;
}

const FileTreeNode = ({ node, level, onToggle, expandedPaths, onFileClick, expandedFile, fileContent, fileLoading, searchQuery, owner, repo, defaultBranch }: TreeNodeProps & { owner: string; repo: string; defaultBranch: string }) => {
  const isFolder = node.type === 'dir';
  const isExpanded = expandedPaths.has(node.path);
  const isFileExpanded = expandedFile === node.path;
  const matchesSearch = searchQuery === '' || node.name.toLowerCase().includes(searchQuery.toLowerCase());

  if (!matchesSearch) return null;

  const getGitHubUrl = (path: string) => {
    return `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${path}`;
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFolder) {
      onToggle(node.path);
    } else {
      onFileClick(node.path);
    }
  };

  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGitHubUrl(node.path);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <div
        className={`
          flex items-center py-1 px-2 hover:bg-secondary cursor-pointer rounded-md group
          ${level === 0 ? 'mt-1' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleNodeClick}
      >
        {isFolder ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground mr-1" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground mr-1" />
          )
        ) : (
          <span className="w-5" />
        )}

        {isFolder ? (
          <FolderIcon className="h-4 w-4 text-gitpeek-blue mr-2" />
        ) : (
          getFileIcon(node.name, "h-4 w-4 text-muted-foreground mr-2")
        )}

        <span className="text-sm flex-1">
          {node.name}
        </span>

        <div className="flex items-center gap-2">
          {!isFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 opacity-70 hover:opacity-100"
              onClick={handleGitHubClick}
              title="View on GitHub"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              GitHub
            </Button>
          )}
          {!isFolder && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {node.size && (
                <span>{formatFileSize(node.size)}</span>
              )}
              {node.lastModified && (
                <span>{new Date(node.lastModified).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {isFolder && isExpanded && (
        <div>
          {node.children && node.children.length > 0
            ? node.children.map(child => (
                <FileTreeNode
                  key={child.path}
                  node={child}
                  level={level + 1}
                  onToggle={onToggle}
                  expandedPaths={expandedPaths}
                  onFileClick={onFileClick}
                  expandedFile={expandedFile}
                  fileContent={expandedFile === child.path ? fileContent : null}
                  fileLoading={expandedFile === child.path ? fileLoading : false}
                  searchQuery={searchQuery}
                  owner={owner}
                  repo={repo}
                  defaultBranch={defaultBranch}
                />
              ))
            : <span className="text-xs text-muted-foreground ml-8">(empty)</span>
          }
        </div>
      )}

      {!isFolder && isFileExpanded && (
        <div className="bg-muted rounded p-2 ml-8 mt-1">
          {fileLoading ? (
            <span className="text-muted-foreground">Loading file...</span>
          ) : fileContent ? (
            <div className="relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGitHubClick}
                  title="View on GitHub"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  GitHub
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(node.name, fileContent);
                  }}
                  title="Download file"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              <SyntaxHighlighter
                language={getFileLanguage(node.name)}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  maxHeight: '400px',
                  background: 'transparent'
                }}
              >
                {fileContent}
              </SyntaxHighlighter>
            </div>
          ) : (
            <span className="text-muted-foreground">No content</span>
          )}
        </div>
      )}
    </div>
  );
};

export function FileExplorer({ owner, repo }: FileExplorerProps) {
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [defaultBranch, setDefaultBranch] = useState('main');

  // Load repository data and files when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch repository data to get the default branch
        const repoData = await fetchRepoData(owner, repo);
        if (repoData?.default_branch) {
          setDefaultBranch(repoData.default_branch);
        }
        
        // Load the file tree
        const rootFiles = await buildFileTree(owner, repo);
        setFiles(rootFiles);
      } catch (error) {
        console.error('Error loading repository data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [owner, repo]);

  const handleToggle = (path: string) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
    }
    setExpandedPaths(newExpandedPaths);
  };

  const handleFileClick = async (path: string) => {
    if (expandedFile === path) {
      setExpandedFile(null);
      setFileContent(null);
      return;
    }
    setExpandedFile(path);
    setFileContent(null);
    setFileLoading(true);
    try {
      const token = localStorage.getItem('gitpeek_github_key') || import.meta.env.VITE_GITHUB_API_KEY;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'Authorization': token ? `token ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch file content');
      const text = await response.text();
      setFileContent(text);
    } catch (e) {
      setFileContent('Failed to load file content.');
    }
    setFileLoading(false);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading repository files...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No files found in this repository</p>
      </div>
    );
  }

  return (
    <Card className="w-full h-full overflow-y-auto hide-scrollbar p-2">
      <div className="font-jetbrains">
        {files.map(node => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            onToggle={handleToggle}
            expandedPaths={expandedPaths}
            onFileClick={handleFileClick}
            expandedFile={expandedFile}
            fileContent={expandedFile === node.path ? fileContent : null}
            fileLoading={expandedFile === node.path ? fileLoading : false}
            searchQuery={searchQuery}
            owner={owner}
            repo={repo}
            defaultBranch={defaultBranch}
          />
        ))}
      </div>
    </Card>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileLanguage(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
  };
  return languageMap[extension || ''] || 'text';
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
