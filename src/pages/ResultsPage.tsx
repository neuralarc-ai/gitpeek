import { useSearchParams, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { RepositoryHeader } from "@/components/RepositoryHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { useState } from "react";

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const owner = searchParams.get("owner") || "";
  const repo = searchParams.get("repo") || "";
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const [analysis, setAnalysis] = useState({
    overview: null,
    architecture: null,
    installation: null,
    codeStructure: null
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b border-gitpeek-border">
        <div className="container py-4 flex justify-center">
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate("/")}
          >
            <Logo size="xlarge" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6 space-y-6">
        <RepositoryHeader 
          repoName={repo} 
          repoOwner={owner} 
          repoUrl={repoUrl}
          analysis={analysis}
        />
        
        <TabNavigation 
          owner={owner} 
          repo={repo} 
          onAnalysisUpdate={setAnalysis}
        />
      </main>
      
      <footer className="border-t border-gitpeek-border py-4">
        <div className="container text-center text-muted-foreground text-sm">
          Gitpeek &copy; 2025 | Developer-focused GitHub repository analyzer
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;
