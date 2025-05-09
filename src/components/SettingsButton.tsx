
import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ApiKeyForm } from "./ApiKeyForm";
import { saveApiKey, getApiKey } from "@/utils/apiKeys";
import { toast } from "@/components/ui/sonner";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setOpen(true)}
        className="rounded-full"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Keys</DialogTitle>
            <DialogDescription>
              Enter your API keys to enable repository analysis. 
              Keys are stored in your browser only.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <ApiKeyForm 
              type="github" 
              label="GitHub API Key" 
              description="Used to fetch repository data"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
              onSave={(key) => {
                saveApiKey('github', key);
                toast.success("GitHub API key saved");
              }}
              initialValue={getApiKey('github') || ''}
            />
            
            <ApiKeyForm 
              type="gemini" 
              label="Gemini API Key" 
              description="Used for repository analysis"
              placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              onSave={(key) => {
                saveApiKey('gemini', key);
                toast.success("Gemini API key saved");
              }}
              initialValue={getApiKey('gemini') || ''}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
