import { useParams } from "react-router-dom";
import { TabNavigation } from "@/components/TabNavigation";
import { AIRepositoryAssistant } from "@/components/AIRepositoryAssistant";
import { useState } from "react";

export function Repository() {
  const { owner, repo } = useParams();
  const [analysis, setAnalysis] = useState<any>(null);

  if (!owner || !repo) {
    return (
      <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-muted-foreground mt-2">
          Invalid repository URL. Please check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TabNavigation
            owner={owner}
            repo={repo}
            onAnalysisUpdate={setAnalysis}
          />
        </div>
        <div className="lg:col-span-1">
          <AIRepositoryAssistant
            owner={owner}
            repo={repo}
            analysis={analysis}
          />
        </div>
      </div>
    </div>
  );
} 