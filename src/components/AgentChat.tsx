
import { useEffect, useRef, useState } from "react";
import { User, Terminal, Code, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getApiKey } from "@/utils/apiKeys";

type Agent = {
  id: string;
  name: string;
  avatar: React.ReactNode;
};

type Message = {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
};

const agents: Agent[] = [
  { 
    id: "agent1", 
    name: "Alex",
    avatar: <User className="h-8 w-8 p-1.5 rounded-full bg-gitpeek-blue/20 text-gitpeek-blue" />
  },
  { 
    id: "agent2", 
    name: "Morgan",
    avatar: <Terminal className="h-8 w-8 p-1.5 rounded-full bg-gitpeek-cyan/20 text-gitpeek-cyan" />
  },
  { 
    id: "agent3", 
    name: "Taylor", 
    avatar: <Code className="h-8 w-8 p-1.5 rounded-full bg-purple-500/20 text-purple-400" />
  },
  { 
    id: "agent4", 
    name: "Riley",
    avatar: <FileText className="h-8 w-8 p-1.5 rounded-full bg-amber-500/20 text-amber-400" />
  },
];

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  // Add a new message from a specific agent
  const addMessage = (agentId: string, content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll to bottom on new message
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  // Fetch repository data using GitHub API
  const fetchRepoData = async () => {
    if (!owner || !repo) return;
    
    const githubApiKey = getApiKey('github');
    if (!githubApiKey) {
      setError("GitHub API key is missing");
      setLoading(false);
      return;
    }

    try {
      // Initial message
      addMessage("agent1", `Starting analysis of ${owner}/${repo}...`);
      
      // Fetch basic repo info
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${githubApiKey}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      
      if (!repoResponse.ok) {
        throw new Error(`GitHub API error: ${repoResponse.status}`);
      }
      
      const repoData = await repoResponse.json();
      
      addMessage("agent2", `Repository found! It has ${repoData.stargazers_count} stars and ${repoData.forks_count} forks. Let me check the contents...`);
      
      // Fetch repo contents
      const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers: {
          Authorization: `token ${githubApiKey}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      
      if (!contentsResponse.ok) {
        throw new Error(`GitHub API error: ${contentsResponse.status}`);
      }
      
      const contents = await contentsResponse.json();
      const files = contents.filter((item: any) => item.type === "file");
      const directories = contents.filter((item: any) => item.type === "dir");
      
      addMessage("agent3", `Found ${files.length} files and ${directories.length} directories in the root. Scanning for language distribution...`);
      
      // Fetch languages
      const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
        headers: {
          Authorization: `token ${githubApiKey}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      
      if (!languagesResponse.ok) {
        throw new Error(`GitHub API error: ${languagesResponse.status}`);
      }
      
      const languages = await languagesResponse.json();
      const languagesList = Object.keys(languages).join(", ");
      
      addMessage("agent4", `Language distribution analysis complete. Primary languages: ${languagesList}.`);
      
      // Start Gemini API analysis
      addMessage("agent1", "Let me run a deeper analysis using Gemini. This will provide insights into the codebase architecture...");
      
      // Prepare data for Gemini
      const repoInfo = {
        name: repoData.name,
        description: repoData.description,
        owner: repoData.owner.login,
        languages: languages,
        filesCount: files.length,
        directoriesCount: directories.length
      };
      
      await analyzeWithGemini(repoInfo);
      
    } catch (err) {
      console.error("Error fetching repository data:", err);
      setError(`Failed to analyze repository: ${err instanceof Error ? err.message : 'Unknown error'}`);
      addMessage("agent2", `I'm having trouble accessing the repository data. Please check your API keys and repository URL.`);
    } finally {
      setLoading(false);
    }
  };

  // Analyze repo with Gemini API
  const analyzeWithGemini = async (repoInfo: any) => {
    const geminiApiKey = getApiKey('gemini');
    if (!geminiApiKey) {
      setError("Gemini API key is missing");
      return;
    }

    try {
      addMessage("agent3", "Processing repository structure to create visualization data...");
      
      const prompt = `
        Analyze this GitHub repository information and provide insights about its architecture and structure:
        Repository: ${repoInfo.name}
        Owner: ${repoInfo.owner}
        Description: ${repoInfo.description || 'No description available'}
        Languages: ${Object.keys(repoInfo.languages).join(", ")}
        File count: ${repoInfo.filesCount}
        Directory count: ${repoInfo.directoriesCount}
        
        Please provide:
        1. A brief overview of what this repository appears to be
        2. Potential architecture patterns being used
        3. Observations about the tech stack
        4. Keep your response concise and focused on developer insights
      `;

      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Extract the text from the Gemini response
      const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                          "Analysis completed but no insights were generated.";
      
      // Break the response into multiple agent messages for conversation effect
      const sentences = analysisText.split(/(?<=[.!?])\s+/);
      
      // Group sentences into 3-4 chunks for different agents
      const chunkSize = Math.ceil(sentences.length / 3);
      const chunks = [];
      
      for (let i = 0; i < sentences.length; i += chunkSize) {
        chunks.push(sentences.slice(i, i + chunkSize).join(" "));
      }
      
      // Have agents share the analysis
      setTimeout(() => addMessage("agent2", chunks[0] || "Analysis complete."), 800);
      
      if (chunks.length > 1) {
        setTimeout(() => addMessage("agent4", chunks[1]), 2000);
      }
      
      if (chunks.length > 2) {
        setTimeout(() => addMessage("agent3", chunks[2]), 3200);
      }
      
      // Final message
      setTimeout(() => addMessage("agent1", "Analysis complete! You can explore the repository structure in the visualization tab."), 4500);
      
    } catch (err) {
      console.error("Error with Gemini API:", err);
      setError(`Failed to analyze with Gemini: ${err instanceof Error ? err.message : 'Unknown error'}`);
      addMessage("agent4", "I encountered an issue connecting to Gemini for the advanced analysis. Basic repository information is still available.");
    }
  };

  // Start analysis when component mounts
  useEffect(() => {
    fetchRepoData();
    
    // Clean up
    return () => {
      // Any cleanup if needed
    };
  }, [owner, repo]);

  // Get agent by ID
  const getAgentById = (id: string) => {
    return agents.find(agent => agent.id === id) || agents[0];
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass w-full h-full flex flex-col">
      <div className="p-4 border-b border-gitpeek-border">
        <h3 className="font-medium">Agent Chat</h3>
        <p className="text-xs text-muted-foreground">AI agents analyzing your repository</p>
      </div>
      
      <div 
        ref={chatRef}
        className="flex-1 p-4 overflow-y-auto hide-scrollbar space-y-4"
      >
        {messages.length === 0 && !error && loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin mb-2 mx-auto">
                <Terminal className="h-5 w-5" />
              </div>
              <p>Connecting to repository...</p>
            </div>
          </div>
        )}
        
        {error && messages.length === 0 && (
          <div className="text-center text-destructive p-4 rounded-md bg-destructive/10">
            <p className="font-medium mb-1">Analysis Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">Please check your API keys in settings.</p>
          </div>
        )}
        
        {messages.map((message) => {
          const agent = getAgentById(message.agentId);
          return (
            <div 
              key={message.id}
              className="flex items-start space-x-3 animate-fade-in"
            >
              <div className="flex flex-col items-center">
                {agent.avatar}
                <span className="text-xs text-muted-foreground mt-1">{agent.name}</span>
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="glass p-3 rounded-lg">
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
