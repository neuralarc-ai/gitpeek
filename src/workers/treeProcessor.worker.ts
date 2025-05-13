// Web Worker for processing tree data
self.onmessage = async (e) => {
  const { files, repo, chunkSize = 50 } = e.data;
  
  // Process files in smaller chunks to avoid blocking
  const processChunk = (chunk: any[]): any[] => {
    return chunk.map(file => {
      if (file.type === "dir") {
        return {
          name: file.name,
          children: file.children ? processChunk(file.children) : [],
        };
      }
      return { name: file.name };
    });
  };

  // Split files into smaller chunks for progressive processing
  const chunks = [];
  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize));
  }

  // Process chunks and send progress updates
  for (let i = 0; i < chunks.length; i++) {
    const processedChunk = processChunk(chunks[i]);
    self.postMessage({
      type: 'progress',
      data: processedChunk,
      progress: (i + 1) / chunks.length
    });
  }

  // Send completion message
  self.postMessage({
    type: 'complete',
    progress: 1
  });
}; 