import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from "@/components/FileExplorer";
import { MindmapVisualization } from "@/components/MindmapVisualization";
import { fetchRepoData, fetchRepoLanguages, fetchRepoReadme, fetchRepoContributors, fetchRepoStats, buildFileTree } from "@/services/githubService";
import { analyzeRepository } from "@/services/geminiService";
import { toast } from "@/components/ui/sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { FileTree } from "@/types/fileTree";
import { glassmorphism } from "@/styles/design-system";
import { Terminal } from "lucide-react";

// Lazy load documentation tabs with prefetching
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

// Scanning animation component
const ScanningAnimation = () => (
  <div className="flex flex-col items-center justify-center h-[500px] space-y-6">
    <div className="text-center text-muted-foreground">
      <div className="animate-spin mb-4 mx-auto">
        <Terminal className="h-8 w-8" />
      </div>
      <p className="text-lg font-medium mb-2">Analyzing Repository</p>
      <p className="text-sm">Scanning files and generating insights...</p>
    </div>
    <div className="w-full max-w-md">
      <div className="relative h-2 bg-gitpeek-border/30 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-0 w-1/3 h-full bg-primary/20 animate-scan" />
        </div>
      </div>
    </div>
  </div>
);

interface TabNavigationProps {
  owner: string;
  repo: string;
  onAnalysisUpdate?: (analysis: any) => void;
}

// Helper function to convert GitHubFile to FileTree
const convertToFileTree = (file: any, owner: string, repo: string): FileTree => ({
  name: file.name,
  type: file.type === 'dir' ? 'directory' : 'file',
  path: file.path,
  size: file.size,
  children: file.children?.map((child: any) => convertToFileTree(child, owner, repo)) || [],
  lastModified: file.lastModified,
  language: file.language,
  content: file.content,
  url: file.url,
  owner,
  repo
});

// Cache for file tree data
const fileTreeCache = new Map<string, { data: FileTree; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function TabNavigation({ owner, repo, onAnalysisUpdate }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState("mindmap");
  const [fileTree, setFileTree] = useState<FileTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<any>(null);
  const [languages, setLanguages] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [contributors, setContributors] = useState<any[] | null>(null);
  const [overview, setOverview] = useState<string | null>(null);
  const navigate = useNavigate();

  // Memoize the cache key
  const cacheKey = useMemo(() => `${owner}/${repo}`, [owner, repo]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First verify the repository exists
        const initialRepoData = await fetchRepoData(owner, repo);
        if (!initialRepoData) {
          throw new Error("Repository not found or is private");
        }
        setRepoData(initialRepoData);

        // Then load all other data in parallel
        const [
          languagesData,
          readmeData,
          contributorsData,
          statsData,
          treeData
        ] = await Promise.allSettled([
          fetchRepoLanguages(owner, repo),
          fetchRepoReadme(owner, repo),
          fetchRepoContributors(owner, repo),
          fetchRepoStats(owner, repo),
          buildFileTree(owner, repo)
        ]);

        // Handle each result
        if (languagesData.status === 'fulfilled') setLanguages(languagesData.value);
        if (readmeData.status === 'fulfilled') setReadme(readmeData.value);
        if (contributorsData.status === 'fulfilled') setContributors(contributorsData.value);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (treeData.status === 'fulfilled') {
          const tree = treeData.value;
          setFileTree({
            name: repo,
            owner,
            repo,
            type: 'directory',
            path: '',
            children: tree.map(child => convertToFileTree(child, owner, repo))
          });
        }

        // Generate AI analysis if we have the necessary data
        if (initialRepoData && treeData.status === 'fulfilled') {
          try {
            const analysis = await analyzeRepository(initialRepoData, languagesData.status === 'fulfilled' ? languagesData.value : {});
            setOverview(analysis.overview);
            if (onAnalysisUpdate) {
              onAnalysisUpdate(analysis);
            }
          } catch (error) {
            console.error("Error analyzing repository:", error);
            // Don't throw here, just log the error
          }
        }
      } catch (error) {
        console.error("Error loading repository data:", error);
        setError("Failed to load repository data");
        toast.error("Failed to load repository data");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [owner, repo, navigate, onAnalysisUpdate]);

  // Prefetch documentation tab data when hovering
  const handleTabHover = (tab: string) => {
    if (tab === "documentation" && !isLoading) {
      // Prefetch documentation data
      import("./documentation/OverviewTab");
      import("./documentation/CodeTab");
      import("./documentation/ReadmeTab");
      import("./documentation/ContributorsTab");
      import("./documentation/InstallationTab");
      import("./documentation/StatisticsTab");
    }
  };

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
        <TabsTrigger value="documentation">Documentation</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>

      <TabsContent value="mindmap" className="mt-6">
        {isLoading ? (
          <TabLoading />
        ) : fileTree ? (
          <MindmapVisualization fileTree={fileTree} />
        ) : (
          <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
            <p className="text-muted-foreground">No file tree data available</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="documentation" className="mt-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="readme">README</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Suspense fallback={<TabLoading />}>
              <OverviewTab
                overview={overview}
                repoData={repoData}
                languages={languages}
                stats={stats}
                isLoading={isLoading}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="code">
            <Suspense fallback={<TabLoading />}>
              <CodeTab
                architecture={overview || ""}
                codeStructure={fileTree || undefined}
                isLoading={isLoading}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="contributors">
            <Suspense fallback={<TabLoading />}>
              <ContributorsTab
                contributors={contributors}
                isLoading={isLoading}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="installation">
            <Suspense fallback={<TabLoading />}>
              <InstallationTab
                installation={overview || ""}
                readme={readme || ""}
                repoData={repoData}
                isLoading={isLoading}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="statistics">
            <Suspense fallback={<TabLoading />}>
              <StatisticsTab
                stats={stats}
                languages={languages}
                repoData={repoData}
                isLoading={isLoading}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="readme">
            <Suspense fallback={<TabLoading />}>
              <ReadmeTab
                readme={readme}
                isLoading={isLoading}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="files" className="mt-6">
        {isLoading ? (
          <TabLoading />
        ) : fileTree ? (
          <FileExplorer fileTree={fileTree} />
        ) : (
          <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
            <p className="text-muted-foreground">No file tree data available</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
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
