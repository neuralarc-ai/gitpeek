import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Download, FileCode, GitBranch, Github } from "lucide-react";

interface InstallationTabProps {
  installation: string | null;
  readme: string | null;
  repoData: any | null;
  isLoading: boolean;
}

export function InstallationTab({ installation, readme, repoData, isLoading }: InstallationTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-60 bg-muted rounded"></div>
      </div>
    );
  }

  if (!installation && !readme) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Installation Guide</h2>
        <p className="text-muted-foreground mt-2">
          No installation instructions available. Please check the repository's README for more information.
        </p>
      </div>
    );
  }
  
  // Extract installation instructions from README if Gemini didn't provide them
  const getInstallationFromReadme = () => {
    if (!readme) return null;
    
    // Look for common installation headers in the README
    const installationRegex = /(?:##?\s+(?:installation|getting started|setup|how to use|quick start)|```(?:bash|sh))/i;
    if (installationRegex.test(readme)) {
      const matches = readme.split(installationRegex);
      if (matches.length > 1) {
        // Extract the section after the installation header
        let installSection = matches[1];
        
        // Limit to the next section if it exists
        const nextSectionMatch = installSection.match(/##?\s+[a-z\s]+/i);
        if (nextSectionMatch && nextSectionMatch.index) {
          installSection = installSection.substring(0, nextSectionMatch.index);
        }
        
        return installSection.trim();
      }
    }
    return null;
  };
  
  const readmeInstallation = getInstallationFromReadme();
  const installationInstructions = installation || readmeInstallation;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Installation Guide</h2>
      
      {/* Repository Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Github className="mr-2 h-5 w-5" />
            Repository Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-medium w-32">Repository:</span>
              <span className="text-sm text-muted-foreground">{repoData?.full_name || 'N/A'}</span>
                </div>
            <div className="flex items-center">
              <span className="text-sm font-medium w-32">Default Branch:</span>
              <span className="text-sm text-muted-foreground flex items-center">
                <GitBranch className="h-4 w-4 mr-1" />
                {repoData?.default_branch || 'main'}
              </span>
              </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Installation Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Installation Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto">
          {installationInstructions ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                {installationInstructions}
              </pre>
            </div>
          ) : (
            <div className="text-muted-foreground bg-muted p-4 rounded-md">
              <p>No detailed installation instructions found.</p>
              <p className="mt-2">General installation steps:</p>
              <ol className="list-decimal pl-5 mt-2 space-y-2">
                <li>Clone the repository: <code className="bg-background px-1 rounded">git clone [repository URL]</code></li>
                <li>Navigate to the project directory: <code className="bg-background px-1 rounded">cd [repository name]</code></li>
                <li>Install dependencies (if applicable)</li>
                <li>Follow configuration instructions in the README</li>
                <li>Start the application</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="mr-2 h-5 w-5" />
            Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Required dependencies for this project:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: "Git", command: "git --version" },
                { name: "Node.js", command: "node --version" },
                { name: "npm or yarn", command: "npm --version" },
                { name: "Docker", command: "docker --version" },
                { name: "Python", command: "python --version" },
              ].map(item => (
                <div key={item.name} className="flex items-center p-2 border rounded-md">
                  <div className="h-4 w-4 border rounded-sm mr-2 flex items-center justify-center">
                    {/* Intentionally left unchecked for user to check */}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.command}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Check className="mr-2 h-5 w-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
              Get started quickly with these basic commands:
          </p>
            <div className="bg-muted p-4 rounded-md space-y-2">
              <div>
                <p className="text-sm font-medium">Clone the repository:</p>
                <code className="block bg-background px-2 py-1 rounded mt-1 text-sm">
                  git clone https://github.com/{repoData?.full_name}.git
                </code>
              </div>
              <div>
                <p className="text-sm font-medium">Install dependencies:</p>
                <code className="block bg-background px-2 py-1 rounded mt-1 text-sm">
                  npm install
                </code>
              </div>
              <div>
                <p className="text-sm font-medium">Start the application:</p>
                <code className="block bg-background px-2 py-1 rounded mt-1 text-sm">
                  npm start
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
