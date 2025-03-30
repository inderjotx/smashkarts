"use client";

import { Color } from "@tiptap/extension-color";
// import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { type Editor, EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "./button";
import { Separator } from "./separator";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  PaintBucket,
  Minus,
  Pilcrow,
  CodeSquare,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import React from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

const ColorSelector = ({ editor }: { editor: Editor }) => {
  const [color, setColor] = useState("#000000");
  const [isOpen, setIsOpen] = useState(false);

  const setTextColor = (newColor: string) => {
    setColor(newColor);
    editor.chain().focus().setColor(newColor).run();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Text Color"
        >
          <PaintBucket className="h-4 w-4" style={{ color: color }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-fit p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <HexColorPicker color={color} onChange={setTextColor} />
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-md border"
            style={{ backgroundColor: color }}
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-8 w-24"
            placeholder="#000000"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

const EmojiSelector = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Insert Emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-fit p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EmojiPicker
          onEmojiClick={onEmojiClick}
          autoFocusSearch={false}
          theme={Theme.LIGHT}
        />
      </PopoverContent>
    </Popover>
  );
};

const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  const toolbarButtons = [
    {
      icon: <Bold className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      disabled: !editor.can().chain().focus().toggleBold().run(),
      tooltip: "Bold",
    },
    {
      icon: <Italic className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      disabled: !editor.can().chain().focus().toggleItalic().run(),
      tooltip: "Italic",
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
      disabled: !editor.can().chain().focus().toggleStrike().run(),
      tooltip: "Strike",
    },
    {
      icon: <Code className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
      disabled: !editor.can().chain().focus().toggleCode().run(),
      tooltip: "Code",
    },
    "separator",
    {
      icon: <Pilcrow className="h-4 w-4" />,
      onClick: () => editor.chain().focus().setParagraph().run(),
      isActive: editor.isActive("paragraph"),
      tooltip: "Paragraph",
    },
    "separator",
    {
      icon: <Heading1 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
      tooltip: "Heading 1",
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      tooltip: "Heading 2",
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      tooltip: "Heading 3",
    },
    "separator",
    {
      icon: <List className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      tooltip: "Bullet List",
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      tooltip: "Ordered List",
    },
    {
      icon: <CodeSquare className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
      tooltip: "Code Block",
    },
    {
      icon: <Quote className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      tooltip: "Blockquote",
    },
    {
      icon: <Minus className="h-4 w-4" />,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      tooltip: "Horizontal Rule",
    },
    "separator",
    {
      icon: <Undo className="h-4 w-4" />,
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().chain().focus().undo().run(),
      tooltip: "Undo",
    },
    {
      icon: <Redo className="h-4 w-4" />,
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().chain().focus().redo().run(),
      tooltip: "Redo",
    },
    <ColorSelector key="color-selector" editor={editor} />,
    <EmojiSelector key="emoji-selector" editor={editor} />,
  ];

  return (
    <div className="border-b p-1">
      <div className="flex flex-wrap gap-1">
        {toolbarButtons.map((button, index) => {
          if (button === "separator") {
            return (
              <Separator orientation="vertical" className="h-8" key={index} />
            );
          }

          if (React.isValidElement(button)) {
            return button;
          }

          return (
            <Button
              key={index}
              size="sm"
              variant="ghost"
              type="button"
              onClick={button.onClick}
              disabled={button.disabled}
              className={cn(
                "h-8 w-8 p-0",
                button.isActive && "bg-muted text-muted-foreground",
              )}
              title={button.tooltip}
            >
              {button.icon}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

const extensions = [
  Color,
  TextStyle,
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
];

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

export function RichTextEditor({
  content = "",
  onChange,
}: RichTextEditorProps) {
  return (
    <div className="relative rounded-md border">
      <EditorProvider
        slotBefore={<MenuBar />}
        extensions={extensions}
        content={content}
        onUpdate={({ editor }) => {
          onChange?.(editor.getHTML());
        }}
        editorContainerProps={{
          className: "px-4 prose-sm max-w-none dark:prose-invert ",
        }}
      ></EditorProvider>
    </div>
  );
}
