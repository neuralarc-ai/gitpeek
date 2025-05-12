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
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const validateGithubUrl = (url: string) => {
    // Basic GitHub URL validation
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setRepoUrl(newUrl);
    setIsValid(validateGithubUrl(newUrl));
    if (isError) setIsError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setIsError(true);
      return;
    }
    
    if (!validateGithubUrl(repoUrl)) {
      setIsError(true);
      toast.error("Invalid GitHub URL", {
        description: "Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)"
      });
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
          <Github 
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200
              ${isValid ? 'text-green-500' : 'text-muted-foreground'}`} 
          />
          <Input
            value={repoUrl}
            onChange={handleUrlChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste GitHub Repository URL (e.g., https://github.com/username/repo)"
            className={`pl-10 py-6 bg-secondary text-foreground transition-all duration-200
              ${isError ? 'border-destructive' : 'border-secondary'}
              ${isFocused ? 'placeholder:opacity-20' : 'placeholder:opacity-100'}`}
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
