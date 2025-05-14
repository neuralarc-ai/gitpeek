import React, { useState, useMemo, useRef, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import * as Dialog from "@radix-ui/react-dialog";
import { FileIcon, FolderIcon, X, ExternalLink, Search } from "lucide-react";
import * as d3 from "d3";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fileService } from "@/services/fileService";
import { toast } from "@/components/ui/sonner";

interface TreeNode {
  name: string;
  children?: TreeNode[];
  path?: string;
}

interface MindmapTreeProps {
  data: TreeNode | null;
  width?: number;
  height?: number;
  owner: string;
  repo: string;
}

interface GraphNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: GraphNode[];
  val?: number;
  level?: number;
  x?: number;
  y?: number;
  path?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Add Safari-specific styles and optimizations
const safariStyles = `
  @supports (-webkit-touch-callout: none) {
    .safari-optimized {
      -webkit-font-smoothing: antialiased;
      -webkit-backface-visibility: hidden;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    
    .safari-blur {
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }
    
    .safari-glow {
      -webkit-filter: drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 8px #4ade80);
      filter: drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 8px #4ade80);
    }
  }
`;

// Update the glow animation for Safari
const glowAnimation = `
@keyframes glow {
  0% { 
    -webkit-filter: drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 8px #4ade80);
    filter: drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 8px #4ade80);
  }
  50% { 
    -webkit-filter: drop-shadow(0 0 8px #4ade80) drop-shadow(0 0 16px #4ade80);
    filter: drop-shadow(0 0 8px #4ade80) drop-shadow(0 0 16px #4ade80);
  }
  100% { 
    -webkit-filter: drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 8px #4ade80);
    filter: drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 8px #4ade80);
  }
}
`;

export const MindmapTree: React.FC<MindmapTreeProps> = ({
  data,
  width = 1280,
  height = 720,
  owner,
  repo,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileType, setFileType] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchingNodes, setMatchingNodes] = useState<GraphNode[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fgRef = useRef<any>();

  const fileTypes = [
    { value: "all", label: "All Files" },
    { value: "ts", label: "TypeScript" },
    { value: "tsx", label: "TSX" },
    { value: "js", label: "JavaScript" },
    { value: "jsx", label: "JSX" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "md", label: "Markdown" },
  ];

  // Add Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Optimize graph rendering for Safari
  const graphConfig = useMemo(() => ({
    nodeAutoColorBy: "type",
    nodeLabel: "name",
    linkColor: () => "#666",
    linkWidth: 1,
    nodeRelSize: 6,
    cooldownTicks: isSafari ? 150 : 100, // Increase cooldown for Safari
    linkDirectionalParticles: isSafari ? 1 : 2, // Reduce particles for Safari
    linkDirectionalParticleSpeed: 0.005,
    linkDirectionalParticleWidth: 2,
    linkDirectionalParticleColor: () => "#666",
    d3AlphaDecay: isSafari ? 0.02 : 0.01, // Adjust for Safari performance
    d3VelocityDecay: isSafari ? 0.3 : 0.4, // Adjust for Safari performance
  }), [isSafari]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchBox(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      // Escape to clear search
      if (e.key === 'Escape' && showSearchBox) {
        setShowSearchBox(false);
        setSearchQuery("");
        resetSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showSearchBox]);

  const resetSearch = () => {
    if (fgRef.current) {
      const currentData = {
        nodes: [...graphData.nodes],
        links: [...graphData.links]
      };
      
      // Reset all nodes to original colors
      currentData.nodes.forEach((node: GraphNode) => {
        node.color = node.type === "folder" ? "#58a6ff" : "#c9d1d9";
      });
      
      fgRef.current.graphData = currentData;
      fgRef.current.zoomToFit(400);
      setMatchingNodes([]);
      setCurrentMatchIndex(0);
    }
  };

  const navigateToNextMatch = () => {
    if (matchingNodes.length === 0) return;
    
    const nextIndex = (currentMatchIndex + 1) % matchingNodes.length;
    setCurrentMatchIndex(nextIndex);
    
    const node = matchingNodes[nextIndex];
    if (fgRef.current && node) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3.5, 1000);
    }
  };

  const navigateToPreviousMatch = () => {
    if (matchingNodes.length === 0) return;
    
    const prevIndex = (currentMatchIndex - 1 + matchingNodes.length) % matchingNodes.length;
    setCurrentMatchIndex(prevIndex);
    
    const node = matchingNodes[prevIndex];
    if (fgRef.current && node) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3.5, 1000);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      resetSearch();
      return;
    }

    setIsSearching(true);
    try {
      const currentData = {
        nodes: [...graphData.nodes],
        links: [...graphData.links]
      };

      const matches = currentData.nodes.filter((node: GraphNode) => {
        if (fileType !== 'all' && node.type === 'folder') {
          return false;
        }

        const nodeName = node.name.toLowerCase();
        const searchTerm = searchQuery.toLowerCase();

        const nameMatches = nodeName.includes(searchTerm);
        const typeMatches = fileType === 'all' || 
          (node.path && node.path.toLowerCase().endsWith(`.${fileType}`));

        return nameMatches && typeMatches;
      });

      if (matches.length === 0) {
        toast.info("No matching files found");
        resetSearch();
        return;
      }
      
      // Reset all nodes
      currentData.nodes.forEach((node: GraphNode) => {
        node.color = node.type === "folder" ? "#58a6ff" : "#c9d1d9";
      });

      // Highlight matching nodes with brighter green
      matches.forEach((node: GraphNode) => {
        node.color = "#4ade80"; // Brighter green color for matches
      });

      if (fgRef.current) {
        fgRef.current.graphData = currentData;
        setMatchingNodes(matches);
        setCurrentMatchIndex(0);
        
        if (matches.length > 0) {
          const firstMatch = matches[0];
          setTimeout(() => {
            if (fgRef.current) {
              fgRef.current.centerAt(firstMatch.x, firstMatch.y, 1000);
              fgRef.current.zoom(3.5, 1000);
            }
          }, 100);
        }
      }

      if (matches.length === 1) {
        toast.success(`Found 1 matching file: ${matches[0].name}`);
      } else {
        toast.success(`Found ${matches.length} matching files. Use ← → to navigate`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search files");
    } finally {
      setIsSearching(false);
    }
  };

  // Add keyboard navigation for search results
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (matchingNodes.length > 0) {
        if (e.key === 'ArrowRight') {
          navigateToNextMatch();
        } else if (e.key === 'ArrowLeft') {
          navigateToPreviousMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [matchingNodes, currentMatchIndex]);

  // Convert tree data to graph format
  const graphData = useMemo<GraphData>(() => {
    if (!data) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    let nodeId = 0;

    const processNode = (node: TreeNode, parentId?: string, level: number = 0, parentPath: string = ""): GraphNode => {
      const id = `node-${nodeId++}`;
      const isFolder = node.children && node.children.length > 0;
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      const graphNode: GraphNode = {
        id,
        name: node.name,
        type: isFolder ? "folder" : "file",
        children: node.children?.map(child => processNode(child, id, level + 1, currentPath)),
        val: isFolder ? 2 : 1,
        level,
        path: currentPath,
        x: level * 200,
        y: 0
      };

      nodes.push(graphNode);

      if (parentId) {
        links.push({ source: parentId, target: id });
      }

      return graphNode;
    };

    processNode(data);
    return { nodes, links };
  }, [data]);

  const getGitHubUrl = (node: GraphNode) => {
    if (!node.path) return null;
    
    // Get the correct path without any src/pages prefix
    let path = node.path;
    if (path.startsWith(`${repo}/`)) {
      path = path.slice(repo.length + 1);
    }
    // Remove src/pages prefix if it exists
    path = path.replace(/^src\/pages\//, '');
    
    // Use blob for files and tree for directories
    const type = node.type === "folder" ? "tree" : "blob";
    
    // Use master branch instead of main
    return `https://github.com/${owner}/${repo}/${type}/master/${path}`;
  };

  // Initialize the graph and zoom to fit
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  }, [data]);

  // Add this function to handle node glow
  const getNodeStyle = (node: GraphNode) => {
    if (node.color === "#ffd700") {
      return {
        animation: "glow 2s ease-in-out infinite",
      };
    }
    return {};
  };

  return (
    <div className="relative safari-optimized">
      <style>{safariStyles}</style>
      <style>{glowAnimation}</style>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-background/95 safari-blur p-2 rounded-lg border border-white/20 shadow-lg">
          <div className="relative">
            <Input
              ref={searchInputRef}
              placeholder="Search files... (⌘K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === "") {
                  resetSearch();
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-[300px] bg-white/10 safari-blur border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-200"
              style={{
                WebkitAppearance: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  resetSearch();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                style={{
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger 
              className="w-[120px] bg-white/10 safari-blur border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-200"
              style={{
                WebkitAppearance: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {fileTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="bg-primary/10 hover:bg-primary/20 safari-blur border border-white/20 focus:ring-1 focus:ring-primary/50 transition-all duration-200"
            style={{
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isSearching ? "Searching..." : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>Press Enter to search, Esc to clear</span>
            {matchingNodes.length > 0 && (
              <span className="flex items-center gap-1">
                <span>← → to navigate</span>
                <span className="px-2 py-0.5 bg-green-500/20 rounded text-green-500">
                  {currentMatchIndex + 1}/{matchingNodes.length}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={1280}
        height={720}
        {...graphConfig}
        onNodeClick={(node) => {
          setSelectedNode(node);
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter`;
          
          // Draw node icon
          const iconSize = 16 / globalScale;
          const iconX = node.x! - iconSize / 2;
          const iconY = node.y! - iconSize / 2;
          
          // Apply enhanced glow effect for matching nodes
          if (node.color === "#4ade80") {
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          
          if (node.type === "folder") {
            ctx.fillStyle = "#58a6ff";
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 6 / globalScale, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillStyle = node.color === "#4ade80" ? "#4ade80" : "#c9d1d9";
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 4 / globalScale, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Reset shadow
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Draw label with enhanced visibility for matching nodes
          ctx.fillStyle = node.color === "#4ade80" ? "#4ade80" : "#c9d1d9";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, node.x!, node.y! + 15 / globalScale);
        }}
        onNodeDrag={(node) => {
          if (!node) return;
          node.fx = node.x;
          node.fy = node.y;
        }}
      />

      <Dialog.Root open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 safari-blur" />
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-gitpeek-card border border-gitpeek-border text-foreground p-6 rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 safari-optimized">
            <Dialog.Description className="sr-only">
              Details for {selectedNode?.name}
            </Dialog.Description>
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                {selectedNode?.type === "folder" ? (
                  <FolderIcon className="h-5 w-5 text-[#58a6ff]" />
                ) : (
                  <FileIcon className="h-5 w-5 text-[#c9d1d9]" />
                )}
                {selectedNode?.name}
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded-md">
                  {selectedNode?.type === "folder" ? "Directory" : "File"}
                </span>
                {selectedNode?.level !== undefined && (
                  <span className="px-2 py-1 bg-muted rounded-md">
                    Level {selectedNode.level}
                  </span>
                )}
              </div>

              {selectedNode?.path && (
                <a
                  href={getGitHubUrl(selectedNode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#58a6ff] hover:text-[#58a6ff]/80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on GitHub
                </a>
              )}

              {selectedNode?.children && selectedNode.children.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-[#58a6ff]" />
                    Contents
                  </h4>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                    {selectedNode.children.map((child) => (
                      <button
                        key={child.id}
                        className="w-full text-left text-sm flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedNode(child)}
                      >
                        {child.type === "folder" ? (
                          <FolderIcon className="h-4 w-4 text-[#58a6ff]" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-[#c9d1d9]" />
                        )}
                        <span className="truncate">{child.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode?.type === "file" && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">File Information</h4>
                  <div className="text-sm text-muted-foreground">
                    Click on the file in the visualization to view its contents.
                  </div>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
