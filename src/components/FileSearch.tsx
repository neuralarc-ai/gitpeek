import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fileService } from "@/services/fileService";
import { toast } from "@/components/ui/sonner";
import { Search } from "lucide-react";

interface SearchResult {
  path: string;
  content: string;
  score: number;
  context: {
    startLine: number;
    endLine: number;
  };
}

export function FileSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [fileType, setFileType] = useState("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fileTypes = [
    { value: "all", label: "All Files" },
    { value: "ts", label: "TypeScript" },
    { value: "tsx", label: "TSX" },
    { value: "js", label: "JavaScript" },
    { value: "jsx", label: "JSX" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "md", label: "Markdown" },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    try {
      const results = await fileService.searchFiles(searchQuery);
      // Filter results by file type if not "all"
      const filteredResults = fileType === "all" 
        ? results 
        : results.filter(result => result.path.endsWith(`.${fileType}`));
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search files");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="h-[600px] w-full max-w-3xl mx-auto bg-background/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-white/10">
        <h3 className="font-semibold text-primary">File Search</h3>
      </div>

      <div className="flex gap-2 p-4 border-b">
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-white/10 backdrop-blur-md border-white/20 focus:border-primary/50"
        />
        <Select value={fileType} onValueChange={setFileType}>
          <SelectTrigger className="w-[180px] bg-white/10 backdrop-blur-md border-white/20">
            <SelectValue placeholder="File Type" />
          </SelectTrigger>
          <SelectContent>
            {fileTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="bg-primary/10 hover:bg-primary/20 backdrop-blur-md border border-white/20"
        >
          {isSearching ? "Searching..." : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {searchResults.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {isSearching ? "Searching..." : "No results found"}
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <Card key={index} className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
                <div className="font-medium text-sm text-muted-foreground mb-2">
                  {result.path} (Lines {result.context.startLine}-{result.context.endLine})
                </div>
                <pre className="bg-muted/50 p-2 rounded-md overflow-x-auto text-sm">
                  <code>{result.content}</code>
                </pre>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 