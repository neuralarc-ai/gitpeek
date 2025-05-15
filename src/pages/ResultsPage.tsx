import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { RepositoryHeader } from "@/components/RepositoryHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { AIRepositoryAssistant } from "@/components/AIRepositoryAssistant";
import { useState } from "react";

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const { owner: routeOwner, repo: routeRepo } = useParams();
  const navigate = useNavigate();
  
  // Get owner and repo from either route params or search params
  const owner = routeOwner || searchParams.get("owner") || "";
  const repo = routeRepo || searchParams.get("repo") || "";
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
            className="cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-105" 
            onClick={() => navigate("/")}
          >
            <Logo size="xlarge" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6 space-y-6">
        <div className="animate-fadeIn">
          <RepositoryHeader 
            repoName={repo} 
            repoOwner={owner} 
            repoUrl={repoUrl}
            analysis={analysis}
          />
        </div>
        
        <div className="animate-slideUp">
          <TabNavigation 
            owner={owner} 
            repo={repo} 
            onAnalysisUpdate={setAnalysis}
          />
        </div>
      </main>

      {/* Global AI Assistant */}
      <div className="animate-fadeIn">
        <AIRepositoryAssistant 
          fileTree={{
            name: repo,
            owner,
            repo,
            type: 'directory',
            path: '',
            children: []
          }}
        />
      </div>
      
      <footer className="mt-auto border-t border-gitpeek-border py-4">
        <div className="container text-center text-muted-foreground text-sm animate-fadeIn">
          Gitpeek &copy; 2025 | Developer-focused GitHub repository analyzer
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;
