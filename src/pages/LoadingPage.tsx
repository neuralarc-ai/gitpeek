
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { AgentChat } from "@/components/AgentChat";
import { hasApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";

const LoadingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const [analysisTimer, setAnalysisTimer] = useState<number | null>(null);
  
  useEffect(() => {
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
    
    // Set a timer to navigate to results page after analysis
    // This gives enough time for the agent chat to show a conversation
    // In a real app, you'd navigate after the actual API analysis is complete
    const timer = window.setTimeout(() => {
      if (owner && repo) {
        navigate(`/results?owner=${owner}&repo=${repo}`);
      } else {
        navigate("/");
      }
    }, 20000); // Increased to 20 seconds to allow for real API calls
    
    setAnalysisTimer(timer);
    
    return () => {
      if (analysisTimer) {
        clearTimeout(analysisTimer);
      }
    };
  }, [navigate, owner, repo]);
  
  if (!owner || !repo) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="w-full flex justify-center py-4">
        <Logo />
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
