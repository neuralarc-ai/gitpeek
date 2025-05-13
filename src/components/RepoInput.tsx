import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Search } from "lucide-react";
import { glassmorphism } from "@/styles/design-system";
import { toast } from "@/components/ui/sonner";

export const RepoInput = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const validateGitHubUrl = (url: string) => {
    const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
    return githubUrlPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGitHubUrl(repoUrl)) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    setIsLoading(true);
    try {
      const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
      navigate(`/loading?owner=${owner}&repo=${repo}`);
    } catch (error) {
      toast.error("Failed to process repository URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setRepoUrl(url);
    setIsValidUrl(validateGitHubUrl(url));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Github className={`h-5 w-5 transition-colors duration-200 ${isValidUrl ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <Input
            type="text"
            placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
            value={repoUrl}
            onChange={handleUrlChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${glassmorphism.input.base} pl-10 [&::placeholder]:transition-opacity [&::placeholder]:duration-200 ${isFocused ? '[&::placeholder]:opacity-30' : '[&::placeholder]:opacity-100'}`}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !repoUrl}
          className={`${glassmorphism.button.primary} min-w-[120px]`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Analyze</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};
