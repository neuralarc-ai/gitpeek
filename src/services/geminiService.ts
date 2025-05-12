import { getApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { RepoData, RepoLanguages, Contributor } from "./githubService";

interface AnalysisResult {
  overview: string;
  architecture: string;
  installation: string;
  codeStructure: string;
}

export const getGeminiHeaders = () => {
  const geminiKey = getApiKey('gemini');
  if (!geminiKey) {
    throw new Error("Gemini API key is missing");
  }
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': geminiKey
  };
};

export const analyzeRepository = async (
  repoData: RepoData, 
  languages: RepoLanguages,
  contributors?: Contributor[] | null
): Promise<AnalysisResult | null> => {
  try {
    const geminiKey = getApiKey('gemini');
    if (!geminiKey) {
      toast.error("Gemini API key is missing");
      return null;
    }

    // Create a summary of contributors if available
    let contributorsSummary = "";
    if (contributors && contributors.length > 0) {
      const topContributors = contributors.slice(0, 5);
      contributorsSummary = `
        Top Contributors:
        ${topContributors.map(c => `- ${c.login} (${c.contributions} contributions)`).join('\n')}
        Total Contributors: ${contributors.length}
      `;
    }

    const prompt = `
        Analyze this GitHub repository information and provide comprehensive insights:
        
        Repository: ${repoData.name}
        Owner: ${repoData.owner.login}
        Description: ${repoData.description || "No description available"}
        Languages: ${Object.keys(languages).join(', ')}
        Stars: ${repoData.stargazers_count}
        Forks: ${repoData.forks_count}
        Created: ${new Date(repoData.created_at).toLocaleDateString()}
        Last Updated: ${new Date(repoData.updated_at).toLocaleDateString()}
        ${contributorsSummary}
        
        Please provide the following sections:
        
        1. **OVERVIEW**: A comprehensive assessment of the repository including its purpose, health metrics, and key highlights.
        
        2. **ARCHITECTURE**: Detailed analysis of the code architecture, patterns used, and structure.
        
        3. **INSTALLATION**: Step-by-step installation instructions assuming this is a standard project in the given language(s). Include any prerequisites, dependency information, and configuration steps.
        
        4. **CODE STRUCTURE**: Analysis of the code organization, key files/directories, and how the different parts relate to each other.
        
        Keep each section focused and informative for developers looking to understand this repository.
      `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    // Parse sections using regex pattern for markdown headers
    const overviewMatch = analysisText.match(/(?:^|\n)1\.\s+\*\*OVERVIEW\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    const architectureMatch = analysisText.match(/(?:^|\n)2\.\s+\*\*ARCHITECTURE\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    const installationMatch = analysisText.match(/(?:^|\n)3\.\s+\*\*INSTALLATION\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    const codeStructureMatch = analysisText.match(/(?:^|\n)4\.\s+\*\*CODE STRUCTURE\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    
    return {
      overview: overviewMatch ? overviewMatch[1].trim() : "Analysis unavailable",
      architecture: architectureMatch ? architectureMatch[1].trim() : "Analysis unavailable",
      installation: installationMatch ? installationMatch[1].trim() : "Analysis unavailable",
      codeStructure: codeStructureMatch ? codeStructureMatch[1].trim() : "Analysis unavailable"
    };
  } catch (error) {
    console.error("Error analyzing repository:", error);
    toast.error("Failed to analyze repository");
    return null;
  }
};
