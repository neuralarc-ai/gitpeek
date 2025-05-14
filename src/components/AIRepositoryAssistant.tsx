import { useEffect } from "react";
import { FileTree } from "@/types/fileTree";
import { fileService } from "@/services/fileService";

interface AIRepositoryAssistantProps {
  fileTree: FileTree;
}

export const AIRepositoryAssistant = ({ fileTree }: AIRepositoryAssistantProps) => {
  useEffect(() => {
    if (fileTree) {
      fileService.setFileTree(fileTree);
    }
  }, [fileTree]);

  return null;
}; 