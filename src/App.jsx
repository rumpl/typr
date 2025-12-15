import React, { useState, useEffect } from "react";
import TreeSidebar from "./components/TreeSidebar";
import Editor from "./components/Editor";
import InputDialog from "./components/InputDialog";
import Settings from "./components/Settings";
import { applyTheme } from "./themes";
import {
  Loader2,
  Sidebar as SidebarIcon,
  Plus,
  FolderPlus,
  Settings as SettingsIcon,
} from "lucide-react";

function App() {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("catppuccin-mocha");
  const [showSidebar, setShowSidebar] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogParent, setFolderDialogParent] = useState("");

  useEffect(() => {
    loadTree();
    loadConfig();

    const cleanup = window.electronAPI.onTreeChanged((updatedTree) => {
      setTree(updatedTree.items);
      setExpanded(updatedTree.expanded || {});
    });

    return cleanup;
  }, []);

  const loadConfig = async () => {
    try {
      const config = await window.electronAPI.getConfig();
      if (config.theme) {
        setCurrentTheme(config.theme);
        applyTheme(config.theme);
      }
    } catch (err) {
      console.error("Failed to load config:", err);
      applyTheme("catppuccin-mocha");
    }
  };

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  const loadTree = async () => {
    const result = await window.electronAPI.getTree();
    setTree(result.items);
    setExpanded(result.expanded || {});
    setIsLoading(false);
  };

  const handleNoteSelect = async (notePath) => {
    try {
      const noteContent = await window.electronAPI.readNote(notePath);
      setContent(noteContent);
      setActiveNoteId(notePath);
    } catch (error) {
      console.error("Error reading note:", error);
    }
  };

  const handleCreateNote = async (parentPath = "") => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `Untitled-${timestamp}.md`;
    try {
      const newPath = await window.electronAPI.createNote(parentPath, filename);
      handleNoteSelect(newPath);
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const openFolderDialog = (parentPath = "") => {
    setFolderDialogParent(parentPath);
    setFolderDialogOpen(true);
  };

  const handleCreateFolder = async (folderName) => {
    const parentPath = folderDialogParent;

    try {
      const newPath = await window.electronAPI.createFolder(
        parentPath,
        folderName,
      );
      // Expand the parent folder if creating inside one
      if (parentPath) {
        setExpanded((prev) => ({ ...prev, [parentPath]: true }));
        await window.electronAPI.toggleFolder(parentPath, true);
      }
      // Expand the new folder
      setExpanded((prev) => ({ ...prev, [newPath]: true }));
      await window.electronAPI.toggleFolder(newPath, true);
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const handleDelete = async (itemPath) => {
    await window.electronAPI.deleteItem(itemPath);
    if (activeNoteId === itemPath || activeNoteId?.startsWith(itemPath + "/")) {
      setActiveNoteId(null);
      setContent("");
    }
  };

  const handleToggleFolder = async (folderId) => {
    const newExpanded = !expanded[folderId];
    setExpanded((prev) => ({ ...prev, [folderId]: newExpanded }));
    await window.electronAPI.toggleFolder(folderId, newExpanded);
  };

  const handleReorder = async (activeId, overId) => {
    // Reorder items at the same level
    const reorderInTree = (items) => {
      const activeIndex = items.findIndex((i) => i.id === activeId);
      const overIndex = items.findIndex((i) => i.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newItems = [...items];
        const [removed] = newItems.splice(activeIndex, 1);
        newItems.splice(overIndex, 0, removed);
        return newItems;
      }

      return items.map((item) => {
        if (item.children) {
          return { ...item, children: reorderInTree(item.children) };
        }
        return item;
      });
    };

    const newTree = reorderInTree(tree);
    setTree(newTree);

    // Save the new order
    const flattenOrder = (items) => {
      const result = [];
      for (const item of items) {
        result.push(item.id);
        if (item.children) {
          result.push(...flattenOrder(item.children));
        }
      }
      return result;
    };

    await window.electronAPI.saveTreeState(flattenOrder(newTree), expanded);
  };

  const handleMove = async (itemPath, newParentPath) => {
    try {
      const newPath = await window.electronAPI.moveItem(
        itemPath,
        newParentPath,
      );

      // Update active note path if it was moved
      if (activeNoteId === itemPath) {
        setActiveNoteId(newPath);
      } else if (activeNoteId?.startsWith(itemPath + "/")) {
        // If we moved a folder containing the active note
        const relativePath = activeNoteId.slice(itemPath.length);
        setActiveNoteId(newPath + relativePath);
      }

      // Expand the destination folder
      if (newParentPath) {
        setExpanded((prev) => ({ ...prev, [newParentPath]: true }));
        await window.electronAPI.toggleFolder(newParentPath, true);
      }
    } catch (err) {
      console.error("Failed to move item", err);
    }
  };

  const handleRename = async (itemPath, newName) => {
    try {
      const newPath = await window.electronAPI.renameItem(itemPath, newName);

      // Update active note path if it was renamed
      if (activeNoteId === itemPath) {
        setActiveNoteId(newPath);
      } else if (activeNoteId?.startsWith(itemPath + "/")) {
        // If we renamed a folder containing the active note
        const relativePath = activeNoteId.slice(itemPath.length);
        setActiveNoteId(newPath + relativePath);
      }
    } catch (err) {
      console.error("Failed to rename item", err);
    }
  };

  // Debounce save - saves after 200ms of inactivity
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (activeNoteId && content !== undefined) {
        await window.electronAPI.saveNote(activeNoteId, content);
      }
    }, 200);

    return () => clearTimeout(saveTimeout);
  }, [content, activeNoteId]);

  const handleContentChange = (newContent) => {
    setContent(newContent);
  };

  if (isLoading) {
    return (
      <div
        className="h-screen w-full flex items-center justify-center"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-muted)",
        }}
      >
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Settings Modal */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Folder Creation Dialog */}
      <InputDialog
        isOpen={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSubmit={handleCreateFolder}
        title="New Folder"
        placeholder="Folder name"
      />

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 border-r overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: showSidebar ? "var(--border-primary)" : "transparent",
          width: showSidebar ? "16rem" : "0",
          pointerEvents: showSidebar ? "auto" : "none",
        }}
      >
        <div className="w-64 h-full flex flex-col">
          <div
            className="pt-8 pb-4 px-4 border-b flex justify-between items-center"
            style={{
              borderColor: "var(--border-primary)",
              WebkitAppRegion: "drag",
            }}
          >
            <span
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Notes
            </span>
            <div className="flex gap-2" style={{ WebkitAppRegion: "no-drag" }}>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                <SettingsIcon size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <TreeSidebar
              tree={tree}
              expanded={expanded}
              activeNoteId={activeNoteId}
              onSelect={handleNoteSelect}
              onDelete={handleDelete}
              onToggleFolder={handleToggleFolder}
              onReorder={handleReorder}
              onMove={handleMove}
              onRename={handleRename}
              onCreateNote={handleCreateNote}
              onCreateFolder={openFolderDialog}
            />
          </div>

          <div
            className="p-3 border-t flex gap-2"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <button
              onClick={() => handleCreateNote("")}
              className="flex-1 py-2 px-3 rounded-md hover:opacity-90 transition-opacity text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--text-inverse)",
              }}
            >
              <Plus size={16} />
              Note
            </button>
            <button
              onClick={() => openFolderDialog("")}
              className="flex-1 py-2 px-3 rounded-md hover:opacity-90 transition-opacity text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}
            >
              <FolderPlus size={16} />
              Folder
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div
          className="absolute top-10 left-4 z-10"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <SidebarIcon size={20} />
          </button>
        </div>

        {activeNoteId ? (
          <Editor
            key={activeNoteId}
            content={content}
            onChange={handleContentChange}
            editable={true}
          />
        ) : (
          <div
            className="h-full flex flex-col items-center justify-center"
            style={{ color: "var(--text-muted)" }}
          >
            <p>Select a note or create a new one</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
