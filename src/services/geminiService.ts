import { getApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { RepoData, RepoLanguages, Contributor } from "./githubService";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface AnalysisResult {
  overview: string;
  architecture: string;
  installation: string;
  codeStructure: string;
}

// Initialize the Gemini API with safety settings
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Configure the model with safety settings
const modelConfig = {
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
};

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
    const model = genAI.getGenerativeModel(modelConfig);

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse sections using regex pattern for markdown headers
    const overviewMatch = text.match(/(?:^|\n)1\.\s+\*\*OVERVIEW\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    const architectureMatch = text.match(/(?:^|\n)2\.\s+\*\*ARCHITECTURE\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    const installationMatch = text.match(/(?:^|\n)3\.\s+\*\*INSTALLATION\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    const codeStructureMatch = text.match(/(?:^|\n)4\.\s+\*\*CODE STRUCTURE\*\*:?([\s\S]*?)(?=\n\d\.\s+\*\*|\n*$)/);
    
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

export async function askGemini(question: string, context: any) {
  try {
    const model = genAI.getGenerativeModel(modelConfig);

    // Get file structure information
    const fileStructure = context.repository.fileStructure || [];
    const fileStructureInfo = fileStructure.length > 0 
      ? `\nFile Structure:\n${fileStructure.map((file: any) => `- ${file.path} (${file.type})`).join('\n')}`
      : '';

    const prompt = `You are an AI assistant helping users understand a GitHub repository.
    Repository Context:
    - Name: ${context.repository.name}
    - Owner: ${context.repository.owner}
    - Description: ${context.repository.description}
    - Languages: ${JSON.stringify(context.repository.languages)}
    - Contributors: ${JSON.stringify(context.repository.contributors)}
    - README: ${context.repository.readme}
    ${fileStructureInfo}

    Previous conversation:
    ${context.conversation.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

    User question: ${question}

    Please provide a helpful and concise response based on the repository context. 
    If the question is about finding a specific file or functionality:
    1. Use the file structure information to locate relevant files
    2. Explain the purpose and location of the files
    3. If possible, suggest the most relevant files for the user's query
    4. If the file structure is not available, explain what information would be needed to better answer the question

    Keep your response focused on helping the user understand the repository structure and locate relevant files.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting AI response:", error);
    throw error;
  }
}
