
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { AgentChat } from "@/components/AgentChat";

const LoadingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  
  useEffect(() => {
    // Redirect to results page after 8 seconds (simulating analysis)
    const timer = setTimeout(() => {
      if (owner && repo) {
        navigate(`/results?owner=${owner}&repo=${repo}`);
      } else {
        navigate("/");
      }
    }, 10000); 
    
    return () => clearTimeout(timer);
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
          <LoadingAnimation />
        </div>
        
        <div className="lg:w-80 h-[400px] lg:h-auto">
          <AgentChat />
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
