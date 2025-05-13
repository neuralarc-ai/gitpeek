// Tree processor worker
self.onmessage = (e) => {
  const { files, repo } = e.data;
  
  // Process files in chunks for better performance
  const processFiles = (files: any[]): any[] => {
    return files.map(file => {
      if (file.type === "dir") {
        return {
          name: file.name,
          children: file.children ? processFiles(file.children) : [],
        };
      }
      return { name: file.name };
    });
  };

  // Process the files and send back the result
  const result = processFiles(files);
  self.postMessage(result);
}; 