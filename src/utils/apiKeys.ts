
// API key management utilities

// Define key types
export type ApiKeyType = 'github' | 'gemini';

// Save API key to localStorage
export const saveApiKey = (type: ApiKeyType, key: string): void => {
  localStorage.setItem(`gitpeek_${type}_key`, key);
};

// Get API key from localStorage
export const getApiKey = (type: ApiKeyType): string | null => {
  return localStorage.getItem(`gitpeek_${type}_key`);
};

// Check if API key exists
export const hasApiKey = (type: ApiKeyType): boolean => {
  const key = getApiKey(type);
  return key !== null && key.trim() !== '';
};

// Clear API key
export const clearApiKey = (type: ApiKeyType): void => {
  localStorage.removeItem(`gitpeek_${type}_key`);
};
