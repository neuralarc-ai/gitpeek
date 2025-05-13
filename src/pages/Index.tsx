import { Logo } from "@/components/ui/logo";
import { RepoInput } from "@/components/RepoInput";
import { Button } from "@/components/ui/button";
import { Github, Star, GitFork, Users, Code, BookOpen, Sparkles } from "lucide-react";
import { glassmorphism, layout, typography } from "@/styles/design-system";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-b from-background to-background/95">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center gap-4 animate-float">
          <Logo size="xlarge" />
          <h1 className={`${typography.h1} text-center max-w-md bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60`}>
            Dive Into GitHub Repositories
          </h1>
        </div>
        
        <div className={`${glassmorphism.card.base} ${glassmorphism.card.hover} w-full p-6`}>
          <RepoInput />
        </div>
        
        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>Enter a GitHub repository URL to analyze its structure, architecture, and documentation.</p>
          <p className="mt-2">Built for developers. Powered by GitHub API and Gemini AI.</p>
        </div>

        {/* GitHub Features Section */}
        <div className={`${layout.grid.base} ${layout.grid.cols[3]} mt-16 w-full`}>
          <div className={`${glassmorphism.card.base} ${glassmorphism.card.hover} p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <Code className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Code Analysis</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Analyze repository structure, dependencies, and code patterns with AI-powered insights.
            </p>
          </div>

          <div className={`${glassmorphism.card.base} ${glassmorphism.card.hover} p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Documentation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive documentation and understand project architecture.
            </p>
          </div>

          <div className={`${glassmorphism.card.base} ${glassmorphism.card.hover} p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Collaboration</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Understand team contributions, commit history, and project evolution.
            </p>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <Button
            variant="outline"
            className={`${glassmorphism.button.secondary} gap-2`}
            onClick={() => window.open('https://github.com', '_blank')}
          >
            <Github className="w-4 h-4" />
            Connect with GitHub
          </Button>
          <p className="text-xs text-muted-foreground">
            Securely analyze your repositories with GitHub OAuth
          </p>
        </div>

        {/* AI Features Highlight */}
        <div className={`${glassmorphism.card.base} ${glassmorphism.card.hover} mt-12 p-6 w-full`}>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">AI-Powered Features</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className={`${glassmorphism.badge.primary} p-2`}>
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Smart Code Analysis</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-powered insights into code structure and patterns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`${glassmorphism.badge.primary} p-2`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Auto Documentation</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate comprehensive documentation automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
