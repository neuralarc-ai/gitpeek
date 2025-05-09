
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from "./FileExplorer";
import { MindmapVisualization } from "./MindmapVisualization";
import { OverviewTab } from "./documentation/OverviewTab";
import { CodeTab } from "./documentation/CodeTab";
import { TechStackTab } from "./documentation/TechStackTab";
import { ReadmeTab } from "./documentation/ReadmeTab";
import { fetchRepoData, fetchRepoLanguages, fetchRepoReadme } from "@/services/githubService";
import { analyzeRepository } from "@/services/geminiService";
import { toast } from "@/components/ui/sonner";

interface TabNavigationProps {
  owner: string;
  repo: string;
  activeTab?: string;
  onChangeTab?: (tab: string) => void;
}

export function TabNavigation({ 
  owner, 
  repo, 
  activeTab = "visualization", 
  onChangeTab 
}: TabNavigationProps) {
  // Inside tab state for the documentation sub-tabs
  const [docTab, setDocTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  
  // Repository data states
  const [repoData, setRepoData] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [readme, setReadme] = useState(null);
  const [analysis, setAnalysis] = useState({ overview: null, architecture: null, techStack: null });
  
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
        
        // Analyze repository using Gemini API
        if (repoDataResponse && languagesResponse) {
          const analysisResponse = await analyzeRepository(repoDataResponse, languagesResponse);
          if (analysisResponse) {
            setAnalysis(analysisResponse);
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
  }, [owner, repo]);

  return (
    <Tabs 
      defaultValue={activeTab} 
      className="w-full"
      onValueChange={handleTabChange}
    >
      <TabsList className="grid grid-cols-2 w-full max-w-md">
        <TabsTrigger value="visualization">Visualization</TabsTrigger>
        <TabsTrigger value="documentation">Documentation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="visualization" className="border-t border-gitpeek-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="md:col-span-2 bg-gitpeek-card rounded-lg border border-gitpeek-border p-4 h-[500px]">
            <h3 className="text-lg font-medium mb-4">Repository Structure Visualization</h3>
            <div className="h-[90%]">
              <MindmapVisualization 
                repoData={repoData}
                languages={languages}
                isLoading={isLoading} 
              />
            </div>
          </div>
          
          <div className="bg-gitpeek-card rounded-lg border border-gitpeek-border p-4 h-[500px]">
            <h3 className="text-lg font-medium mb-4">File Explorer</h3>
            <div className="h-[90%]">
              <FileExplorer owner={owner} repo={repo} />
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="documentation" className="border-t border-gitpeek-border">
        <Tabs value={docTab} onValueChange={setDocTab} className="w-full mt-4">
          <TabsList className="w-full max-w-4xl overflow-x-auto hide-scrollbar">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="techstack">Tech Stack</TabsTrigger>
            <TabsTrigger value="readme">README</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 bg-gitpeek-card rounded-lg border border-gitpeek-border p-6 min-h-[500px]">
            <TabsContent value="overview">
              <OverviewTab 
                overview={analysis.overview}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="code">
              <CodeTab 
                architecture={analysis.architecture}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="techstack">
              <TechStackTab 
                techStack={analysis.techStack}
                languages={languages}
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
