import { useEffect, useRef, useState } from "react";
import { User, Terminal, Code, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getApiKey } from "@/utils/apiKeys";
import { getGeminiHeaders } from "@/services/geminiService";

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
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingAgent, setCurrentTypingAgent] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  // Add a new message with typing animation
  const addMessageWithDelay = async (agentId: string, content: string, delay: number = 1000) => {
    setCurrentTypingAgent(agentId);
    setIsTyping(true);
    
    // Simulate typing delay based on content length
    const typingTime = Math.min(content.length * 30, 3000);
    await new Promise(resolve => setTimeout(resolve, typingTime));
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
    setCurrentTypingAgent(null);
    
    // Scroll to bottom on new message
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);

    // Add delay before next message
    await new Promise(resolve => setTimeout(resolve, delay));
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
      await addMessageWithDelay("agent1", `Starting analysis of ${owner}/${repo}...`, 1500);
      
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
      
      await addMessageWithDelay("agent2", `Repository found! It has ${repoData.stargazers_count} stars and ${repoData.forks_count} forks. Let me check the contents...`, 2000);
      
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
      
      await addMessageWithDelay("agent3", `Found ${files.length} files and ${directories.length} directories in the root. Scanning for language distribution...`, 2000);
      
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
      
      await addMessageWithDelay("agent4", `Language distribution analysis complete. Primary languages: ${languagesList}.`, 2000);
      
      // Start Gemini API analysis
      await addMessageWithDelay("agent1", "Let me run a deeper analysis using Gemini. This will provide insights into the codebase architecture...", 2000);
      
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
      await addMessageWithDelay("agent2", `I'm having trouble accessing the repository data. Please check your API keys and repository URL.`, 1500);
    } finally {
      setLoading(false);
    }
  };

  // Analyze repo with Gemini API
  const analyzeWithGemini = async (repoInfo: any) => {
    try {
      await addMessageWithDelay("agent3", "Processing repository structure to create visualization data...", 2000);
      
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
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.candidates[0].content.parts[0].text;
      
      // Split analysis into smaller chunks for more natural conversation
      const sentences = analysis.split(/(?<=[.!?])\s+/);
      const chunks = [];
      let currentChunk = [];
      
      for (const sentence of sentences) {
        currentChunk.push(sentence);
        if (currentChunk.length >= 2) {
          chunks.push(currentChunk.join(" "));
          currentChunk = [];
        }
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
      }
      
      // Have different agents share the analysis
      for (let i = 0; i < chunks.length; i++) {
        const agentId = `agent${(i % 4) + 1}`;
        await addMessageWithDelay(agentId, chunks[i], 2000);
      }
      
      // Final message
      await addMessageWithDelay("agent1", "Analysis complete! You can explore the repository structure in the visualization tab.", 1500);
      
    } catch (error) {
      console.error("Error analyzing with Gemini:", error);
      await addMessageWithDelay("agent2", "I encountered an error while analyzing the repository structure. Please check your API keys and try again.", 1500);
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
      <div className="p-3 border-b border-gitpeek-border">
        <h3 className="font-medium">Agent Chat</h3>
        <p className="text-xs text-muted-foreground">AI agents analyzing your repository</p>
      </div>
      
      <div 
        ref={chatRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto hide-scrollbar"
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
          <div className="text-center text-destructive p-3 rounded-md bg-destructive/10">
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
              className="flex items-start space-x-2 animate-fade-in"
            >
              <div className="flex flex-col items-center">
                {agent.avatar}
                <span className="text-xs text-muted-foreground mt-0.5">{agent.name}</span>
              </div>
              
              <div className="flex-1 space-y-0.5">
                <div className="glass p-2 rounded-lg">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && currentTypingAgent && (
          <div className="flex items-start space-x-2 animate-fade-in">
            <div className="flex flex-col items-center">
              {getAgentById(currentTypingAgent).avatar}
              <span className="text-xs text-muted-foreground mt-0.5">{getAgentById(currentTypingAgent).name}</span>
            </div>
            <div className="flex-1">
              <div className="glass p-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
