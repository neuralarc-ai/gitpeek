import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MindmapTree } from "./MindmapTree";
import { buildFileTree } from "@/services/githubService";

interface MindmapVisualizationProps {
  owner: string;
  repo: string;
  initialData?: any;
  isLoading?: boolean;
}

// Cache for storing tree data with expiration
const treeDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

// Worker for processing tree data
let worker: Worker | null = null;
if (typeof window !== 'undefined') {
  worker = new Worker(new URL('../workers/treeProcessor.worker.ts', import.meta.url));
}

export function MindmapVisualization({ owner, repo, initialData, isLoading }: MindmapVisualizationProps) {
  const [treeData, setTreeData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);

  // Generate cache key
  const cacheKey = useMemo(() => `${owner}/${repo}`, [owner, repo]);

  // Memoized tree node conversion
  const fileToTreeNode = useCallback((file: any): any => {
    if (file.type === "dir") {
      return {
        name: file.name,
        children: file.children ? file.children.map(fileToTreeNode) : [],
      };
    }
    return { name: file.name };
  }, []);

  // Process tree nodes with Web Worker
  const processTreeNodesWithWorker = useCallback(async (files: any[]): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!worker) {
        // Fallback to synchronous processing if worker is not available
        resolve(files.map(fileToTreeNode));
        return;
      }

      worker.onmessage = (e) => {
        resolve(e.data);
      };

      worker.postMessage({ files, repo });
    });
  }, [fileToTreeNode, repo]);

  useEffect(() => {
    // If we have initial data, use it immediately
    if (initialData) {
      setTreeData(initialData);
      setLoading(false);
      // Store in cache with timestamp
      treeDataCache.set(cacheKey, { data: initialData, timestamp: Date.now() });
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
      try {
        setIsProgressiveLoading(true);
        
        // Fetch the full recursive file tree
        const files = await buildFileTree(owner, repo);
        
        // Process tree nodes in chunks with Web Worker
        const BATCH_SIZE = 100; // Increased batch size
        const chunks = [];
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          chunks.push(files.slice(i, i + BATCH_SIZE));
        }

        // Process first chunk immediately for instant display
        const firstChunk = await processTreeNodesWithWorker(chunks[0]);
        setTreeData({
          name: repo,
          children: firstChunk
        });

        // Process remaining chunks in parallel
        const remainingChunks = chunks.slice(1);
        const processedChunks = await Promise.all(
          remainingChunks.map(chunk => processTreeNodesWithWorker(chunk))
        );

        // Combine all chunks
        const allChildren = [...firstChunk, ...processedChunks.flat()];
        const finalTree = {
          name: repo,
          children: allChildren
        };

        setTreeData(finalTree);
        // Store in cache with timestamp
        treeDataCache.set(cacheKey, { data: finalTree, timestamp: Date.now() });
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
        setIsProgressiveLoading(false);
      }
    };

    fetchTreeData();

    // Cleanup
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [owner, repo, initialData, cacheKey, processTreeNodesWithWorker]);

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (loading || isLoading) {
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
        owner={owner}
        repo={repo}
      />
      {isProgressiveLoading && (
        <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1 rounded-full text-sm">
          Loading tree structure...
        </div>
      )}
    </div>
  );
}
