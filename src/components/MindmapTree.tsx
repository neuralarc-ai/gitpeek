import React, { useState, useMemo, useRef, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import * as Dialog from "@radix-ui/react-dialog";
import { FileIcon, FolderIcon } from "lucide-react";
import * as d3 from "d3";

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

interface MindmapTreeProps {
  data: TreeNode | null;
  width?: number;
  height?: number;
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
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const fgRef = useRef<any>();

  // Convert tree data to graph format
  const graphData = useMemo<GraphData>(() => {
    if (!data) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    let nodeId = 0;

    const processNode = (node: TreeNode, parentId?: string, level: number = 0): GraphNode => {
      const id = `node-${nodeId++}`;
      const isFolder = node.children && node.children.length > 0;
      
      const graphNode: GraphNode = {
        id,
        name: node.name,
        type: isFolder ? "folder" : "file",
        children: node.children?.map(child => processNode(child, id, level + 1)),
        val: isFolder ? 2 : 1,
        level,
        x: level * 200, // Initial x position based on level
        y: 0 // Initial y position
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
        width={width}
        height={height}
        nodeAutoColorBy="type"
        nodeLabel="name"
        linkColor={() => "#666"}
        linkWidth={1}
        nodeRelSize={6}
        cooldownTicks={100}
        onNodeClick={(node) => {
          setSelectedNode(node);
        }}
        // Force layout configuration
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
        // Link rendering
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => "#666"}
        // Zoom and pan controls
        onWheel={(event) => {
          event.preventDefault();
          const zoom = fgRef.current.zoom();
          const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
          fgRef.current.zoom(zoom * zoomFactor);
        }}
        onMouseDown={(event) => {
          if (event.button === 0) { // Left click
            fgRef.current.pauseAnimation();
            const startPos = { x: event.clientX, y: event.clientY };
            const startZoom = fgRef.current.zoom();
            const startCenter = fgRef.current.center();

            const onMouseMove = (e: MouseEvent) => {
              const dx = e.clientX - startPos.x;
              const dy = e.clientY - startPos.y;
              fgRef.current.center({
                x: startCenter.x - dx / startZoom,
                y: startCenter.y - dy / startZoom
              });
            };

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
              fgRef.current.resumeAnimation();
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }
        }}
      />

      <Dialog.Root open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-[#161b22] text-white p-6 rounded-lg shadow-lg w-96 -translate-x-1/2 -translate-y-1/2">
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              {selectedNode?.type === "folder" ? (
                <FolderIcon className="h-5 w-5 text-[#58a6ff]" />
              ) : (
                <FileIcon className="h-5 w-5 text-[#c9d1d9]" />
              )}
              {selectedNode?.name}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Type: {selectedNode?.type}
            </Dialog.Description>
            {selectedNode?.children && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Contents:</h4>
                <ul className="space-y-1">
                  {selectedNode.children.map((child) => (
                    <li 
                      key={child.id}
                      className="text-sm flex items-center gap-2 cursor-pointer hover:text-[#58a6ff]"
                      onClick={() => setSelectedNode(child)}
                    >
                      {child.type === "folder" ? (
                        <FolderIcon className="h-4 w-4 text-[#58a6ff]" />
                      ) : (
                        <FileIcon className="h-4 w-4 text-[#c9d1d9]" />
                      )}
                      {child.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Dialog.Close className="mt-4 text-[#58a6ff] hover:text-[#58a6ff]/80 cursor-pointer">
              Close
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
