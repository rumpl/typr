import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

export default function InputDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative rounded-lg shadow-xl w-80 p-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-md focus:outline-none"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-secondary)",
              color: "var(--text-primary)",
            }}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 text-sm rounded-md hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--text-inverse)",
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
