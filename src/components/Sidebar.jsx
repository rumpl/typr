import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FileText, Trash2, GripVertical } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ notes, activeNoteId, onSelect, onReorder, onDelete }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(notes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Extract just the IDs (filenames) for the parent handler
    const newOrder = items.map(n => n.filename);
    onReorder(newOrder);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="notes-list">
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-1 p-2"
          >
            {notes.map((note, index) => (
              <Draggable key={note.filename} draggableId={note.filename} index={index}>
                {(provided, snapshot) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={clsx(
                      "group flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors",
                      activeNoteId === note.filename 
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                      snapshot.isDragging && "shadow-lg bg-white dark:bg-gray-800 opacity-90 ring-1 ring-gray-200 dark:ring-gray-700"
                    )}
                    onClick={() => onSelect(note.filename)}
                  >
                    <div 
                        {...provided.dragHandleProps} 
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing p-1"
                    >
                        <GripVertical size={14} />
                    </div>
                    
                    <FileText size={16} className="flex-shrink-0 opacity-70" />
                    
                    <span className="flex-1 truncate select-none">
                      {note.filename.replace('.md', '')}
                    </span>

                    <button
                      onClick={(e) => onDelete(note.filename, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Sidebar;

