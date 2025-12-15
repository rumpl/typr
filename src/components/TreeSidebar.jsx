import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileText,
  Folder,
  FolderOpen,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Plus,
  FolderPlus,
  Pencil,
} from "lucide-react";
import clsx from "clsx";

// Inline edit component
function InlineEdit({ value, onSave, onCancel, isFolder }) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newName = isFolder ? editValue : `${editValue}.md`;
      if (editValue.trim()) {
        onSave(newName);
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleBlur = () => {
    const newName = isFolder ? editValue : `${editValue}.md`;
    if (editValue.trim() && editValue !== value) {
      onSave(newName);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="flex-1 rounded px-1 py-0.5 text-sm outline-none"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--accent-primary)",
        color: "var(--text-primary)",
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// Sortable tree item component
function SortableTreeItem({
  item,
  depth,
  activeNoteId,
  expanded,
  onSelect,
  onDelete,
  onToggleFolder,
  onCreateNote,
  onCreateFolder,
  onRename,
  dragOverFolderId,
  editingId,
  setEditingId,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: item.id, data: { item, depth } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFolder = item.type === "folder";
  const isExpanded = expanded[item.id];
  const isActive = activeNoteId === item.path;
  const isDragTarget = dragOverFolderId === item.id;
  const isEditing = editingId === item.id;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isEditing) return;
    if (isFolder) {
      onToggleFolder(item.id);
    } else {
      onSelect(item.path);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditingId(item.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    const confirmMsg = isFolder
      ? `Delete folder "${item.name}" and all its contents?`
      : `Delete "${item.name}"?`;
    if (confirm(confirmMsg)) {
      onDelete(item.path);
    }
  };

  const handleCreateNote = (e) => {
    e.stopPropagation();
    onCreateNote(item.path);
  };

  const handleCreateFolder = (e) => {
    e.stopPropagation();
    onCreateFolder(item.path);
  };

  const handleRenameClick = (e) => {
    e.stopPropagation();
    setEditingId(item.id);
  };

  const handleSaveRename = (newName) => {
    onRename(item.path, newName);
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  if (isItemDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          backgroundColor: "var(--bg-tertiary)",
        }}
        className="h-8 rounded-md mx-2 my-1 opacity-50"
      />
    );
  }

  const itemContent = (
    <div
      className="group flex items-center gap-1 py-1.5 px-2 mx-2 rounded-md cursor-pointer text-sm transition-all"
      style={{
        paddingLeft: `${depth * 16 + 8}px`,
        backgroundColor: isActive
          ? "var(--bg-tertiary)"
          : isDragTarget && isFolder
            ? "var(--bg-tertiary)"
            : "transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        fontWeight: isActive ? 500 : 400,
        boxShadow:
          isDragTarget && isFolder ? "0 0 0 2px var(--accent-primary)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive && !(isDragTarget && isFolder)) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing p-0.5 -ml-1"
      >
        <GripVertical size={12} />
      </div>

      {isFolder && (
        <span style={{ color: "var(--text-muted)" }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      )}

      {isFolder ? (
        isExpanded ? (
          <FolderOpen
            size={16}
            className="flex-shrink-0"
            style={{ color: "var(--accent-folder)" }}
          />
        ) : (
          <Folder
            size={16}
            className="flex-shrink-0"
            style={{ color: "var(--accent-folder)" }}
          />
        )
      ) : (
        <FileText size={16} className="flex-shrink-0 opacity-70" />
      )}

      {isEditing ? (
        <InlineEdit
          value={item.name}
          onSave={handleSaveRename}
          onCancel={handleCancelRename}
          isFolder={isFolder}
        />
      ) : (
        <span className="flex-1 truncate select-none">{item.name}</span>
      )}

      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRenameClick}
            className="p-1 rounded"
            title="Rename"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Pencil size={12} />
          </button>
          {isFolder && (
            <>
              <button
                onClick={handleCreateNote}
                className="p-1 rounded"
                title="New note in folder"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Plus size={12} />
              </button>
              <button
                onClick={handleCreateFolder}
                className="p-1 rounded"
                title="New subfolder"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <FolderPlus size={12} />
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded"
            title="Delete"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-danger)";
              e.currentTarget.style.backgroundColor = "var(--color-danger-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {itemContent}

      {isFolder && isExpanded && item.children && (
        <TreeLevel
          items={item.children}
          depth={depth + 1}
          activeNoteId={activeNoteId}
          expanded={expanded}
          onSelect={onSelect}
          onDelete={onDelete}
          onToggleFolder={onToggleFolder}
          onCreateNote={onCreateNote}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          dragOverFolderId={dragOverFolderId}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      )}
    </div>
  );
}

// Tree level component (renders a list of items)
function TreeLevel({
  items,
  depth,
  activeNoteId,
  expanded,
  onSelect,
  onDelete,
  onToggleFolder,
  onCreateNote,
  onCreateFolder,
  onRename,
  dragOverFolderId,
  editingId,
  setEditingId,
}) {
  return (
    <SortableContext
      items={items.map((i) => i.id)}
      strategy={verticalListSortingStrategy}
    >
      {items.map((item) => (
        <SortableTreeItem
          key={item.id}
          item={item}
          depth={depth}
          activeNoteId={activeNoteId}
          expanded={expanded}
          onSelect={onSelect}
          onDelete={onDelete}
          onToggleFolder={onToggleFolder}
          onCreateNote={onCreateNote}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          dragOverFolderId={dragOverFolderId}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      ))}
    </SortableContext>
  );
}

// Drag overlay item
function DragOverlayItem({ item }) {
  if (!item) return null;

  const isFolder = item.type === "folder";

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-3 rounded-md shadow-lg text-sm"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-secondary)",
        color: "var(--text-primary)",
      }}
    >
      {isFolder ? (
        <Folder size={16} style={{ color: "var(--accent-folder)" }} />
      ) : (
        <FileText size={16} className="opacity-70" />
      )}
      <span>{item.name}</span>
    </div>
  );
}

// Main TreeSidebar component
export default function TreeSidebar({
  tree,
  expanded,
  activeNoteId,
  onSelect,
  onDelete,
  onToggleFolder,
  onReorder,
  onMove,
  onRename,
  onCreateNote,
  onCreateFolder,
}) {
  const [activeItem, setActiveItem] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Find item in tree by id
  const findItem = useCallback((items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Find parent of an item
  const findParent = useCallback((items, id, parent = null) => {
    for (const item of items) {
      if (item.id === id) return parent;
      if (item.children) {
        const found = findParent(item.children, id, item);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  }, []);

  const handleDragStart = (event) => {
    const item = findItem(tree, event.active.id);
    setActiveItem(item);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (!over) {
      setDragOverFolderId(null);
      return;
    }

    const overItem = findItem(tree, over.id);
    if (overItem?.type === "folder" && overItem.id !== activeItem?.id) {
      // Don't allow dropping a folder into itself
      if (
        activeItem?.type === "folder" &&
        overItem.id.startsWith(activeItem.id + "/")
      ) {
        setDragOverFolderId(null);
        return;
      }
      setDragOverFolderId(overItem.id);
    } else {
      setDragOverFolderId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const targetFolderId = dragOverFolderId;

    setActiveItem(null);
    setDragOverFolderId(null);

    if (!over || active.id === over.id) return;

    const draggedItem = findItem(tree, active.id);
    const overItem = findItem(tree, over.id);

    if (!draggedItem || !overItem) return;

    // If we have a target folder highlighted, move into it
    if (targetFolderId && overItem.type === "folder") {
      // Check we're not moving a folder into itself
      if (
        draggedItem.type === "folder" &&
        targetFolderId.startsWith(draggedItem.id)
      ) {
        return;
      }
      onMove(draggedItem.path, overItem.path);
      return;
    }

    // Otherwise, check if we should reorder or move
    const activeParent = findParent(tree, active.id);
    const overParent = findParent(tree, over.id);

    // Same parent - reorder
    if (
      (activeParent === null && overParent === null) ||
      activeParent?.id === overParent?.id
    ) {
      onReorder(active.id, over.id);
    } else {
      // Different parent - move to the over item's parent
      const targetParentPath = overParent?.path || "";
      onMove(draggedItem.path, targetParentPath);
    }
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setDragOverFolderId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="py-2">
        <TreeLevel
          items={tree}
          depth={0}
          activeNoteId={activeNoteId}
          expanded={expanded}
          onSelect={onSelect}
          onDelete={onDelete}
          onToggleFolder={onToggleFolder}
          onCreateNote={onCreateNote}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          dragOverFolderId={dragOverFolderId}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      </div>

      <DragOverlay>
        <DragOverlayItem item={activeItem} />
      </DragOverlay>
    </DndContext>
  );
}
