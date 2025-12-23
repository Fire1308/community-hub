import DOMPurify from 'dompurify';

// Configure DOMPurify with safe defaults for forum content
const purifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'code', 'pre', 'a', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
  ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

// Sanitize links to prevent javascript: protocol attacks
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href');
    if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
      node.removeAttribute('href');
    }
    // Add security attributes to external links
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, purifyConfig) as string;
}

/**
 * Convert markdown-like syntax to safe HTML
 */
export function markdownToSafeHtml(content: string): string {
  if (!content) return '';
  
  // First convert markdown to HTML
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
    .replace(/^> (.*)/gm, '<blockquote class="border-l-4 border-primary pl-4 italic">$1</blockquote>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*)/gm, '<li>$2</li>')
    .replace(/\n/g, '<br/>');
  
  // Then sanitize the result
  return sanitizeHtml(html);
}

/**
 * Sanitize plain text content (converts newlines to <br/> safely)
 */
export function sanitizeTextContent(content: string): string {
  if (!content) return '';
  
  // First escape any HTML, then convert newlines
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Convert newlines to <br/> after escaping
  return escaped.replace(/\n/g, '<br/>');
}
