import React, { useState } from "react";
import { MindmapTree } from "./MindmapTree";
import { Card } from "@/components/ui/card";
import { buildFileTree } from "@/services/githubService";

interface MindmapVisualizationProps {
  owner: string;
  repo: string;
}

export function MindmapVisualization({ owner, repo }: MindmapVisualizationProps) {
  const [treeData, setTreeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
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

  return (
    <Card className="w-full h-full flex flex-col items-center justify-center p-8">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: "10px 24px",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 18,
          marginBottom: 24,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Analyzing..." : "Analyze the repository"}
      </button>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {treeData && (
        <div style={{ width: 900, height: 900 }}>
          <MindmapTree data={treeData} width={900} height={900} />
        </div>
      )}
    </Card>
  );
}
