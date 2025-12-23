import { useState } from 'react';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { markdownToSafeHtml } from '@/lib/sanitize';
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, placeholder = 'Write your content...', minHeight = '200px' }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState('write');

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: LinkIcon, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Code' },
    { icon: List, action: () => insertMarkdown('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Numbered List' },
  ];

  const renderPreview = () => {
    if (!value) return <p className="text-muted-foreground">Nothing to preview</p>;
    
    // Convert markdown to sanitized HTML
    const safeHtml = markdownToSafeHtml(value);
    return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-2">
          <div className="flex items-center gap-1 py-1">
            {formatButtons.map((btn, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                size="sm"
                onClick={btn.action}
                title={btn.title}
                className="h-8 w-8 p-0"
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <TabsList className="h-8 bg-transparent">
            <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="m-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none resize-none focus-visible:ring-0"
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0 p-4 prose prose-sm dark:prose-invert max-w-none" style={{ minHeight }}>
          {renderPreview()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
