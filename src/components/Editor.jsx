import React, { useMemo, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { marked } from "marked";
import TurndownService from "turndown";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Calculate document statistics
function getDocumentStats(text) {
  if (!text || text.trim() === "") {
    return { words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0, readingTime: 0 };
  }

  const trimmedText = text.trim();
  
  // Word count - split by whitespace and filter empty strings
  const words = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
  
  // Character counts
  const characters = trimmedText.length;
  const charactersNoSpaces = trimmedText.replace(/\s/g, "").length;
  
  // Sentence count - split by sentence-ending punctuation
  const sentences = trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  // Paragraph count - split by double newlines or count non-empty blocks
  const paragraphs = trimmedText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;
  
  // Reading time (average 200 words per minute)
  const readingTime = Math.ceil(words / 200);

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
}

// Status bar component
function StatusBar({ editor }) {
  const [stats, setStats] = useState({ words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0, readingTime: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateStats = () => {
      const text = editor.getText();
      setStats(getDocumentStats(text));
    };

    // Initial calculation
    updateStats();

    // Listen to editor updates
    editor.on("update", updateStats);

    return () => {
      editor.off("update", updateStats);
    };
  }, [editor]);

  return (
    <div
      className="flex items-center justify-end gap-4 px-4 py-2 text-xs"
      style={{
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-primary)",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <span>{stats.words} {stats.words === 1 ? "word" : "words"}</span>
      <span>{stats.characters} {stats.characters === 1 ? "character" : "characters"}</span>
      <span>{stats.sentences} {stats.sentences === 1 ? "sentence" : "sentences"}</span>
      <span>{stats.paragraphs} {stats.paragraphs === 1 ? "paragraph" : "paragraphs"}</span>
      <span>{stats.readingTime} min read</span>
    </div>
  );
}

// Transform markdown to HTML with proper TipTap-compatible structure
function markdownToHtml(markdown) {
  // First, let marked parse the markdown
  let html = marked.parse(markdown || "");
  
  // Transform task list items to TipTap format
  // Marked outputs: <li><input type="checkbox"> text</li>
  // TipTap expects: <li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div>text</div></li>
  html = html.replace(
    /<li><input([^>]*?)>\s*([\s\S]*?)<\/li>/gi,
    (match, attrs, content) => {
      const isChecked = attrs.includes('checked');
      return `<li data-type="taskItem" data-checked="${isChecked}"><label><input type="checkbox"${isChecked ? ' checked' : ''}></label><div>${content.trim()}</div></li>`;
    }
  );
  
  // Wrap consecutive taskItems in a taskList
  html = html.replace(
    /<ul>\s*((?:<li data-type="taskItem"[\s\S]*?<\/li>\s*)+)<\/ul>/gi,
    (match, items) => `<ul data-type="taskList">${items}</ul>`
  );
  
  return html;
}

const Editor = ({ content, onChange, editable = true }) => {
  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    // Add task list support to turndown
    service.addRule("taskList", {
      filter: (node) => {
        return (
          node.nodeName === "UL" &&
          node.getAttribute("data-type") === "taskList"
        );
      },
      replacement: (content) => {
        return content + "\n";
      },
    });

    service.addRule("taskListItem", {
      filter: (node) => {
        return (
          node.nodeName === "LI" &&
          node.getAttribute("data-type") === "taskItem"
        );
      },
      replacement: (content, node) => {
        const checked = node.getAttribute("data-checked") === "true";
        const checkbox = checked ? "[x]" : "[ ]";
        // Clean up the content - remove the checkbox that might be there
        const cleanContent = content.replace(/^\s*\[[ x]\]\s*/i, "").trim();
        return `- ${checkbox} ${cleanContent}\n`;
      },
    });

    // Add table support to turndown
    service.addRule("tableCell", {
      filter: ["th", "td"],
      replacement: (content, node) => {
        return ` ${content.trim()} |`;
      },
    });

    service.addRule("tableRow", {
      filter: "tr",
      replacement: (content, node) => {
        const isHeaderRow = node.parentNode && node.parentNode.nodeName === "THEAD";
        let row = "|" + content + "\n";
        
        if (isHeaderRow) {
          const cells = node.querySelectorAll("th, td");
          const separator = "|" + Array.from(cells).map(() => " --- ").join("|") + "|\n";
          row += separator;
        }
        
        return row;
      },
    });

    service.addRule("table", {
      filter: "table",
      replacement: (content, node) => {
        // Ensure there's a header row separator if no thead
        const hasHeader = node.querySelector("thead");
        if (!hasHeader) {
          const firstRow = content.split("\n")[0];
          if (firstRow) {
            const cellCount = (firstRow.match(/\|/g) || []).length - 1;
            const separator = "|" + Array(cellCount).fill(" --- ").join("|") + "|\n";
            const rows = content.split("\n");
            rows.splice(1, 0, separator.trim());
            return "\n" + rows.join("\n") + "\n";
          }
        }
        return "\n" + content + "\n";
      },
    });

    // Handle code blocks with language
    service.addRule("codeBlock", {
      filter: (node) => {
        return (
          node.nodeName === "PRE" &&
          node.querySelector("code")
        );
      },
      replacement: (content, node) => {
        const codeNode = node.querySelector("code");
        const language = codeNode?.className?.match(/language-(\w+)/)?.[1] || "";
        const code = codeNode?.textContent || content;
        return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
      },
    });

    return service;
  }, []);

  const initialHtml = useMemo(() => {
    return markdownToHtml(content);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block in favor of lowlight version
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
        HTMLAttributes: {
          class: "code-block",
        },
      }),
    ],
    content: initialHtml,
    editable: editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto editor-scroll">
        <div className="max-w-3xl mx-auto py-8 px-8 md:px-12 lg:px-0">
          <EditorContent editor={editor} />
        </div>
      </div>
      <StatusBar editor={editor} />
    </div>
  );
};

export default Editor;
