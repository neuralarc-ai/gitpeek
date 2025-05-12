import React, { useState, useEffect } from "react";
import { MindmapTree } from "./MindmapTree";
import { buildFileTree } from "@/services/githubService";

interface MindmapVisualizationProps {
  owner: string;
  repo: string;
}

export function MindmapVisualization({ owner, repo }: MindmapVisualizationProps) {
  const [treeData, setTreeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the full recursive file tree
      const files = await buildFileTree(owner, repo);
      // Convert to MindmapTree format: root node with children
      const tree = {
        name: repo,
        children: files.map(f => fileToTreeNode(f)),
      };
      setTreeData(tree);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
    setLoading(false);
  };

    fetchTreeData();
  }, [owner, repo]);

  // Helper to convert GitHubFile to MindmapTree node
  function fileToTreeNode(file: any): any {
    if (file.type === "dir") {
      return {
        name: file.name,
        children: (file.children || []).map(fileToTreeNode),
      };
    } else {
      return { name: file.name };
    }
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!treeData) {
    return null;
  }

  // Calculate dimensions based on container size
  const containerWidth = 630; // 2/3 of the grid column
  const containerHeight = 450; // 90% of the card height

  return (
    <div className="w-full h-full flex items-center justify-center">
      <MindmapTree 
        data={treeData} 
        width={containerWidth} 
        height={containerHeight}
        owner={owner}
        repo={repo}
      />
        </div>
  );
}
