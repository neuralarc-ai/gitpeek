import { toast } from "@/components/ui/sonner";
import { getApiKey } from "@/utils/apiKeys";

const API_BASE_URL = "https://api.github.com";

export type GitHubFile = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  url: string;
  size?: number;
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
  created_at: string;
  updated_at: string;
  default_branch: string;
};

export type RepoLanguages = {
  [key: string]: number;
};

export type Contributor = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
};

export type CommitActivity = {
  days: number[];
  total: number;
  week: number;
};

export type RepoStats = {
  commitActivity: CommitActivity[];
  codeFrequency: [number, number, number][];
  participation: {
    all: number[];
    owner: number[];
  };
  punchCard: [number, number, number][];
  branches: number;
};

// Cache for storing file tree data
const fileTreeCache = new Map<string, { data: GitHubFile[]; timestamp: number }>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

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

// Fetch repository contributors
export const fetchRepoContributors = async (owner: string, repo: string): Promise<Contributor[] | null> => {
  try {
    const token = getApiKey('github');
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contributors`, {
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
    console.error("Error fetching repo contributors:", error);
    toast.error("Failed to fetch repository contributors");
    return null;
  }
};

// Fetch repository stats
export const fetchRepoStats = async (owner: string, repo: string): Promise<RepoStats | null> => {
  try {
    const token = getApiKey('github');
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': token ? `token ${token}` : '',
    };

    // Fetch commit activity
    const commitActivityResponse = await fetch(
      `${API_BASE_URL}/repos/${owner}/${repo}/stats/commit_activity`, 
      { headers }
    );
    
    // Fetch code frequency
    const codeFrequencyResponse = await fetch(
      `${API_BASE_URL}/repos/${owner}/${repo}/stats/code_frequency`, 
      { headers }
    );
    
    // Fetch participation
    const participationResponse = await fetch(
      `${API_BASE_URL}/repos/${owner}/${repo}/stats/participation`, 
      { headers }
    );
    
    // Fetch punch card
    const punchCardResponse = await fetch(
      `${API_BASE_URL}/repos/${owner}/${repo}/stats/punch_card`, 
      { headers }
    );
    
    // Fetch branches count
    const branchesResponse = await fetch(
      `${API_BASE_URL}/repos/${owner}/${repo}/branches?per_page=1`, 
      { headers }
    );
    
    if (!commitActivityResponse.ok || !codeFrequencyResponse.ok || 
        !participationResponse.ok || !punchCardResponse.ok || !branchesResponse.ok) {
      throw new Error(`GitHub API error`);
    }
    
    const commitActivity = await commitActivityResponse.json();
    const codeFrequency = await codeFrequencyResponse.json();
    const participation = await participationResponse.json();
    const punchCard = await punchCardResponse.json();
    
    // Get branches count from Link header
    const linkHeader = branchesResponse.headers.get('Link') || '';
    const lastPageMatch = linkHeader.match(/&page=(\d+)>; rel="last"/);
    const branchesCount = lastPageMatch ? parseInt(lastPageMatch[1]) : 1;
    
    return {
      commitActivity,
      codeFrequency,
      participation,
      punchCard,
      branches: branchesCount
    };
  } catch (error) {
    console.error("Error fetching repo stats:", error);
    toast.error("Failed to fetch repository statistics");
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
    return Array.isArray(data) ? data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      sha: item.sha,
      url: item.url,
      size: item.size,
      children: item.type === 'dir' ? [] : undefined
    })) : [];
  } catch (error) {
    console.error("Error fetching repo contents:", error);
    toast.error("Failed to fetch repository contents");
    return [];
  }
};

// Build a tree structure from flat file list (recursive)
export const buildFileTree = async (owner: string, repo: string, path: string = ""): Promise<GitHubFile[]> => {
  try {
    const cacheKey = `${owner}/${repo}/${path}`;
    const cached = fileTreeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      return cached.data;
    }

    const files = await fetchRepoContents(owner, repo, path);
    
    // Process directories in parallel with chunking
    const CHUNK_SIZE = 5; // Process 5 directories at a time
    const directories = files.filter(file => file.type === 'dir');
    const filesOnly = files.filter(file => file.type === 'file');
    
    const processedDirectories: GitHubFile[] = [];
    for (let i = 0; i < directories.length; i += CHUNK_SIZE) {
      const chunk = directories.slice(i, i + CHUNK_SIZE);
      const processedChunk = await Promise.all(
        chunk.map(async (dir) => {
          const children = await buildFileTree(owner, repo, dir.path);
          return {
            ...dir,
            children
          };
        })
      );
      processedDirectories.push(...processedChunk);
    }

    // Combine files and processed directories
    const result = [...processedDirectories, ...filesOnly].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Cache the result
    fileTreeCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error("Error building file tree:", error);
    toast.error("Failed to build file tree");
    return [];
  }
};
