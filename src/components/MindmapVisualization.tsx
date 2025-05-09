
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { RepoData, RepoLanguages } from "@/services/githubService";

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
  color?: string;
}

interface MindmapVisualizationProps {
  repoData: RepoData | null;
  languages: RepoLanguages | null;
  isLoading: boolean;
}

export function MindmapVisualization({ repoData, languages, isLoading }: MindmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mindmapData, setMindmapData] = useState<MindmapNode | null>(null);

  // Build mindmap data from repository information
  useEffect(() => {
    if (!repoData || !languages) return;

    const rootNode: MindmapNode = {
      id: "root",
      label: repoData.name,
      children: [
        {
          id: "info",
          label: "Info",
          children: [
            { id: "owner", label: `Owner: ${repoData.owner.login}` },
            { id: "stars", label: `Stars: ${repoData.stargazers_count}` },
            { id: "forks", label: `Forks: ${repoData.forks_count}` },
            { id: "issues", label: `Issues: ${repoData.open_issues_count}` },
          ]
        },
        {
          id: "languages",
          label: "Languages",
          children: Object.keys(languages).map((lang, i) => ({
            id: `lang-${i}`,
            label: lang,
            color: getRandomColor(i),
          })),
        }
      ],
    };

    setMindmapData(rootNode);
  }, [repoData, languages]);

  // Simple mindmap rendering using canvas
  useEffect(() => {
    if (!canvasRef.current || !mindmapData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Basic mindmap drawing
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw root node
    ctx.fillStyle = "#3b82f6"; // Blue color for root
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw root label
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(mindmapData.label, centerX, centerY);

    // Draw first level nodes
    const firstLevelCount = mindmapData.children?.length || 0;
    mindmapData.children?.forEach((child, i) => {
      const angle = (Math.PI * 2 * i) / firstLevelCount - Math.PI / 2;
      const x = centerX + Math.cos(angle) * 150;
      const y = centerY + Math.sin(angle) * 150;
      
      // Draw line to child
      ctx.strokeStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Draw child node
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw child label
      ctx.fillStyle = "#ffffff";
      ctx.fillText(child.label, x, y);
      
      // Draw second level nodes
      const secondLevelCount = child.children?.length || 0;
      child.children?.forEach((grandchild, j) => {
        const spreadAngle = Math.PI / 4; // Angle to spread children
        const childAngle = angle - spreadAngle / 2 + (spreadAngle * j) / (secondLevelCount - 1 || 1);
        const gx = x + Math.cos(childAngle) * 80;
        const gy = y + Math.sin(childAngle) * 80;
        
        // Draw line to grandchild
        ctx.strokeStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(gx, gy);
        ctx.stroke();
        
        // Draw grandchild node
        ctx.fillStyle = grandchild.color || "#94a3b8";
        ctx.beginPath();
        ctx.arc(gx, gy, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw grandchild label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.fillText(grandchild.label, gx, gy);
      });
    });
  }, [mindmapData]);

  function getRandomColor(index: number): string {
    const colors = [
      "#3b82f6", // blue
      "#ef4444", // red
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#06b6d4", // cyan
    ];
    return colors[index % colors.length];
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading mindmap visualization...</p>
      </Card>
    );
  }

  if (!repoData) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Repository data unavailable</p>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </Card>
  );
}
