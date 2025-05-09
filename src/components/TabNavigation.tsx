
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from "./FileExplorer";

interface TabNavigationProps {
  activeTab?: string;
  onChangeTab?: (tab: string) => void;
}

export function TabNavigation({ activeTab = "visualization", onChangeTab }: TabNavigationProps) {
  // Inside tab state for the documentation sub-tabs
  const [docTab, setDocTab] = useState("overview");
  
  const handleTabChange = (value: string) => {
    if (onChangeTab) onChangeTab(value);
  };

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
            <div className="flex items-center justify-center h-[90%] bg-gitpeek-dark/50 rounded-lg">
              <p className="text-muted-foreground text-sm">Interactive mindmap visualization will appear here</p>
            </div>
          </div>
          
          <div className="bg-gitpeek-card rounded-lg border border-gitpeek-border p-4 h-[500px]">
            <h3 className="text-lg font-medium mb-4">File Explorer</h3>
            <FileExplorer />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="documentation" className="border-t border-gitpeek-border">
        <Tabs value={docTab} onValueChange={setDocTab} className="w-full mt-4">
          <TabsList className="w-full max-w-4xl overflow-x-auto hide-scrollbar">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="readme">README</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 bg-gitpeek-card rounded-lg border border-gitpeek-border p-6 min-h-[500px]">
            <TabsContent value="overview" className="space-y-4">
              <h2 className="text-xl font-bold">Repository Overview</h2>
              <p className="text-muted-foreground">
                This section provides a high-level overview of the repository, including its purpose, main features, and architecture.
              </p>
            </TabsContent>
            
            <TabsContent value="code">
              <h2 className="text-xl font-bold">Code Analysis</h2>
              <p className="text-muted-foreground mt-2">
                Detailed code analysis will appear here, including code quality metrics, patterns, and potential improvements.
              </p>
            </TabsContent>
            
            <TabsContent value="contributions">
              <h2 className="text-xl font-bold">Contributions Analysis</h2>
              <p className="text-muted-foreground mt-2">
                Analysis of contribution patterns, commit frequency, and contributor statistics will appear here.
              </p>
            </TabsContent>
            
            <TabsContent value="installation">
              <h2 className="text-xl font-bold">Installation Guide</h2>
              <p className="text-muted-foreground mt-2">
                Extracted installation instructions and setup guide will appear here.
              </p>
            </TabsContent>
            
            <TabsContent value="statistics">
              <h2 className="text-xl font-bold">Repository Statistics</h2>
              <p className="text-muted-foreground mt-2">
                Comprehensive statistics about the repository will appear here, including code size, commit frequency, and more.
              </p>
            </TabsContent>
            
            <TabsContent value="readme">
              <h2 className="text-xl font-bold">README Content</h2>
              <p className="text-muted-foreground mt-2">
                The full README.md content from the repository will be rendered here.
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
