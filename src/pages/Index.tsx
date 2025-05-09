
import { Logo } from "@/components/ui/logo";
import { RepoInput } from "@/components/RepoInput";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center gap-4">
          <Logo size="large" />
          <h1 className="text-xl md:text-2xl text-center max-w-md">
            Developer-focused GitHub repository analyzer
          </h1>
        </div>
        
        <RepoInput />
        
        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>Enter a GitHub repository URL to analyze its structure, architecture, and documentation.</p>
          <p className="mt-2">Built for developers. Powered by GitHub API and Gemini AI.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
