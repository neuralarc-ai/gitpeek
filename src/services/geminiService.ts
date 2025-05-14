import { getApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";
import { RepoData, RepoLanguages, Contributor } from "./githubService";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { FileTree } from "@/types/fileTree";
import { fileService } from './fileService';

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

// Add new interfaces for better type safety
interface FileMetadata {
  name: string;
  type: "file" | "directory";
  path: string;
  language?: string;
  size?: number;
  lastModified?: string;
  content?: string;
  dependencies?: string[];
  imports?: string[];
  exports?: string[];
}

interface RepositoryContext {
  metadata: {
    name: string;
    description: string;
    owner: string;
    stars: number;
    forks: number;
    language: string;
    languages: Record<string, number>;
    topics: string[];
    createdAt: string;
    updatedAt: string;
    defaultBranch: string;
    size: number;
    openIssues: number;
    watchers: number;
    license?: string;
    homepage?: string;
    hasWiki: boolean;
    hasPages: boolean;
    hasIssues: boolean;
    hasProjects: boolean;
    archived: boolean;
    disabled: boolean;
    visibility: string;
    isTemplate: boolean;
    allowForking: boolean;
    webCommitSignoffRequired: boolean;
    permissions: any;
  };
  fileStructure: {
    name: string;
    type: "file" | "directory";
    path: string;
    children: FileMetadata[];
  };
  fileListing: FileMetadata[];
  fileStats: {
    totalFiles: number;
    totalDirectories: number;
    fileTypes: string[];
    languages: string[];
    largestFiles: FileMetadata[];
    mostRecentFiles: FileMetadata[];
    configurationFiles: FileMetadata[];
  };
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

// Add retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};

// Helper function for exponential backoff
async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to handle retries
async function withRetry<T>(
  operation: () => Promise<T>,
  retryConfig = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = retryConfig.initialDelay;

  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a service unavailability error
      if (error.message?.includes('503') || error.message?.includes('unavailable')) {
        if (attempt < retryConfig.maxRetries - 1) {
          // Wait with exponential backoff
          await wait(Math.min(delay, retryConfig.maxDelay));
          delay *= retryConfig.backoffFactor;
          continue;
        }
      }
      
      // If it's not a 503 error or we've exhausted retries, throw
      throw error;
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

// Add new interface for analysis tasks
interface AnalysisTask {
  type: 'bug-fixing' | 'optimization' | 'documentation' | 'code-review';
  description?: string;
  focusAreas?: string[];
}

// Add new interface for file content request
interface FileContentRequest {
  path: string;
  reason: string;
}

// Add new interface for analysis context
interface AnalysisContext {
  task: AnalysisTask;
  repositoryContext: RepositoryContext;
  requestedFiles: Map<string, string>;
  analysisProgress: {
    currentPhase: string;
    completedPhases: string[];
    pendingPhases: string[];
  };
}

// Add these utility functions at the top of the file, after imports
function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj)
    .replace(/[\u0000-\u001F]+/g, "") // Remove control characters
    .replace(/\\n/g, "\\n")           // Escape newlines
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\"/g, '\\"');
}

function sanitizeFileContent(content: string): string {
  return content
    .replace(/[\u0000-\u001F]+/g, "") // Remove control characters
    .replace(/\\/g, "\\\\")           // Escape backslashes
    .replace(/"/g, '\\"');            // Escape quotes
}

function safeJSONParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    console.log("Raw response was:", jsonString);
    throw new Error("Invalid JSON response from AI");
  }
}

export async function analyzeRepository(
  repoData: any,
  languages: Record<string, number>,
  fileTree?: FileTree,
  task?: AnalysisTask
): Promise<RepositoryAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not found in environment variables");
  }

  try {
    // Process file tree into detailed metadata
    const processedFiles = fileTree ? processFileTree(fileTree) : [];
    
    // Prepare repository context with enhanced file structure
    const repositoryContext: RepositoryContext = {
      metadata: {
        name: repoData.name,
        description: repoData.description,
        owner: repoData.owner.login,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        languages: languages,
        topics: repoData.topics || [],
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        defaultBranch: repoData.default_branch,
        size: repoData.size,
        openIssues: repoData.open_issues_count,
        watchers: repoData.watchers_count,
        license: repoData.license?.name,
        homepage: repoData.homepage,
        hasWiki: repoData.has_wiki,
        hasPages: repoData.has_pages,
        hasIssues: repoData.has_issues,
        hasProjects: repoData.has_projects,
        archived: repoData.archived,
        disabled: repoData.disabled,
        visibility: repoData.visibility,
        isTemplate: repoData.is_template,
        allowForking: repoData.allow_forking,
        webCommitSignoffRequired: repoData.web_commit_signoff_required,
        permissions: repoData.permissions,
      },
      fileStructure: fileTree ? {
        name: fileTree.name,
        type: fileTree.type as "file" | "directory",
        path: fileTree.path,
        children: processedFiles
      } : {
        name: repoData.name,
        type: "directory",
        path: "",
        children: []
      },
      fileListing: processedFiles,
      fileStats: fileTree ? generateFileStats(processedFiles) : {
        totalFiles: 0,
        totalDirectories: 0,
        fileTypes: [],
        languages: [],
        largestFiles: [],
        mostRecentFiles: [],
        configurationFiles: []
      }
    };

    // Create analysis context
    const analysisContext: AnalysisContext = {
      task: task || { type: 'code-review' },
      repositoryContext,
      requestedFiles: new Map(),
      analysisProgress: {
        currentPhase: 'initial-analysis',
        completedPhases: [],
        pendingPhases: ['file-analysis', 'issue-identification', 'recommendations']
      }
    };

    // Prepare the task-specific prompt
    const taskPrompt = getTaskSpecificPrompt(analysisContext);

    // Get the model and generate content with retry logic
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await withRetry(async () => {
      const response = await model.generateContent(taskPrompt);
      return response.response;
    });

    const text = result.text();

    // Extract JSON from markdown-formatted response
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      return {
        overview: "Error: Invalid response format",
        architecture: "Error: Invalid response format",
        features: "Error: Invalid response format",
        setup: "Error: Invalid response format",
        improvements: "Error: Invalid response format"
      };
    }

    try {
      const analysis = JSON.parse(jsonMatch[1]);
      return {
        overview: analysis.overview || "No overview available",
        architecture: analysis.architecture || "No architecture details available",
        features: analysis.features || "No features listed",
        setup: analysis.setup || "No setup instructions available",
        improvements: analysis.improvements || "No improvement suggestions available"
      };
    } catch (error) {
      console.error("Error parsing JSON from response:", error);
    return {
        overview: "Error parsing analysis response",
        architecture: "Error parsing architecture details",
        features: "Error parsing features",
        setup: "Error parsing setup instructions",
        improvements: "Error parsing improvement suggestions"
      };
    }
  } catch (error) {
    console.error("Error analyzing repository:", error);
    throw error;
  }
}

// Helper function to get task-specific prompt
function getTaskSpecificPrompt(context: AnalysisContext): string {
  const { task, repositoryContext } = context;
  
  const taskInstructions = {
    'bug-fixing': `
      Focus on identifying potential bugs and issues:
      1. Analyze error handling patterns
      2. Check for common security vulnerabilities
      3. Review input validation
      4. Examine edge cases
      5. Look for race conditions
      6. Check for memory leaks
      7. Review exception handling
    `,
    'optimization': `
      Focus on performance and efficiency:
      1. Analyze algorithm complexity
      2. Check for redundant operations
      3. Review resource usage
      4. Examine caching opportunities
      5. Look for parallelization possibilities
      6. Check for memory optimization
      7. Review database queries
    `,
    'documentation': `
      Focus on improving documentation:
      1. Check code comments
      2. Review README completeness
      3. Examine API documentation
      4. Look for missing documentation
      5. Check for outdated documentation
      6. Review inline documentation
      7. Suggest documentation improvements
    `,
    'code-review': `
      Focus on code quality and best practices:
      1. Check code style consistency
      2. Review design patterns
      3. Examine code organization
      4. Look for code smells
      5. Check for test coverage
      6. Review error handling
      7. Examine maintainability
    `
  };

  return `Analyze this GitHub repository for ${task.type}. Here's the repository information:

Repository Context:
${JSON.stringify(repositoryContext, null, 2)}

${taskInstructions[task.type]}

Analysis Guidelines:
1. Start with a high-level overview of the codebase
2. Identify key areas for improvement
3. Provide specific recommendations
4. Include code examples where relevant
5. Prioritize issues by severity
6. Suggest actionable improvements
7. Consider best practices and patterns

If you need to examine specific files in detail, request them using the following format:
{
  "requestFile": {
    "path": "path/to/file",
    "reason": "Why you need this file"
  }
}

Format your analysis as a JSON object with these keys:
{
  "overview": "High-level summary",
  "architecture": "Technical architecture analysis",
  "features": "Key features and functionality",
  "setup": "Development setup and requirements",
  "improvements": "Specific improvements and recommendations",
  "fileRequests": [{
    "path": "path/to/file",
    "reason": "Why you need this file"
  }]
}`;
}

// Helper function to process file tree into detailed metadata
function processFileTree(node: FileTree, path: string = ''): FileMetadata[] {
  const currentPath = path ? `${path}/${node.name}` : node.name;
  const result: FileMetadata[] = [{
    name: node.name,
    type: node.type as "file" | "directory",
    path: currentPath,
    language: node.language,
    size: node.size,
    lastModified: node.lastModified,
    content: node.content,
    dependencies: extractDependencies(node.content),
    imports: extractImports(node.content),
    exports: extractExports(node.content)
  }];

  if (node.children) {
    node.children.forEach(child => {
      result.push(...processFileTree(child, currentPath));
    });
  }

  return result;
}

// Helper function to generate file statistics
function generateFileStats(files: FileMetadata[]) {
  const fileTypes = new Set<string>();
  const languages = new Set<string>();
  const configFiles: FileMetadata[] = [];
  
  files.forEach(file => {
    if (file.type === "file") {
      fileTypes.add(file.path.split('.').pop() || '');
      if (file.language) languages.add(file.language);
      
      // Identify configuration files
      if (isConfigFile(file.path)) {
        configFiles.push(file);
      }
    }
  });

  return {
    totalFiles: files.filter(f => f.type === "file").length,
    totalDirectories: files.filter(f => f.type === "directory").length,
    fileTypes: Array.from(fileTypes),
    languages: Array.from(languages),
    largestFiles: [...files]
      .filter(f => f.type === "file" && f.size)
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 5),
    mostRecentFiles: [...files]
      .filter(f => f.type === "file" && f.lastModified)
      .sort((a, b) => new Date(b.lastModified || '').getTime() - new Date(a.lastModified || '').getTime())
      .slice(0, 5),
    configurationFiles: configFiles
  };
}

// Helper function to identify configuration files
function isConfigFile(path: string): boolean {
  const configPatterns = [
    /^\.env/,
    /^\.gitignore$/,
    /^package\.json$/,
    /^tsconfig\.json$/,
    /^webpack\.config\./,
    /^babel\.config\./,
    /^jest\.config\./,
    /^\.eslintrc/,
    /^\.prettierrc/,
    /^dockerfile/i,
    /^docker-compose\./i,
    /^\.github\/workflows\//,
    /^\.travis\.yml$/,
    /^\.circleci\/config\.yml$/,
    /^\.vscode\/settings\.json$/
  ];
  
  return configPatterns.some(pattern => pattern.test(path.toLowerCase()));
}

// Helper functions to extract code information
function extractDependencies(content?: string): string[] {
  if (!content) return [];
  const deps: string[] = [];
  
  // Extract package.json dependencies
  const packageJson = content.match(/"dependencies":\s*{([^}]+)}/);
  if (packageJson) {
    const matches = packageJson[1].match(/"([^"]+)":\s*"[^"]+"/g);
    if (matches) {
      deps.push(...matches.map(m => m.match(/"([^"]+)"/)?.[1] || ''));
    }
  }
  
  return deps;
}

function extractImports(content?: string): string[] {
  if (!content) return [];
  const imports: string[] = [];
  
  // Match various import patterns
  const patterns = [
    /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
    /from\s+['"]([^'"]+)['"]/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) imports.push(match[1]);
    }
  });
  
  return imports;
}

function extractExports(content?: string): string[] {
  if (!content) return [];
  const exports: string[] = [];
  
  // Match various export patterns
  const patterns = [
    /export\s+(?:const|let|var|function|class|default)\s+([a-zA-Z0-9_$]+)/g,
    /export\s+{[^}]+}/g,
    /module\.exports\s*=\s*([a-zA-Z0-9_$]+)/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) exports.push(match[1]);
    }
  });
  
  return exports;
}

export async function askGemini(question: string, context: any) {
  try {
    const model = genAI.getGenerativeModel(modelConfig);

    // Extract file path from the question
    const filePathMatch = question.match(/search\s+(?:for\s+)?(?:file\s+)?([^\s]+)/i);
    const requestedPath = filePathMatch ? filePathMatch[1] : question.trim();

    // Get file content
    const fileContent = await fileService.getFileContent(requestedPath);
    
    if (!fileContent) {
      return `I couldn't find the file "${requestedPath}" in the repository.`;
    }

    // Create a simple prompt for file content
    const prompt = `Here is the content of the file "${requestedPath}":

\`\`\`
${sanitizeFileContent(fileContent)}
\`\`\`

Please provide a brief summary of this file's content and purpose.`;

    // Use retry logic for the API call
    const result = await withRetry(async () => {
      const response = await model.generateContent(prompt);
      return response.response;
    });

    const responseText = result.text();

    if (!responseText) {
      throw new Error('No response received from AI');
    }

    return responseText;
  } catch (error) {
    console.error("Error getting AI response:", error);
    
    // Provide a more user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes('503') || error.message.includes('unavailable')) {
        throw new Error('The AI service is currently experiencing high demand. Please try again in a few moments.');
      }
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while getting the AI response');
  }
}
