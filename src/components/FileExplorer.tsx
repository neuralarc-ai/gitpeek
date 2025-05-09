
import { useState } from "react";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon } from "lucide-react";

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  expanded?: boolean;
}

// This is mock data for now, would be replaced with actual repo data
const mockFileTree: TreeNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    expanded: true,
    children: [
      {
        id: "1-1",
        name: "components",
        type: "folder",
        children: [
          { id: "1-1-1", name: "Button.tsx", type: "file" },
          { id: "1-1-2", name: "Card.tsx", type: "file" },
          { id: "1-1-3", name: "Modal.tsx", type: "file" },
        ]
      },
      {
        id: "1-2",
        name: "hooks",
        type: "folder",
        children: [
          { id: "1-2-1", name: "useAuth.ts", type: "file" },
          { id: "1-2-2", name: "useFetch.ts", type: "file" },
        ]
      },
      { id: "1-3", name: "App.tsx", type: "file" },
      { id: "1-4", name: "index.tsx", type: "file" },
    ]
  },
  {
    id: "2",
    name: "public",
    type: "folder",
    children: [
      { id: "2-1", name: "favicon.ico", type: "file" },
      { id: "2-2", name: "index.html", type: "file" },
    ]
  },
  { id: "3", name: "package.json", type: "file" },
  { id: "4", name: "tsconfig.json", type: "file" },
  { id: "5", name: "README.md", type: "file" },
];

interface FileTreeNodeProps {
  node: TreeNode;
  level: number;
  onToggle: (id: string) => void;
}

const FileTreeNode = ({ node, level, onToggle }: FileTreeNodeProps) => {
  const isFolder = node.type === 'folder';
  
  return (
    <div>
      <div 
        className={`
          flex items-center py-1 px-2 hover:bg-secondary cursor-pointer rounded-md
          ${level === 0 ? 'mt-1' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => isFolder && onToggle(node.id)}
      >
        {isFolder ? (
          node.expanded ? (
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
      
      {isFolder && node.expanded && node.children?.map((child) => (
        <FileTreeNode 
          key={child.id} 
          node={child} 
          level={level + 1}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

export function FileExplorer() {
  const [treeData, setTreeData] = useState<TreeNode[]>(mockFileTree);
  
  const handleToggle = (id: string) => {
    const toggleNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map(node => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    
    setTreeData(toggleNode(treeData));
  };
  
  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar p-2">
      <div className="font-jetbrains">
        {treeData.map(node => (
          <FileTreeNode 
            key={node.id} 
            node={node} 
            level={0}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
