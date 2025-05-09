
import { useEffect, useRef, useState } from "react";
import { User, Terminal, Code, FileText } from "lucide-react";

type Message = {
  id: string;
  avatar: React.ReactNode;
  content: string;
  delay: number;
};

const avatars = {
  agent1: <User className="h-8 w-8 p-1.5 rounded-full bg-gitpeek-blue/20 text-gitpeek-blue" />,
  agent2: <Terminal className="h-8 w-8 p-1.5 rounded-full bg-gitpeek-cyan/20 text-gitpeek-cyan" />,
  agent3: <Code className="h-8 w-8 p-1.5 rounded-full bg-purple-500/20 text-purple-400" />,
  agent4: <FileText className="h-8 w-8 p-1.5 rounded-full bg-amber-500/20 text-amber-400" />,
};

const messages: Message[] = [
  { 
    id: "1", 
    avatar: avatars.agent1, 
    content: "Started fetching the repo data...", 
    delay: 500 
  },
  { 
    id: "2", 
    avatar: avatars.agent2, 
    content: "Analyzing repository structure and dependencies...", 
    delay: 2000 
  },
  { 
    id: "3", 
    avatar: avatars.agent1, 
    content: "Found 126 files across 14 directories.", 
    delay: 3500 
  },
  { 
    id: "4", 
    avatar: avatars.agent3, 
    content: "Scanning source files for structure and patterns...", 
    delay: 5000 
  },
  { 
    id: "5", 
    avatar: avatars.agent4, 
    content: "Parsing package.json and dependencies...", 
    delay: 6500 
  },
  { 
    id: "6", 
    avatar: avatars.agent3, 
    content: "Identifying code architecture and component relationships...", 
    delay: 8000 
  },
];

export function AgentChat() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Display messages with staggered timing
    messages.forEach((message) => {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, message]);
        // Scroll to bottom on new message
        setTimeout(() => {
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }, 100);
      }, message.delay);
      
      return () => clearTimeout(timer);
    });
  }, []);

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
        {visibleMessages.map((message) => (
          <div 
            key={message.id}
            className="flex items-start space-x-3 animate-fade-in"
          >
            {message.avatar}
            <div className="glass p-3 rounded-lg max-w-[80%]">
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
