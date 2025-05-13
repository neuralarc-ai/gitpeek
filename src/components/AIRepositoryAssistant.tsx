import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Bot, User, ChevronDown } from "lucide-react";
import { analyzeRepository, askGemini } from "@/services/geminiService";
import { toast } from "@/components/ui/sonner";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { FileTree } from "@/types/fileTree";

export interface AIRepositoryAssistantProps {
  fileTree: FileTree;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIRepositoryAssistant = ({ fileTree }: AIRepositoryAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if we need to show the scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
    }
  };

  const formatMessage = (content: string, role: 'user' | 'assistant') => {
    if (role === 'user') {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  {...(props as SyntaxHighlighterProps)}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg my-2"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children }) => (
              <p className="text-sm leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-sm space-y-1 my-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-sm space-y-1 my-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-sm">{children}</li>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowScrollButton(true);

    try {
      const context = {
        repository: {
          name: fileTree.name,
          owner: fileTree.owner,
          description: fileTree.description,
          languages: fileTree.languages,
          contributors: fileTree.contributors,
          readme: fileTree.readme,
          fileStructure: fileTree.fileStructure
        },
        conversation: messages
      };

      const response = await askGemini(input, context);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-[600px]">
      {/* Floating button with glassmorphism effect */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 rounded-full w-14 h-14 shadow-lg bg-primary/10 hover:bg-primary/20 backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110"
        size="icon"
      >
        <MessageCircle className="h-7 w-7 text-primary" />
      </Button>

      {/* Chat window with enhanced glassmorphism */}
      {isOpen && (
        <div className="fixed top-24 right-4 w-[480px] h-[600px] bg-background/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header with gradient */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">AI Repository Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages with enhanced glassmorphism */}
          <ScrollArea 
            ref={scrollAreaRef} 
            className="flex-1 p-4"
            onScroll={handleScroll}
          >
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary/90 text-primary-foreground shadow-lg'
                        : 'bg-white/10 backdrop-blur-md border border-white/20 shadow-lg'
                    }`}
                  >
                    {formatMessage(message.content, message.role)}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/90 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-6 rounded-full w-10 h-10 bg-primary/10 hover:bg-primary/20 backdrop-blur-md border border-white/20 shadow-lg"
              size="icon"
            >
              <ChevronDown className="h-5 w-5 text-primary" />
            </Button>
          )}

          {/* Input with enhanced glassmorphism */}
          <div className="p-4 bg-gradient-to-t from-primary/5 to-transparent border-t border-white/10">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the repository..."
                className="pr-12 bg-white/10 backdrop-blur-md border-white/20 focus:border-primary/50 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary/10 hover:bg-primary/20 backdrop-blur-md border border-white/20 rounded-full"
              >
                <Send className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 