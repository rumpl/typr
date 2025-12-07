import React, { useMemo, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";
import TurndownService from "turndown";

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

const Editor = ({ content, onChange, editable = true }) => {
  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    return service;
  }, []);

  const initialHtml = useMemo(() => {
    return marked.parse(content || "");
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
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
