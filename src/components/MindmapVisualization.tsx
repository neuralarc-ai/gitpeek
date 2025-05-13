import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MindmapTree } from "./MindmapTree";
import { buildFileTree } from "@/services/githubService";
import { FileTree } from "@/types/fileTree";
import { GitHubFile } from "@/types/github";

export interface MindmapVisualizationProps {
  fileTree: FileTree;
}

// Cache for storing tree data with expiration
const treeDataCache = new Map<string, { data: FileTree; timestamp: number }>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

export const MindmapVisualization = ({ fileTree }: MindmapVisualizationProps) => {
  const [treeData, setTreeData] = useState<FileTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const cacheKey = `${fileTree.owner}/${fileTree.repo}`;

  // Initialize web worker
  useEffect(() => {
    const worker = new Worker(new URL('../workers/treeProcessor.ts', import.meta.url));
    setWorker(worker);
    return () => worker.terminate();
  }, []);

  // Process tree nodes with web worker
  const processTreeNodesWithWorker = useCallback(async (nodes: GitHubFile[]): Promise<FileTree[]> => {
    if (!worker) return nodes.map(node => ({
      name: node.name,
      type: node.type === 'dir' ? 'directory' : 'file',
      path: node.path,
      size: node.size,
      children: node.type === 'dir' ? [] : undefined,
      lastModified: node.lastModified,
      language: node.language,
      content: node.content,
      url: node.url,
      owner: fileTree.owner,
      repo: fileTree.repo
    }));

    return new Promise<FileTree[]>((resolve) => {
      worker.onmessage = (e) => {
        resolve(e.data);
      };
      worker.postMessage(nodes);
    });
  }, [worker, fileTree.owner, fileTree.repo]);

  useEffect(() => {
    // If we have initial data, use it immediately
    if (fileTree) {
      setTreeData(fileTree);
      setLoading(false);
      treeDataCache.set(cacheKey, { data: fileTree, timestamp: Date.now() });
      return;
    }

    // Check cache first
    const cached = treeDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      setTreeData(cached.data);
      setLoading(false);
      return;
    }

    const fetchTreeData = async () => {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      
      try {
        setIsProgressiveLoading(true);
        
        // Fetch the full recursive file tree
        const files = await buildFileTree(fileTree.owner, fileTree.repo);
        
        // Process files in larger batches for better performance
        const batchSize = 100; // Increased batch size
        const batches = [];
        for (let i = 0; i < files.length; i += batchSize) {
          batches.push(files.slice(i, i + batchSize));
        }

        // Process first batch immediately
        const firstBatch = batches[0];
        const processedFirstBatch = await processTreeNodesWithWorker(firstBatch);
        
        const initialTree: FileTree = {
          name: fileTree.repo,
          type: 'directory',
          path: '',
          size: 0,
          children: processedFirstBatch,
          owner: fileTree.owner,
          repo: fileTree.repo
        };
        
        setTreeData(initialTree);

        // Process remaining batches in parallel
        const remainingBatches = batches.slice(1);
        const processedBatches = await Promise.all(
          remainingBatches.map(batch => processTreeNodesWithWorker(batch))
        );

        // Update tree with all processed data
        setTreeData(prev => ({
          ...prev!,
          children: [
            ...(prev?.children || []),
            ...processedBatches.flat()
          ]
        }));

        // Cache the complete tree
        treeDataCache.set(cacheKey, {
          data: {
            ...initialTree,
            children: [...processedFirstBatch, ...processedBatches.flat()]
          },
          timestamp: Date.now()
        });

        setLoadingProgress(1);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
        setIsProgressiveLoading(false);
      }
    };

    fetchTreeData();
  }, [fileTree, cacheKey, processTreeNodesWithWorker]);

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!treeData) {
    return null;
  }

  // Calculate dimensions based on container size
  const containerWidth = 630;
  const containerHeight = 450;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <MindmapTree 
        data={treeData} 
        width={containerWidth} 
        height={containerHeight}
        owner={fileTree.owner}
        repo={fileTree.repo}
      />
      {isProgressiveLoading && (
        <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          Loading tree structure... {Math.round(loadingProgress * 100)}%
        </div>
      )}
    </div>
  );
};
