import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from "./FileExplorer";
import { MindmapVisualization } from "./MindmapVisualization";
import { OverviewTab } from "./documentation/OverviewTab";
import { CodeTab } from "./documentation/CodeTab";
import { ReadmeTab } from "./documentation/ReadmeTab";
import { ContributorsTab } from "./documentation/ContributorsTab";
import { InstallationTab } from "./documentation/InstallationTab";
import { StatisticsTab } from "./documentation/StatisticsTab";
import { fetchRepoData, fetchRepoLanguages, fetchRepoReadme, fetchRepoContributors, fetchRepoStats } from "@/services/githubService";
import { analyzeRepository } from "@/services/geminiService";
import { toast } from "@/components/ui/sonner";
import { useLocation, useNavigate } from "react-router-dom";

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

  const handleTabChange = (value: string) => {
    if (onChangeTab) onChangeTab(value);
  };

  // Fetch repository data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch basic repository information
        const repoDataResponse = await fetchRepoData(owner, repo);
        setRepoData(repoDataResponse);
        
        // Fetch repository languages
        const languagesResponse = await fetchRepoLanguages(owner, repo);
        setLanguages(languagesResponse);
        
        // Fetch repository README
        const readmeResponse = await fetchRepoReadme(owner, repo);
        setReadme(readmeResponse);
        
        // Fetch repository contributors
        const contributorsResponse = await fetchRepoContributors(owner, repo);
        setContributors(contributorsResponse);
        
        // Fetch repository stats
        const statsResponse = await fetchRepoStats(owner, repo);
        setStats(statsResponse);
        
        // Analyze repository using Gemini API
        if (repoDataResponse && languagesResponse) {
          const analysisResponse = await analyzeRepository(repoDataResponse, languagesResponse, contributorsResponse);
          if (analysisResponse) {
            setAnalysis(analysisResponse);
            if (onAnalysisUpdate) {
              onAnalysisUpdate(analysisResponse);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching repository data:", error);
        toast.error("Failed to load repository data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [owner, repo, onAnalysisUpdate]);

  return (
    <Tabs defaultValue="visualization" className="w-full" onValueChange={handleTabChange}>
      <div className="w-full flex justify-center px-4 py-2">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="visualization" className="border-t border-gitpeek-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="md:col-span-2 bg-gitpeek-card rounded-lg border border-gitpeek-border p-4 max-h-[calc(100vh-260px)] relative overflow-hidden">
            <h3 className="text-lg font-medium mb-4">Repository Structure Visualization</h3>
            <div className="h-[90%] relative">
              <MindmapVisualization 
                owner={owner}
                repo={repo}
              />
            </div>
          </div>
          
          <div className="bg-gitpeek-card rounded-lg border border-gitpeek-border p-4 max-h-[calc(100vh-268px)]">
            <h3 className="text-lg font-medium mb-4">File Explorer</h3>
            <div className="h-[90%]">
              <FileExplorer owner={owner} repo={repo} />
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="documentation" className="border-t border-gitpeek-border">
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
          </div>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
