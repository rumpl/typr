const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const chokidar = require("chokidar");

const NOTES_DIR = path.join(os.homedir(), ".typr");
const TREE_FILE = path.join(NOTES_DIR, ".tree.json");
const CONFIG_DIR = path.join(os.homedir(), ".config", "typr");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG = {
  theme: "catppuccin-mocha",
};

let mainWindow;

async function ensureNotesDir() {
  await fs.ensureDir(NOTES_DIR);
  if (!(await fs.pathExists(TREE_FILE))) {
    await fs.writeJson(TREE_FILE, { order: [], expanded: {} });
  }

  // Check if empty - create welcome note
  const files = await fs.readdir(NOTES_DIR);
  const noteFiles = files.filter((f) => f.endsWith(".md"));
  if (noteFiles.length === 0) {
    const welcomeContent = `# Welcome to Typr

Start writing your notes here. You can:

- Create new notes with the "New Note" button
- Create folders to organize your notes
- Drag and drop to reorder
- Use markdown syntax for formatting

## Markdown Examples

**Bold text** and *italic text*

- Bullet list item 1
- Bullet list item 2

1. Numbered list
2. Second item

> Blockquote

\`inline code\`

## Task Lists

- [ ] Learn Typr basics
- [x] Install the app
- [ ] Create my first note
- [ ] Organize notes into folders

## Code Blocks

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

greet("World");
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))
\`\`\`

## Tables

| Feature | Description | Status |
| --- | --- | --- |
| Task Lists | Checkable todo items | ✅ |
| Syntax Highlighting | Colorful code blocks | ✅ |
| Tables | Organize data in rows | ✅ |
| Drag & Drop | Reorder your notes | ✅ |
`;
    await fs.writeFile(
      path.join(NOTES_DIR, "Welcome.md"),
      welcomeContent,
      "utf-8",
    );
  }
}

// Recursively scan directory and build tree
async function scanDirectory(dirPath, relativePath = "") {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const result = [];

  for (const item of items) {
    // Skip hidden files/folders
    if (item.name.startsWith(".")) continue;

    const itemRelativePath = relativePath
      ? `${relativePath}/${item.name}`
      : item.name;
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      const children = await scanDirectory(fullPath, itemRelativePath);
      result.push({
        id: itemRelativePath,
        name: item.name,
        type: "folder",
        path: itemRelativePath,
        children,
      });
    } else if (item.name.endsWith(".md")) {
      const stats = await fs.stat(fullPath);
      result.push({
        id: itemRelativePath,
        name: item.name.replace(".md", ""),
        type: "file",
        path: itemRelativePath,
        updatedAt: stats.mtime,
      });
    }
  }

  return result;
}

// Get tree structure with custom ordering
async function getTree() {
  await ensureNotesDir();

  // Scan filesystem
  const scannedTree = await scanDirectory(NOTES_DIR);

  // Load saved order/state
  let treeState = { order: [], expanded: {} };
  try {
    treeState = await fs.readJson(TREE_FILE);
  } catch (e) {
    // Ignore
  }

  // Apply ordering if available
  const orderedTree = applyOrdering(scannedTree, treeState.order);

  return {
    items: orderedTree,
    expanded: treeState.expanded,
  };
}

// Apply saved ordering to scanned tree
function applyOrdering(items, order) {
  if (!order || order.length === 0) return items;

  const itemMap = new Map();
  items.forEach((item) => itemMap.set(item.id, item));

  const ordered = [];
  const seen = new Set();

  // Add items in saved order
  for (const id of order) {
    if (itemMap.has(id) && !seen.has(id)) {
      const item = itemMap.get(id);
      if (item.children) {
        item.children = applyOrdering(
          item.children,
          order.filter((o) => o.startsWith(item.id + "/")),
        );
      }
      ordered.push(item);
      seen.add(id);
    }
  }

  // Add any new items not in saved order
  for (const item of items) {
    if (!seen.has(item.id)) {
      ordered.push(item);
    }
  }

  return ordered;
}

// Flatten tree to get order array
function flattenTree(items, result = []) {
  for (const item of items) {
    result.push(item.id);
    if (item.children) {
      flattenTree(item.children, result);
    }
  }
  return result;
}

function createWindow() {
  // Set window icon for Windows/Linux
  let windowIcon;
  const iconPath = path.join(__dirname, "../build/icon.png");
  if (fs.pathExistsSync(iconPath)) {
    windowIcon = nativeImage.createFromPath(iconPath);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset",
    show: false, // Don't show until ready
    backgroundColor: "#1e1e2e", // Match default theme to prevent flash
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Show window only when content is ready to prevent flash of white
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "../dist/index.html")}`;
  mainWindow.loadURL(startUrl);

  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await ensureNotesDir();

  // Set dock icon on macOS
  if (process.platform === "darwin") {
    const iconPath = path.join(__dirname, "../build/icon.png");
    if (fs.pathExistsSync(iconPath)) {
      const icon = nativeImage.createFromPath(iconPath);
      app.dock.setIcon(icon);
    }
  }

  createWindow();

  // Watch for file changes recursively
  const watcher = chokidar.watch(NOTES_DIR, {
    ignored: [/(^|[\/\\])\../, TREE_FILE],
    persistent: true,
    depth: 10,
  });

  let debounceTimer;
  watcher.on("all", (event, changedPath) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (mainWindow) {
        getTree().then((tree) => {
          mainWindow.webContents.send("tree-changed", tree);
        });
      }
    }, 100);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handlers
ipcMain.handle("get-tree", async () => {
  return await getTree();
});

ipcMain.handle("read-note", async (event, notePath) => {
  const filePath = path.join(NOTES_DIR, notePath);
  if (await fs.pathExists(filePath)) {
    return await fs.readFile(filePath, "utf-8");
  }
  return "";
});

ipcMain.handle("save-note", async (event, notePath, content) => {
  const filePath = path.join(NOTES_DIR, notePath);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
  return true;
});

ipcMain.handle("create-note", async (event, parentPath, filename) => {
  if (!filename.endsWith(".md")) filename += ".md";

  const dirPath = parentPath ? path.join(NOTES_DIR, parentPath) : NOTES_DIR;
  const filePath = path.join(dirPath, filename);

  if (await fs.pathExists(filePath)) {
    throw new Error("File already exists");
  }

  await fs.ensureDir(dirPath);
  await fs.writeFile(filePath, "", "utf-8");

  const relativePath = parentPath ? `${parentPath}/${filename}` : filename;

  // Immediately send tree update
  if (mainWindow) {
    const tree = await getTree();
    mainWindow.webContents.send("tree-changed", tree);
  }

  return relativePath;
});

ipcMain.handle("create-folder", async (event, parentPath, folderName) => {
  const dirPath = parentPath ? path.join(NOTES_DIR, parentPath) : NOTES_DIR;
  const folderPath = path.join(dirPath, folderName);

  if (await fs.pathExists(folderPath)) {
    throw new Error("Folder already exists");
  }

  await fs.ensureDir(folderPath);

  const relativePath = parentPath ? `${parentPath}/${folderName}` : folderName;

  // Immediately send tree update
  if (mainWindow) {
    const tree = await getTree();
    mainWindow.webContents.send("tree-changed", tree);
  }

  return relativePath;
});

ipcMain.handle("delete-item", async (event, itemPath) => {
  const fullPath = path.join(NOTES_DIR, itemPath);
  await fs.remove(fullPath);

  // Immediately send tree update
  if (mainWindow) {
    const tree = await getTree();
    mainWindow.webContents.send("tree-changed", tree);
  }

  return true;
});

ipcMain.handle("rename-item", async (event, oldPath, newName) => {
  const oldFullPath = path.join(NOTES_DIR, oldPath);
  const parentDir = path.dirname(oldFullPath);
  const newFullPath = path.join(parentDir, newName);

  await fs.rename(oldFullPath, newFullPath);

  const parentRelative = path.dirname(oldPath);
  const newRelativePath =
    parentRelative === "." ? newName : `${parentRelative}/${newName}`;

  // Immediately send tree update
  if (mainWindow) {
    const tree = await getTree();
    mainWindow.webContents.send("tree-changed", tree);
  }

  return newRelativePath;
});

ipcMain.handle("move-item", async (event, itemPath, newParentPath) => {
  const oldFullPath = path.join(NOTES_DIR, itemPath);
  const itemName = path.basename(itemPath);
  const newParentFull = newParentPath
    ? path.join(NOTES_DIR, newParentPath)
    : NOTES_DIR;
  const newFullPath = path.join(newParentFull, itemName);

  if (oldFullPath === newFullPath) return itemPath;

  await fs.ensureDir(newParentFull);
  await fs.move(oldFullPath, newFullPath);

  const newRelativePath = newParentPath
    ? `${newParentPath}/${itemName}`
    : itemName;

  // Immediately send tree update
  if (mainWindow) {
    const tree = await getTree();
    mainWindow.webContents.send("tree-changed", tree);
  }

  return newRelativePath;
});

ipcMain.handle("save-tree-state", async (event, order, expanded) => {
  await fs.writeJson(TREE_FILE, { order, expanded });
  return true;
});

ipcMain.handle("toggle-folder", async (event, folderId, isExpanded) => {
  let treeState = { order: [], expanded: {} };
  try {
    treeState = await fs.readJson(TREE_FILE);
  } catch (e) {}

  treeState.expanded[folderId] = isExpanded;
  await fs.writeJson(TREE_FILE, treeState);
  return true;
});

// Config handlers
ipcMain.handle("get-config", async () => {
  try {
    await fs.ensureDir(CONFIG_DIR);
    if (await fs.pathExists(CONFIG_FILE)) {
      const config = await fs.readJson(CONFIG_FILE);
      return { ...DEFAULT_CONFIG, ...config };
    }
    return DEFAULT_CONFIG;
  } catch (e) {
    return DEFAULT_CONFIG;
  }
});

ipcMain.handle("save-config", async (event, config) => {
  try {
    await fs.ensureDir(CONFIG_DIR);
    const currentConfig = (await fs.pathExists(CONFIG_FILE))
      ? await fs.readJson(CONFIG_FILE)
      : {};
    const newConfig = { ...currentConfig, ...config };
    await fs.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
    return newConfig;
  } catch (e) {
    console.error("Failed to save config:", e);
    throw e;
  }
});
