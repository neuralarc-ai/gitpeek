
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { hasApiKey } from "@/utils/apiKeys";

export function RepoInput() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const validateGithubUrl = (url: string) => {
    // Basic GitHub URL validation
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGithubUrl(repoUrl)) {
      setIsError(true);
      return;
    }
    
    // Check if API keys are set
    const hasGithubKey = hasApiKey('github');
    const hasGeminiKey = hasApiKey('gemini');
    
    if (!hasGithubKey || !hasGeminiKey) {
      toast.error("API keys are required", {
        description: "Please add your GitHub and Gemini API keys in the settings",
        action: {
          label: "Settings",
          onClick: () => {
            // This would trigger settings dialog, but needs component refactoring
            // For now we'll just alert the user
            alert("Please click the settings icon in the top-right corner to add your API keys");
          }
        }
      });
      return;
    }
    
    setIsError(false);
    // Extract owner and repo name from URL
    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1]?.replace(/\/$/, ''); // Remove trailing slash if present
    
    navigate(`/loading?owner=${owner}&repo=${repo}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              if (isError) setIsError(false);
            }}
            placeholder="Paste GitHub Repository URL"
            className={`pl-10 py-6 bg-secondary text-foreground placeholder:text-muted-foreground 
              ${isError ? 'border-destructive' : 'border-secondary'}`}
          />
        </div>
        
        {isError && (
          <p className="text-destructive text-sm">Please enter a valid GitHub repository URL</p>
        )}
        
        <Button 
          type="submit" 
          size="lg"
          className="w-full bg-gitpeek-blue hover:bg-gitpeek-blue/80 font-medium"
        >
          Analyze Repository
        </Button>
      </div>
    </form>
  );
}
