import React from "react";
import { X, Check } from "lucide-react";
import { themes, themeList } from "../themes";

// Theme preview colors for the visual cards
const themePreviewColors = {
  "catppuccin-mocha": {
    sidebar: "#181825",
    content: "#1e1e2e",
    text: "#cdd6f4",
  },
  "catppuccin-latte": {
    sidebar: "#e6e9ef",
    content: "#eff1f5",
    text: "#4c4f69",
  },
  "nord-dark": {
    sidebar: "#272c36",
    content: "#2e3440",
    text: "#eceff4",
  },
  "nord-light": {
    sidebar: "#e5e9f0",
    content: "#eceff4",
    text: "#2e3440",
  },
};

function ThemeCard({ theme, isSelected, onSelect }) {
  const preview = themePreviewColors[theme.id];
  
  return (
    <div
      onClick={() => onSelect(theme.id)}
      className={`theme-card ${isSelected ? "selected" : ""}`}
    >
      {/* Theme preview */}
      <div className="theme-preview">
        <div
          className="theme-preview-sidebar"
          style={{ backgroundColor: preview.sidebar }}
        />
        <div
          className="theme-preview-content"
          style={{ backgroundColor: preview.content }}
        >
          <div
            className="theme-preview-line"
            style={{ backgroundColor: preview.text, width: "80%" }}
          />
          <div
            className="theme-preview-line"
            style={{ backgroundColor: preview.text, width: "60%" }}
          />
          <div
            className="theme-preview-line"
            style={{ backgroundColor: preview.text, width: "70%" }}
          />
        </div>
      </div>
      
      {/* Theme info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-theme-primary">{theme.name}</div>
          <div className="text-xs text-theme-muted">
            {theme.isDark ? "Dark" : "Light"}
          </div>
        </div>
        {isSelected && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Check size={12} className="text-theme-inverse" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings({ isOpen, onClose, currentTheme, onThemeChange }) {
  if (!isOpen) return null;
  
  const handleThemeSelect = async (themeId) => {
    onThemeChange(themeId);
    try {
      await window.electronAPI.saveConfig({ theme: themeId });
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-lg shadow-xl"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h2 className="text-lg font-semibold text-theme-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-hover transition-colors"
          >
            <X size={20} className="text-theme-muted" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-medium text-theme-secondary uppercase tracking-wider mb-4">
            Theme
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {themeList.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={currentTheme === theme.id}
                onSelect={handleThemeSelect}
              />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-md font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "var(--bg-tertiary)"}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
