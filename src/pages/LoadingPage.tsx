import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { AgentChat } from "@/components/AgentChat";
import { hasApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { fetchRepoData } from "@/services/githubService";
import { Terminal, Code, FileText, GitBranch } from "lucide-react";

const LoadingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysisTimer, setAnalysisTimer] = useState<NodeJS.Timeout | null>(null);
  
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  // Check for valid parameters
  useEffect(() => {
    if (!owner || !repo) {
      toast.error("Invalid repository URL");
      navigate("/");
    }
  }, [owner, repo, navigate]);

  useEffect(() => {
    const verifyRepository = async () => {
      if (!owner || !repo) return;

      try {
        // Verify repository exists
        const repoData = await fetchRepoData(owner, repo);
        if (!repoData) {
          toast.error("Repository not found or is private");
          navigate("/");
          return;
        }

        // Start analysis
        setIsVerifying(false);
        
        // Start smooth progress animation
        const timer = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(timer);
              // Navigate to results page
              navigate(`/repo/${owner}/${repo}`);
              return 100;
            }
            // Slower increment for smoother animation
            return Math.min(prev + 0.5, 100);
          });
        }, 100); // Update every 100ms for smoother animation
        setAnalysisTimer(timer);
      } catch (error) {
        console.error("Error verifying repository:", error);
        toast.error("Failed to verify repository");
        navigate("/");
      }
    };

    verifyRepository();

    return () => {
      if (analysisTimer) {
        clearInterval(analysisTimer);
      }
    };
  }, [navigate, owner, repo]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gitpeek-dark">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-gitpeek-blue/20 rounded-full animate-pulse"></div>
          </div>
          <div className="w-16 h-16 border-t-4 border-gitpeek-blue rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gitpeek-dark">
      <header className="w-full flex justify-center py-4">
        <div 
          className="cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="w-full max-w-2xl">
          <div className="relative h-2 bg-gitpeek-blue/20 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gitpeek-blue transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 text-center text-gitpeek-blue/80">
            Analyzing repository structure and generating insights...
          </div>
        </div>

        <div className="w-full max-w-2xl">
          <AgentChat 
            owner={owner || ""} 
            repo={repo || ""} 
            progress={progress}
            maxMessages={6} // Limit to 6 messages
          />
        </div>
      </main>
    </div>
  );
};

export default LoadingPage;
