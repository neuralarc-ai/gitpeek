
import { useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { RepositoryHeader } from "@/components/RepositoryHeader";
import { TabNavigation } from "@/components/TabNavigation";

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner") || "";
  const repo = searchParams.get("repo") || "";
  const repoUrl = `https://github.com/${owner}/${repo}`;
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b border-gitpeek-border">
        <div className="container py-3 flex items-center">
          <Logo size="small" />
        </div>
      </header>
      
      <main className="flex-1 container py-6 space-y-6">
        <RepositoryHeader 
          repoName={repo} 
          repoOwner={owner} 
          repoUrl={repoUrl} 
        />
        
        <TabNavigation owner={owner} repo={repo} />
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
