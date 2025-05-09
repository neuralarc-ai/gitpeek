
import { toast } from "@/components/ui/sonner";
import { getApiKey } from "@/utils/apiKeys";

const API_BASE_URL = "https://api.github.com";

export type GitHubFile = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  url: string;
  children?: GitHubFile[];
};

export type RepoData = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
};

export type RepoLanguages = {
  [key: string]: number;
};

// Fetch repository basic data
export const fetchRepoData = async (owner: string, repo: string): Promise<RepoData | null> => {
  try {
    const token = getApiKey('github');
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': token ? `token ${token}` : '',
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching repo data:", error);
    toast.error("Failed to fetch repository data");
    return null;
  }
};

// Fetch repository languages
export const fetchRepoLanguages = async (owner: string, repo: string): Promise<RepoLanguages | null> => {
  try {
    const token = getApiKey('github');
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/languages`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': token ? `token ${token}` : '',
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching repo languages:", error);
    toast.error("Failed to fetch repository languages");
    return null;
  }
};

// Fetch repository README content
export const fetchRepoReadme = async (owner: string, repo: string): Promise<string | null> => {
  try {
    const token = getApiKey('github');
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': token ? `token ${token}` : '',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return "No README found in this repository.";
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const content = window.atob(data.content.replace(/\n/g, ''));
    return content;
  } catch (error) {
    console.error("Error fetching repo README:", error);
    toast.error("Failed to fetch repository README");
    return null;
  }
};

// Fetch repository file structure
export const fetchRepoContents = async (owner: string, repo: string, path: string = ""): Promise<GitHubFile[]> => {
  try {
    const token = getApiKey('github');
    const url = path 
      ? `${API_BASE_URL}/repos/${owner}/${repo}/contents/${path}`
      : `${API_BASE_URL}/repos/${owner}/${repo}/contents`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': token ? `token ${token}` : '',
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert GitHub API response to our GitHubFile format
    const files: GitHubFile[] = Array.isArray(data) 
      ? data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type === 'dir' ? 'dir' : 'file',
          sha: item.sha,
          url: item.url
        }))
      : [];
    
    // Sort files (directories first, then files - alphabetically within each group)
    return files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error fetching repo contents:", error);
    toast.error("Failed to fetch repository files");
    return [];
  }
};

// Build a tree structure from flat file list
export const buildFileTree = async (owner: string, repo: string): Promise<GitHubFile[]> => {
  const rootFiles = await fetchRepoContents(owner, repo);
  return rootFiles;
};
