import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { AgentChat } from "@/components/AgentChat";
import { hasApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { fetchRepoData } from "@/services/githubService";

const LoadingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const [analysisTimer, setAnalysisTimer] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    const verifyRepository = async () => {
      // Check if API keys are available
      const hasGithubKey = hasApiKey('github');
      const hasGeminiKey = hasApiKey('gemini');
      
      if (!hasGithubKey || !hasGeminiKey) {
        toast.error("API keys are required for repository analysis", {
          description: "Please add your GitHub and Gemini API keys in settings"
        });
        navigate("/");
        return;
      }
      
      if (!owner || !repo) {
        navigate("/");
        return;
      }
      
      // Verify that the repository exists
      setIsVerifying(true);
      try {
        const repoData = await fetchRepoData(owner, repo);
        if (!repoData) {
          toast.error("Failed to access repository", {
            description: "Please check if the repository exists and is public"
          });
          navigate("/");
          return;
        }
        
        // Set a timer to navigate to results page after analysis
        const timer = window.setTimeout(() => {
          navigate(`/results?owner=${owner}&repo=${repo}`);
        }, 10000); // Allow enough time for the agents to show conversation
        
        setAnalysisTimer(timer);
      } catch (error) {
        console.error("Error verifying repository:", error);
        toast.error("Failed to access repository");
        navigate("/");
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyRepository();
    
    return () => {
      if (analysisTimer) {
        clearTimeout(analysisTimer);
      }
    };
  }, [navigate, owner, repo]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gitpeek-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="w-full flex justify-center py-4">
        <div 
          className="cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <Logo />
        </div>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full max-w-5xl mx-auto mt-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-2 text-center">Analyzing Repository</h1>
          <h2 className="text-lg text-gitpeek-blue font-medium mb-8 text-center">{owner}/{repo}</h2>
          
          <div className="w-full max-w-md glass p-6 rounded-lg">
            <p className="text-center text-muted-foreground mb-4">
              Our AI agents are analyzing your repository...
            </p>
            <div className="relative w-full h-2 bg-gitpeek-border/30 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-gitpeek-blue animate-pulse rounded-full w-full" />
            </div>
          </div>
        </div>
        
        <div className="lg:w-80 h-[500px] lg:h-auto">
          <AgentChat />
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
