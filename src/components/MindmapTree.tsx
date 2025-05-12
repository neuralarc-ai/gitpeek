import React, { useState, useMemo, useRef, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import * as Dialog from "@radix-ui/react-dialog";
import { FileIcon, FolderIcon, X, ExternalLink } from "lucide-react";
import * as d3 from "d3";

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

export const MindmapTree: React.FC<MindmapTreeProps> = ({
  data,
  width = 1280,
  height = 720,
  owner,
  repo,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const fgRef = useRef<any>();

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
    // Remove the repo name from the path if it exists
    const path = node.path.startsWith(`${repo}/`) ? node.path.slice(repo.length + 1) : node.path;
    return `https://github.com/${owner}/${repo}/tree/main/${path}`;
  };

  // Initialize the graph and zoom to fit
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  }, [data]);

  return (
    <>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={1280}
        height={720}
        nodeAutoColorBy="type"
        nodeLabel="name"
        linkColor={() => "#666"}
        linkWidth={1}
        nodeRelSize={6}
        cooldownTicks={100}
        onNodeClick={(node) => {
          setSelectedNode(node);
        }}
        // Force layout configuration for tree structure
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => "#666"}
        // Node rendering
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter`;
          
          // Draw node icon
          const iconSize = 16 / globalScale;
          const iconX = node.x! - iconSize / 2;
          const iconY = node.y! - iconSize / 2;
          
          if (node.type === "folder") {
            ctx.fillStyle = "#58a6ff";
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 6 / globalScale, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillStyle = "#c9d1d9";
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 4 / globalScale, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Draw label
          ctx.fillStyle = "#c9d1d9";
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
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-gitpeek-card border border-gitpeek-border text-foreground p-6 rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2">
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
    </>
  );
};
