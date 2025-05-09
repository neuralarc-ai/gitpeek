
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { ApiKeyType } from "@/utils/apiKeys";

type ApiKeyFormProps = {
  type: ApiKeyType;
  label: string;
  description: string;
  placeholder: string;
  onSave: (key: string) => void;
  initialValue: string;
};

export function ApiKeyForm({ type, label, description, placeholder, onSave, initialValue }: ApiKeyFormProps) {
  const [key, setKey] = useState(initialValue);
  const [showKey, setShowKey] = useState(false);
  
  const handleSave = () => {
    onSave(key);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={`${type}-key`}>{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            id={`${type}-key`}
            type={showKey ? "text" : "password"}
            placeholder={placeholder}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
