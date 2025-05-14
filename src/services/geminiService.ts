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

// Add type definition for RepositoryAnalysis
interface RepositoryAnalysis {
  overview: string;
  architecture: string;
  features: string;
  setup: string;
  improvements: string;
}

// Helper functions to extract different sections from the analysis
const extractArchitecture = (text: string): string => {
  const match = text.match(/(?:^|\n)3\.\s+Technical architecture:?([\s\S]*?)(?=\n\d\.\s+|\n*$)/);
  return match ? match[1].trim() : "Architecture analysis unavailable";
};

const extractFeatures = (text: string): string => {
  const match = text.match(/(?:^|\n)2\.\s+Main features and functionality:?([\s\S]*?)(?=\n\d\.\s+|\n*$)/);
  return match ? match[1].trim() : "Features analysis unavailable";
};

const extractSetup = (text: string): string => {
  const match = text.match(/(?:^|\n)5\.\s+Development setup and requirements:?([\s\S]*?)(?=\n\d\.\s+|\n*$)/);
  return match ? match[1].trim() : "Setup instructions unavailable";
};

const extractImprovements = (text: string): string => {
  const match = text.match(/(?:^|\n)7\.\s+Potential improvements:?([\s\S]*?)(?=\n\d\.\s+|\n*$)/);
  return match ? match[1].trim() : "Improvements analysis unavailable";
};

export const analyzeRepository = async (repoData: any, languages: any): Promise<RepositoryAnalysis> => {
  try {
    const token = getApiKey('gemini');
    if (!token) {
      throw new Error("Gemini API key not found");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare the context with repository information
    const repositoryContext = {
      metadata: {
        name: repoData.name,
        description: repoData.description,
        owner: repoData.owner.login,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        defaultBranch: repoData.default_branch,
        languages: languages
      },
      fileStructure: repoData.fileStructure || [],
      fileListing: repoData.fileListing || []
    };

    // Add retry logic for API calls
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        const result = await model.generateContent([
          {
            text: `Analyze this GitHub repository and provide a comprehensive overview. Here's the repository information:\n\n${JSON.stringify(repositoryContext, null, 2)}\n\nPlease provide a detailed analysis including:\n1. Project overview and purpose\n2. Main features and functionality\n3. Technical architecture\n4. Key components and their relationships\n5. Development setup and requirements\n6. Best practices and code quality\n7. Potential improvements\n\nFormat the response as a structured analysis.`
          }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Parse the response and structure it
        const analysis: RepositoryAnalysis = {
          overview: text,
          architecture: extractArchitecture(text),
          features: extractFeatures(text),
          setup: extractSetup(text),
          improvements: extractImprovements(text)
        };

        return analysis;
      } catch (error: any) {
        lastError = error;
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          continue;
        }
        // If it's not a 503 error, throw immediately
        throw error;
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError || new Error("Failed to analyze repository after multiple retries");
  } catch (error: any) {
    console.error("Error analyzing repository:", error);
    // Return a default analysis structure with error information
    return {
      overview: "Unable to generate repository analysis at this time. The AI service is currently unavailable.",
      architecture: "Analysis pending",
      features: "Analysis pending",
      setup: "Analysis pending",
      improvements: "Analysis pending"
    };
  }
};

export async function askGemini(question: string, context: any) {
  try {
    const model = genAI.getGenerativeModel(modelConfig);

    // Validate and process repository data
    if (!context || !context.metadata || !context.structure) {
      throw new Error('Invalid repository context provided');
    }

    // Process file structure with validation
    const fileStructure = context.structure.fileStructure || {};
    const fileListing = Array.isArray(context.structure.fileListing) ? context.structure.fileListing : [];
    const completeFileStructure = context.structure.completeFileStructure || '{}';

    // Process metadata with validation
    const metadata = {
      name: context.metadata.name || 'Unknown Repository',
      owner: context.metadata.owner || 'Unknown Owner',
      description: context.metadata.description || 'No description available',
      languages: Array.isArray(context.metadata.languages) ? context.metadata.languages : [],
      contributors: Array.isArray(context.metadata.contributors) ? context.metadata.contributors : [],
      readme: context.metadata.readme || 'No README available'
    };

    // Create a detailed file structure summary with validation
    const fileStructureInfo = fileListing.length > 0 
      ? `\nDetailed File Structure:\n${fileListing
          .filter((file: any) => file && typeof file === 'object')
          .map((file: any) => {
            const fileInfo = {
              path: file.path || 'unknown path',
              type: file.type || 'unknown',
              size: typeof file.size === 'number' ? file.size : 0,
              language: file.language || 'unknown',
              lastModified: file.lastModified || new Date().toISOString(),
              content: file.content ? file.content.substring(0, 200) + '...' : 'No content available'
            };
            return `- ${fileInfo.path}
             Type: ${fileInfo.type}
             Size: ${fileInfo.size} bytes
             Language: ${fileInfo.language}
             Last Modified: ${fileInfo.lastModified}
             Content Preview: ${fileInfo.content}`;
          }).join('\n\n')}`
      : 'No file structure information available';

    // Create a comprehensive repository context with validated data
    const repositoryContext = {
      basic: metadata,
      structure: {
        totalFiles: fileListing.length,
        fileTypes: [...new Set(fileListing.map((f: any) => f?.type).filter(Boolean))],
        languages: [...new Set(fileListing.map((f: any) => f?.language).filter(Boolean))],
        completeStructure: completeFileStructure
      }
    };

    // Create a more focused prompt with clear instructions
    const prompt = `You are an AI assistant helping users understand a GitHub repository.
    Repository Context:
    
    Basic Information:
    - Name: ${repositoryContext.basic.name}
    - Owner: ${repositoryContext.basic.owner}
    - Description: ${repositoryContext.basic.description}
    - Languages: ${JSON.stringify(repositoryContext.basic.languages)}
    - Contributors: ${JSON.stringify(repositoryContext.basic.contributors)}
    - README: ${repositoryContext.basic.readme}

    Repository Structure:
    - Total Files: ${repositoryContext.structure.totalFiles}
    - File Types: ${repositoryContext.structure.fileTypes.join(', ')}
    - Detected Languages: ${repositoryContext.structure.languages.join(', ')}
    
    ${fileStructureInfo}

    Previous conversation:
    ${Array.isArray(context.conversation) 
      ? context.conversation
          .filter((msg: any) => msg && msg.role && msg.content)
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n')
      : 'No previous conversation'}

    User question: ${question}

    Please provide a helpful and comprehensive response based on the repository context. 
    Guidelines for your response:
    1. If the question is about finding specific files or functionality:
       - Use the detailed file structure to locate relevant files
       - Explain the purpose and location of the files
       - Suggest the most relevant files for the user's query
       - Include file paths and their purposes
       - If a file's content is available, reference it in your explanation
    
    2. If information is missing:
       - Acknowledge what information is not available
       - Explain what additional information would be helpful
       - Provide guidance based on the available information
       - Suggest alternative approaches based on the existing data
    
    3. For general questions:
       - Use the complete repository context to provide insights
       - Reference specific files and their purposes
       - Explain the repository structure and organization
       - Highlight key files and their relationships
    
    4. Response format:
       - Start with a direct answer to the question
       - Provide relevant file paths and their purposes
       - Include specific examples from the file structure
       - End with a summary of key points
    
    Keep your response focused on helping the user understand the repository structure and locate relevant files.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('No response received from AI');
    }

    return responseText;
  } catch (error) {
    console.error("Error getting AI response:", error);
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
