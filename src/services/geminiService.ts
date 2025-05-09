
import { getApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { RepoData, RepoLanguages } from "./githubService";

interface AnalysisResult {
  overview: string;
  architecture: string;
  techStack: string;
}

export const analyzeRepository = async (
  repoData: RepoData, 
  languages: RepoLanguages
): Promise<AnalysisResult | null> => {
  try {
    const geminiKey = getApiKey('gemini');
    if (!geminiKey) {
      toast.error("Gemini API key is missing");
      return null;
    }

    const prompt = `
        Analyze this GitHub repository information and provide insights about its architecture and structure:
        Repository: ${repoData.name}
        Owner: ${repoData.owner.login}
        Description: ${repoData.description || "No description available"}
        Languages: ${Object.keys(languages).join(', ')}
        File count: ${repoData.stargazers_count}
        Directory count: ${repoData.forks_count}
        
        Please provide:
        1. A brief overview of what this repository appears to be
        2. Potential architecture patterns being used
        3. Observations about the tech stack
        4. Keep your response concise and focused on developer insights
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
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    const sections = analysisText.split(/\d+\.\s+\*\*[^*]+\*\*/);
    
    return {
      overview: sections[1]?.trim() || "Analysis unavailable",
      architecture: sections[2]?.trim() || "Analysis unavailable",
      techStack: sections[3]?.trim() || "Analysis unavailable"
    };
  } catch (error) {
    console.error("Error analyzing repository:", error);
    toast.error("Failed to analyze repository");
    return null;
  }
};
