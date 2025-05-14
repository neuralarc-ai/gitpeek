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

// Helper function to fetch key repository files
const fetchKeyFiles = async (owner: string, repo: string, token: string | null): Promise<string> => {
  // First, get the repository's root contents
  let rootFiles: any[] = [];
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contents`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': token ? `token ${token}` : '',
      }
    });
    
    if (response.ok) {
      rootFiles = await response.json();
    }
  } catch (error) {
    console.log('Failed to fetch repository contents:', error);
  }

  // Get the repository's primary language
  let primaryLanguage = '';
  try {
    const langResponse = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/languages`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': token ? `token ${token}` : '',
      }
    });
    
    if (langResponse.ok) {
      const languages = await langResponse.json();
      primaryLanguage = Object.entries(languages)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || '';
    }
  } catch (error) {
    console.log('Failed to fetch repository languages:', error);
  }

  // Map languages to their relevant configuration files
  const languageToFiles: { [key: string]: string[] } = {
    'JavaScript': ['package.json', 'tsconfig.json', '.babelrc', 'webpack.config.js'],
    'TypeScript': ['package.json', 'tsconfig.json', '.babelrc', 'webpack.config.js'],
    'Python': ['requirements.txt', 'setup.py', 'Pipfile', 'pyproject.toml'],
    'Java': ['pom.xml', 'build.gradle', 'build.sbt'],
    'Go': ['go.mod', 'go.sum'],
    'Ruby': ['Gemfile', 'Gemfile.lock'],
    'PHP': ['composer.json', 'composer.lock'],
    'Rust': ['Cargo.toml', 'Cargo.lock'],
    'C#': ['*.csproj', '*.sln'],
    'C++': ['CMakeLists.txt', 'Makefile'],
    'C': ['Makefile', 'CMakeLists.txt'],
  };

  // Get relevant files for the primary language, or use a minimal set if language is unknown
  const possibleFiles = primaryLanguage && languageToFiles[primaryLanguage] 
    ? languageToFiles[primaryLanguage]
    : ['package.json', 'requirements.txt'];

  // Filter files that actually exist in the repository
  const existingFiles = possibleFiles.filter(file => 
    rootFiles.some(rootFile => rootFile.name === file)
  );

  let keyFilesContent = '';
  
  // If we found any configuration files, fetch their contents
  if (existingFiles.length > 0) {
    for (const file of existingFiles) {
      try {
        const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contents/${file}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': token ? `token ${token}` : '',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = window.atob(data.content.replace(/\n/g, ''));
          keyFilesContent += `\n## ${file}\n\`\`\`\n${content}\n\`\`\`\n`;
        }
      } catch (error) {
        console.log(`Failed to fetch ${file}:`, error);
        continue;
      }
    }
  }

  // Always include the repository structure
  keyFilesContent += '\n## Repository Structure\n';
  keyFilesContent += 'Here are the main files and directories in the repository:\n\n';
  keyFilesContent += rootFiles
    .map((file: any) => `- ${file.name} (${file.type})`)
    .join('\n');

  return keyFilesContent;
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
        // Try to find alternative documentation files
        const alternativeFiles = [
          'README.md', 'readme.md', 'README.txt', 'readme.txt',
          'docs/README.md', 'docs/readme.md', 'documentation/README.md',
          'doc/README.md', '.github/README.md'
        ];
        
        for (const file of alternativeFiles) {
          try {
            const altResponse = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contents/${file}`, {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': token ? `token ${token}` : '',
              }
            });
            
            if (altResponse.ok) {
              const data = await altResponse.json();
              const content = window.atob(data.content.replace(/\n/g, ''));
              return content;
            }
          } catch (error) {
            console.log(`Failed to fetch alternative file ${file}:`, error);
            continue;
          }
        }

        // If no documentation found, create a helpful default README
        const defaultReadme = `# ${repo}

## Overview
This repository does not have a README file. Here's what we know about the project:

## Repository Information
- Owner: ${owner}
- Repository: ${repo}

## Key Files
Below are some key files that might help you understand the project structure:`;

        // Fetch key files to add to the default README
        const keyFilesContent = await fetchKeyFiles(owner, repo, token);
        
        return defaultReadme + keyFilesContent;
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
