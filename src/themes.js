// Theme definitions for Typr
// Each theme defines CSS custom properties

export const themes = {
  "catppuccin-mocha": {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    isDark: true,
    colors: {
      // Base colors
      "--bg-primary": "#1e1e2e",
      "--bg-secondary": "#181825",
      "--bg-tertiary": "#313244",
      "--bg-hover": "#45475a",
      "--bg-active": "#585b70",

      // Text colors
      "--text-primary": "#cdd6f4",
      "--text-secondary": "#a6adc8",
      "--text-muted": "#6c7086",
      "--text-inverse": "#1e1e2e",

      // Border colors
      "--border-primary": "#313244",
      "--border-secondary": "#45475a",

      // Accent colors
      "--accent-primary": "#cba6f7",
      "--accent-secondary": "#f5c2e7",
      "--accent-folder": "#fab387",

      // Semantic colors
      "--color-danger": "#f38ba8",
      "--color-danger-bg": "rgba(243, 139, 168, 0.1)",
      "--color-success": "#a6e3a1",
      "--color-info": "#89b4fa",

      // Editor specific
      "--editor-text": "#cdd6f4",
      "--editor-heading": "#f5e0dc",
      "--editor-border": "#45475a",

      // Scrollbar
      "--scrollbar-thumb": "rgba(108, 112, 134, 0.5)",
    },
  },

  "catppuccin-latte": {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    isDark: false,
    colors: {
      // Base colors
      "--bg-primary": "#eff1f5",
      "--bg-secondary": "#e6e9ef",
      "--bg-tertiary": "#dce0e8",
      "--bg-hover": "#ccd0da",
      "--bg-active": "#bcc0cc",

      // Text colors
      "--text-primary": "#4c4f69",
      "--text-secondary": "#5c5f77",
      "--text-muted": "#8c8fa1",
      "--text-inverse": "#eff1f5",

      // Border colors
      "--border-primary": "#ccd0da",
      "--border-secondary": "#bcc0cc",

      // Accent colors
      "--accent-primary": "#8839ef",
      "--accent-secondary": "#ea76cb",
      "--accent-folder": "#fe640b",

      // Semantic colors
      "--color-danger": "#d20f39",
      "--color-danger-bg": "rgba(210, 15, 57, 0.1)",
      "--color-success": "#40a02b",
      "--color-info": "#1e66f5",

      // Editor specific
      "--editor-text": "#4c4f69",
      "--editor-heading": "#1e1e2e",
      "--editor-border": "#ccd0da",

      // Scrollbar
      "--scrollbar-thumb": "rgba(140, 143, 161, 0.5)",
    },
  },

  "nord-dark": {
    id: "nord-dark",
    name: "Nord",
    isDark: true,
    colors: {
      // Base colors (Nord Polar Night)
      "--bg-primary": "#2e3440",
      "--bg-secondary": "#272c36",
      "--bg-tertiary": "#3b4252",
      "--bg-hover": "#434c5e",
      "--bg-active": "#4c566a",

      // Text colors (Nord Snow Storm)
      "--text-primary": "#eceff4",
      "--text-secondary": "#e5e9f0",
      "--text-muted": "#8891a5",
      "--text-inverse": "#2e3440",

      // Border colors
      "--border-primary": "#3b4252",
      "--border-secondary": "#434c5e",

      // Accent colors (Nord Frost & Aurora)
      "--accent-primary": "#88c0d0",
      "--accent-secondary": "#81a1c1",
      "--accent-folder": "#ebcb8b",

      // Semantic colors (Nord Aurora)
      "--color-danger": "#bf616a",
      "--color-danger-bg": "rgba(191, 97, 106, 0.1)",
      "--color-success": "#a3be8c",
      "--color-info": "#5e81ac",

      // Editor specific
      "--editor-text": "#eceff4",
      "--editor-heading": "#eceff4",
      "--editor-border": "#434c5e",

      // Scrollbar
      "--scrollbar-thumb": "rgba(136, 145, 165, 0.5)",
    },
  },

  "nord-light": {
    id: "nord-light",
    name: "Nord Light",
    isDark: false,
    colors: {
      // Base colors (Nord Snow Storm inverted)
      "--bg-primary": "#eceff4",
      "--bg-secondary": "#e5e9f0",
      "--bg-tertiary": "#d8dee9",
      "--bg-hover": "#c9d1de",
      "--bg-active": "#b8c2d2",

      // Text colors (Nord Polar Night)
      "--text-primary": "#2e3440",
      "--text-secondary": "#3b4252",
      "--text-muted": "#4c566a",
      "--text-inverse": "#eceff4",

      // Border colors
      "--border-primary": "#d8dee9",
      "--border-secondary": "#c9d1de",

      // Accent colors (Nord Frost)
      "--accent-primary": "#5e81ac",
      "--accent-secondary": "#81a1c1",
      "--accent-folder": "#d08770",

      // Semantic colors (Nord Aurora - adjusted for light)
      "--color-danger": "#bf616a",
      "--color-danger-bg": "rgba(191, 97, 106, 0.1)",
      "--color-success": "#a3be8c",
      "--color-info": "#5e81ac",

      // Editor specific
      "--editor-text": "#2e3440",
      "--editor-heading": "#2e3440",
      "--editor-border": "#d8dee9",

      // Scrollbar
      "--scrollbar-thumb": "rgba(76, 86, 106, 0.4)",
    },
  },
};

export const themeList = Object.values(themes);

export function applyTheme(themeId) {
  const theme = themes[themeId];
  if (!theme) return;

  const root = document.documentElement;

  // Apply all CSS custom properties
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Set data attribute for any additional CSS targeting
  root.setAttribute("data-theme", themeId);

  // Set dark class for any remaining Tailwind dark: utilities
  if (theme.isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
