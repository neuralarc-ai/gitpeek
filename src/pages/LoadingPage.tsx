import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { AgentChat } from "@/components/AgentChat";
import { hasApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { fetchRepoData } from "@/services/githubService";
import { Terminal, Code, FileText, GitBranch } from "lucide-react";

const LoadingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const [analysisTimer, setAnalysisTimer] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  
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
        
        // Start progress animation
        const startTime = Date.now();
        const duration = 15000; // 15 seconds total
        
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.min((elapsed / duration) * 100, 100);
          setProgress(newProgress);
          
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setIsAnalysisComplete(true);
            // Add a small delay after analysis completion before navigating
            setTimeout(() => {
              navigate(`/results?owner=${owner}&repo=${repo}`);
            }, 1000);
          }
        }, 50); // Update every 50ms for smooth animation
        
        setAnalysisTimer(progressInterval);
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
      
      <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full max-w-5xl mx-auto mt-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-2 text-center text-white">Analyzing Repository</h1>
          <h2 className="text-lg text-gitpeek-blue font-medium mb-6 text-center">{owner}/{repo}</h2>
          
          <div className="w-full max-w-md glass p-6">
            <p className="text-center text-muted-foreground mb-6">
              {isAnalysisComplete 
                ? "Analysis complete! Preparing results..."
                : "Our AI agents are analyzing your repository..."}
            </p>
            
            <div className="space-y-4">
              {/* Scanning Animation */}
              <div className="relative h-2 bg-gitpeek-border/30 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gitpeek-blue rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
                <div className="absolute top-0 left-0 w-full h-full">
                  <div 
                    className="absolute top-0 left-0 w-1/3 h-full bg-gitpeek-blue/20 animate-scan"
                    style={{ opacity: isAnalysisComplete ? 0 : 1 }}
                  />
                </div>
              </div>
              
              {/* Tech Icons */}
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gitpeek-blue/10 flex items-center justify-center mb-1">
                    <Code className="w-5 h-5 text-gitpeek-blue" />
                  </div>
                  <span className="text-xs text-muted-foreground">Code</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gitpeek-cyan/10 flex items-center justify-center mb-1">
                    <FileText className="w-5 h-5 text-gitpeek-cyan" />
                  </div>
                  <span className="text-xs text-muted-foreground">Docs</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-1">
                    <GitBranch className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Structure</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-1">
                    <Terminal className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Analysis</span>
                </div>
              </div>
              
              {/* Progress Text */}
              <div className="text-center">
                <p className="text-sm font-mono text-muted-foreground">
                  {isAnalysisComplete 
                    ? "100% Complete"
                    : `${Math.round(progress)}% Complete`}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:w-96 h-[calc(100vh-12rem)]">
          <AgentChat />
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
