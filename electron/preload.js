const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Tree operations
  getTree: () => ipcRenderer.invoke("get-tree"),
  saveTreeState: (order, expanded) =>
    ipcRenderer.invoke("save-tree-state", order, expanded),
  toggleFolder: (folderId, isExpanded) =>
    ipcRenderer.invoke("toggle-folder", folderId, isExpanded),

  // Note operations
  readNote: (notePath) => ipcRenderer.invoke("read-note", notePath),
  saveNote: (notePath, content) =>
    ipcRenderer.invoke("save-note", notePath, content),
  createNote: (parentPath, filename) =>
    ipcRenderer.invoke("create-note", parentPath, filename),

  // Folder operations
  createFolder: (parentPath, folderName) =>
    ipcRenderer.invoke("create-folder", parentPath, folderName),

  // Common operations
  deleteItem: (itemPath) => ipcRenderer.invoke("delete-item", itemPath),
  renameItem: (oldPath, newName) =>
    ipcRenderer.invoke("rename-item", oldPath, newName),
  moveItem: (itemPath, newParentPath) =>
    ipcRenderer.invoke("move-item", itemPath, newParentPath),

  // Events
  onTreeChanged: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("tree-changed", subscription);
    return () => ipcRenderer.removeListener("tree-changed", subscription);
  },

  // Config operations
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
});
