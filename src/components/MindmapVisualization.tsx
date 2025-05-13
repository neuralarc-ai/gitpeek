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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);

  // Generate cache key
  const cacheKey = useMemo(() => `${owner}/${repo}`, [owner, repo]);

  // Process tree nodes with Web Worker
  const processTreeNodesWithWorker = useCallback(async (files: any[]): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!worker) {
        // Fallback to synchronous processing if worker is not available
        resolve(files.map(file => ({
          name: file.name,
          children: file.type === "dir" ? (file.children || []) : undefined
        })));
        return;
      }

      const processedChunks: any[] = [];
      
      worker.onmessage = (e) => {
        const { type, data, progress } = e.data;
        
        if (type === 'progress') {
          processedChunks.push(...data);
          setLoadingProgress(progress);
        } else if (type === 'complete') {
          resolve(processedChunks);
        }
      };

      worker.postMessage({ 
        files, 
        repo,
        chunkSize: 25 // Smaller chunks for more frequent updates
      });
    });
  }, [repo]);

  useEffect(() => {
    // If we have initial data, use it immediately
    if (initialData) {
      setTreeData(initialData);
      setLoading(false);
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
      setLoadingProgress(0);
      
      try {
        setIsProgressiveLoading(true);
        
        // Fetch the full recursive file tree
        const files = await buildFileTree(owner, repo);
        
        // Process first batch immediately for instant display
        const firstBatch = files.slice(0, 50);
        const processedFirstBatch = await processTreeNodesWithWorker(firstBatch);
        
        setTreeData({
          name: repo,
          children: processedFirstBatch
        });

        // Process remaining files in the background
        const remainingFiles = files.slice(50);
        const processedRemaining = await processTreeNodesWithWorker(remainingFiles);

        // Update tree with all processed data
        setTreeData(prev => ({
          name: repo,
          children: [...(prev?.children || []), ...processedRemaining]
        }));

        // Cache the complete tree
        treeDataCache.set(cacheKey, {
          data: {
            name: repo,
            children: [...processedFirstBatch, ...processedRemaining]
          },
          timestamp: Date.now()
        });
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
        setIsProgressiveLoading(false);
        setLoadingProgress(1);
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
        <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          Loading tree structure... {Math.round(loadingProgress * 100)}%
        </div>
      )}
    </div>
  );
}
