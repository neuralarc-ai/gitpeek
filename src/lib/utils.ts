import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FileIcon, FileText, FileCode, FileImage, FileJson, FileType, FileArchive, FileAudio, FileVideo, LucideIcon } from "lucide-react"
import { createElement } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileIcon(filename: string, className: string = ""): JSX.Element {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: { [key: string]: LucideIcon } = {
    // Code files
    'js': FileCode,
    'ts': FileCode,
    'jsx': FileCode,
    'tsx': FileCode,
    'py': FileCode,
    'java': FileCode,
    'c': FileCode,
    'cpp': FileCode,
    'go': FileCode,
    'rs': FileCode,
    'php': FileCode,
    'rb': FileCode,
    'sh': FileCode,
    'bash': FileCode,
    
    // Web files
    'html': FileCode,
    'css': FileCode,
    'scss': FileCode,
    'less': FileCode,
    'xml': FileCode,
    
    // Data files
    'json': FileJson,
    'yaml': FileJson,
    'yml': FileJson,
    'toml': FileJson,
    'ini': FileJson,
    'env': FileJson,
    
    // Text files
    'txt': FileText,
    'md': FileText,
    'markdown': FileText,
    'rst': FileText,
    
    // Image files
    'png': FileImage,
    'jpg': FileImage,
    'jpeg': FileImage,
    'gif': FileImage,
    'svg': FileImage,
    'ico': FileImage,
    
    // Font files
    'ttf': FileType,
    'otf': FileType,
    'woff': FileType,
    'woff2': FileType,
    
    // Archive files
    'zip': FileArchive,
    'rar': FileArchive,
    '7z': FileArchive,
    'tar': FileArchive,
    'gz': FileArchive,
    
    // Media files
    'mp3': FileAudio,
    'wav': FileAudio,
    'ogg': FileAudio,
    'mp4': FileVideo,
    'webm': FileVideo,
    'mov': FileVideo,
  };
  
  const Icon = iconMap[extension || ''] || FileIcon;
  return createElement(Icon, { className });
}
