import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from "./FileExplorer";
import { MindmapVisualization } from "./MindmapVisualization";
import { fetchRepoData, fetchRepoLanguages, fetchRepoReadme, fetchRepoContributors, fetchRepoStats, buildFileTree } from "@/services/githubService";
import { analyzeRepository } from "@/services/geminiService";
import { toast } from "@/components/ui/sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { AIRepositoryAssistant } from "./AIRepositoryAssistant";

// Lazy load documentation tabs
const OverviewTab = lazy(() => import("./documentation/OverviewTab").then(module => ({ default: module.OverviewTab })));
const CodeTab = lazy(() => import("./documentation/CodeTab").then(module => ({ default: module.CodeTab })));
const ReadmeTab = lazy(() => import("./documentation/ReadmeTab").then(module => ({ default: module.ReadmeTab })));
const ContributorsTab = lazy(() => import("./documentation/ContributorsTab").then(module => ({ default: module.ContributorsTab })));
const InstallationTab = lazy(() => import("./documentation/InstallationTab").then(module => ({ default: module.InstallationTab })));
const StatisticsTab = lazy(() => import("./documentation/StatisticsTab").then(module => ({ default: module.StatisticsTab })));

// Loading component for lazy-loaded tabs
const TabLoading = () => (
  <div className="flex items-center justify-center h-[500px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

interface TabNavigationProps {
  owner: string;
  repo: string;
  activeTab?: string;
  onChangeTab?: (tab: string) => void;
  onAnalysisUpdate?: (analysis: {
    overview: string | null;
    architecture: string | null;
    installation: string | null;
    codeStructure: string | null;
  }) => void;
}

// Cache for storing repository data
const repoDataCache = new Map<string, any>();

// Global variable to store mindmap data loading promise
let mindmapLoadingPromise: Promise<any> | null = null;

export function TabNavigation({ owner, repo, onChangeTab, onAnalysisUpdate }: TabNavigationProps) {
  // Inside tab state for the documentation sub-tabs
  const [docTab, setDocTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  
  // Repository data states
  const [repoData, setRepoData] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [readme, setReadme] = useState(null);
  const [contributors, setContributors] = useState(null);
  const [stats, setStats] = useState(null);
  const [analysis, setAnalysis] = useState({ 
    overview: null, 
    architecture: null, 
    installation: null,
    codeStructure: null
  });
  const [mindmapData, setMindmapData] = useState<any>(null);

  // Generate cache key
  const cacheKey = useMemo(() => `${owner}/${repo}`, [owner, repo]);

  // Memoize the handleTabChange function
  const handleTabChange = useMemo(() => (value: string) => {
    if (onChangeTab) onChangeTab(value);
  }, [onChangeTab]);

  // Start loading mindmap data immediately
  useEffect(() => {
    const loadMindmapData = async () => {
      try {
        // Check cache first
        const cachedData = repoDataCache.get(cacheKey);
        if (cachedData?.mindmapData) {
          setMindmapData(cachedData.mindmapData);
          return;
        }

        // Start loading mindmap data in parallel
        mindmapLoadingPromise = buildFileTree(owner, repo).then(files => ({
          name: repo,
          children: files.map(f => fileToTreeNode(f))
        }));

        const mindmapResult = await mindmapLoadingPromise;
        setMindmapData(mindmapResult);
      } catch (error) {
        console.error("Error loading mindmap data:", error);
      }
    };

    loadMindmapData();
  }, [owner, repo, cacheKey]);

  // Memoize the fetchData function
  const fetchData = useMemo(() => async () => {
    setIsLoading(true);
    try {
      // Check cache first
      const cachedData = repoDataCache.get(cacheKey);
      if (cachedData) {
        setRepoData(cachedData.repoData);
        setLanguages(cachedData.languages);
        setReadme(cachedData.readme);
        setContributors(cachedData.contributors);
        setStats(cachedData.stats);
        setMindmapData(cachedData.mindmapData);
        setAnalysis(cachedData.analysis);
        if (onAnalysisUpdate) {
          onAnalysisUpdate(cachedData.analysis);
        }
        setIsLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [
        repoDataResponse,
        languagesResponse,
        readmeResponse,
        contributorsResponse,
        statsResponse
      ] = await Promise.all([
        fetchRepoData(owner, repo),
        fetchRepoLanguages(owner, repo),
        fetchRepoReadme(owner, repo),
        fetchRepoContributors(owner, repo),
        fetchRepoStats(owner, repo)
      ]);

      // Update states
      setRepoData(repoDataResponse);
      setLanguages(languagesResponse);
      setReadme(readmeResponse);
      setContributors(contributorsResponse);
      setStats(statsResponse);
      
      // Wait for mindmap data if it's still loading
      if (mindmapLoadingPromise) {
        const mindmapResult = await mindmapLoadingPromise;
        setMindmapData(mindmapResult);
      }
      
      // Analyze repository using Gemini API
      let analysisResponse = null;
      if (repoDataResponse && languagesResponse) {
        analysisResponse = await analyzeRepository(repoDataResponse, languagesResponse, contributorsResponse);
        if (analysisResponse) {
          setAnalysis(analysisResponse);
          if (onAnalysisUpdate) {
            onAnalysisUpdate(analysisResponse);
          }
        }
      }

      // Cache the results
      repoDataCache.set(cacheKey, {
        repoData: repoDataResponse,
        languages: languagesResponse,
        readme: readmeResponse,
        contributors: contributorsResponse,
        stats: statsResponse,
        mindmapData: mindmapData,
        analysis: analysisResponse
      });
    } catch (error) {
      console.error("Error fetching repository data:", error);
      toast.error("Failed to load repository data");
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo, onAnalysisUpdate, cacheKey, mindmapData]);

  // Helper function to convert GitHubFile to MindmapTree node
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

  // Fetch repository data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize tab content to prevent unnecessary re-renders
  const documentationContent = useMemo(() => (
    <Tabs value={docTab} onValueChange={setDocTab} className="w-full mt-4">
      <div className="w-full flex justify-center px-4 py-2">
        <TabsList className="w-full max-w-4xl overflow-x-auto hide-scrollbar backdrop-blur-sm bg-background/60 border border-border/50 rounded-lg p-1 flex justify-center">
          <div className="flex space-x-1">
            <TabsTrigger value="overview" className="px-4 py-2">Overview</TabsTrigger>
            <TabsTrigger value="code" className="px-4 py-2">Code</TabsTrigger>
            <TabsTrigger value="contributors" className="px-4 py-2">Contributors</TabsTrigger>
            <TabsTrigger value="installation" className="px-4 py-2">Installation</TabsTrigger>
            <TabsTrigger value="statistics" className="px-4 py-2">Statistics</TabsTrigger>
            <TabsTrigger value="readme" className="px-4 py-2">README</TabsTrigger>
          </div>
        </TabsList>
      </div>
      
      <div className="mt-4 backdrop-blur-md bg-background/40 border border-border/50 rounded-lg p-6 min-h-[500px] shadow-lg">
        <Suspense fallback={<TabLoading />}>
          <TabsContent value="overview">
            <OverviewTab 
              overview={analysis.overview}
              repoData={repoData}
              languages={languages}
              stats={stats}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="code">
            <CodeTab 
              architecture={analysis.architecture}
              codeStructure={analysis.codeStructure}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="contributors">
            <ContributorsTab 
              contributors={contributors}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="installation">
            <InstallationTab 
              installation={analysis.installation}
              readme={readme}
              repoData={repoData}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="statistics">
            <StatisticsTab 
              stats={stats}
              languages={languages}
              repoData={repoData}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="readme">
            <ReadmeTab 
              readme={readme}
              isLoading={isLoading}
            />
          </TabsContent>
        </Suspense>
      </div>
    </Tabs>
  ), [docTab, analysis, repoData, languages, stats, readme, contributors, isLoading]);

  return (
    <div className="w-full">
      <Tabs defaultValue="mindmap" onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full max-w-4xl mx-auto overflow-x-auto hide-scrollbar backdrop-blur-sm bg-background/60 border border-border/50 rounded-lg p-1 flex justify-center">
          <div className="flex space-x-1">
            <TabsTrigger value="mindmap" className="px-4 py-2">Mindmap</TabsTrigger>
            <TabsTrigger value="documentation" className="px-4 py-2">Documentation</TabsTrigger>
            <TabsTrigger value="files" className="px-4 py-2">Files</TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="mindmap">
          <MindmapVisualization 
            owner={owner}
            repo={repo}
            initialData={mindmapData}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="documentation">
          {documentationContent}
        </TabsContent>

        <TabsContent value="files">
          <FileExplorer owner={owner} repo={repo} />
        </TabsContent>
      </Tabs>

      <AIRepositoryAssistant
        owner={owner}
        repo={repo}
        repoData={repoData}
        languages={languages}
        contributors={contributors}
        readme={readme}
        fileStructure={mindmapData ? flattenFileTree(mindmapData) : []}
      />
    </div>
  );
}

// Helper function to flatten the file tree into an array
function flattenFileTree(node: any, path: string = ''): any[] {
  const currentPath = path ? `${path}/${node.name}` : node.name;
  const result = [{
    path: currentPath,
    type: node.children ? 'directory' : 'file'
  }];

  if (node.children) {
    node.children.forEach((child: any) => {
      result.push(...flattenFileTree(child, currentPath));
    });
  }

  return result;
}
