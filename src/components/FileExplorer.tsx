
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
}

const FileTreeNode = ({ node, level, onToggle, expandedPaths }: TreeNodeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [children, setChildren] = useState<GitHubFile[]>([]);
  const isFolder = node.type === 'dir';
  const isExpanded = expandedPaths.has(node.path);
  
  return (
    <div>
      <div 
        className={`
          flex items-center py-1 px-2 hover:bg-secondary cursor-pointer rounded-md
          ${level === 0 ? 'mt-1' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => isFolder && onToggle(node.path)}
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
          {isLoading ? (
            <div className="text-sm text-muted-foreground pl-10 py-2">
              Loading...
            </div>
          ) : (
            <>
              {children.map((child) => (
                <FileTreeNode 
                  key={child.path} 
                  node={child} 
                  level={level + 1}
                  onToggle={onToggle}
                  expandedPaths={expandedPaths}
                />
              ))}
            </>
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
  
  const handleToggle = async (path: string) => {
    const newExpandedPaths = new Set(expandedPaths);
    
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
    }
    
    setExpandedPaths(newExpandedPaths);
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
          />
        ))}
      </div>
    </Card>
  );
}
