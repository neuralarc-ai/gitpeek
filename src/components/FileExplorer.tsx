import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon } from "lucide-react";
import { GitHubFile, buildFileTree } from "@/services/githubService";
import { Card } from "@/components/ui/card";

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
}

const FileTreeNode = ({ node, level, onToggle, expandedPaths, onFileClick, expandedFile, fileContent, fileLoading, renderChildren }: TreeNodeProps & { renderChildren: (node: GitHubFile, level: number) => React.ReactNode }) => {
  const isFolder = node.type === 'dir';
  const isExpanded = expandedPaths.has(node.path);
  const isFileExpanded = expandedFile === node.path;

  return (
    <div>
      <div
        className={`
          flex items-center py-1 px-2 hover:bg-secondary cursor-pointer rounded-md
          ${level === 0 ? 'mt-1' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => {
          if (isFolder) onToggle(node.path);
          else onFileClick(node.path);
        }}
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
          <FileIcon className="h-4 w-4 text-muted-foreground mr-2" />
        )}

        <span className="text-sm">
          {node.name}
        </span>
      </div>

      {isFolder && isExpanded && (
        <div>
          {/** Render children for expanded folders */}
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
                  renderChildren={renderChildren}
                />
              ))
            : <span className="text-xs text-muted-foreground ml-8">(empty)</span>
          }
        </div>
      )}

      {/* File content expansion */}
      {!isFolder && isFileExpanded && (
        <div className="bg-muted rounded p-2 ml-8 mt-1 overflow-x-auto text-xs font-mono max-h-96">
          {fileLoading ? (
            <span className="text-muted-foreground">Loading file...</span>
          ) : fileContent ? (
            <pre className="whitespace-pre-wrap">{fileContent}</pre>
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

  // Load root files when component mounts
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      const rootFiles = await buildFileTree(owner, repo);
      setFiles(rootFiles);
      setIsLoading(false);
    };
    loadFiles();
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
      // Fetch file content from GitHub API
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

  // Helper to recursively render children for folders
  const renderChildren = (node: GitHubFile, level: number) => {
    if (node.type === 'dir' && expandedPaths.has(node.path) && node.children) {
      return node.children.map(child => (
        <FileTreeNode
          key={child.path}
          node={child}
          level={level + 1}
          onToggle={handleToggle}
          expandedPaths={expandedPaths}
          onFileClick={handleFileClick}
          expandedFile={expandedFile}
          fileContent={expandedFile === child.path ? fileContent : null}
          fileLoading={expandedFile === child.path ? fileLoading : false}
          renderChildren={renderChildren}
        />
      ));
    }
    return null;
  };

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
            renderChildren={renderChildren}
          />
        ))}
      </div>
    </Card>
  );
}
