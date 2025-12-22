export type ForumLayout = 
  | 'social-timeline'
  | 'editorial-magazine'
  | 'bento-grid'
  | 'glassmorphism'
  | 'terminal'
  | 'chat-style'
  | 'card-deck'
  | 'activity-heatmap'
  | 'brutalist'
  | 'neon-gradient'
  | 'kanban'
  | 'expand-hover'
  | 'emoji-playful'
  | 'classic-reimagined'
  | 'ai-curated';

export const forumLayouts: { id: ForumLayout; name: string; description: string; emoji: string }[] = [
  { id: 'social-timeline', name: 'Social Timeline', emoji: '📱', description: 'Reddit + Facebook style feed' },
  { id: 'editorial-magazine', name: 'Editorial Magazine', emoji: '📰', description: 'Medium-style article previews' },
  { id: 'bento-grid', name: 'Bento Grid', emoji: '🍱', description: 'Apple-inspired dashboard cards' },
  { id: 'glassmorphism', name: 'Glassmorphism', emoji: '✨', description: 'Frosted glass premium look' },
  { id: 'terminal', name: 'Hacker Terminal', emoji: '💻', description: 'Developer command-line style' },
  { id: 'chat-style', name: 'Chat Style', emoji: '💬', description: 'Slack/Discord thread view' },
  { id: 'card-deck', name: 'Card Deck', emoji: '🃏', description: 'Swipeable stacked cards' },
  { id: 'activity-heatmap', name: 'Activity Heatmap', emoji: '🔥', description: 'Engagement visualization' },
  { id: 'brutalist', name: 'Brutalist Minimal', emoji: '🏗️', description: 'Raw typography focused' },
  { id: 'neon-gradient', name: 'Neon Gradient', emoji: '🌈', description: 'Glowing animated borders' },
  { id: 'kanban', name: 'Kanban Board', emoji: '📋', description: 'Column-based organization' },
  { id: 'expand-hover', name: 'Expand on Hover', emoji: '🎯', description: 'Interactive preview cards' },
  { id: 'emoji-playful', name: 'Emoji Playful', emoji: '🎉', description: 'Fun casual community' },
  { id: 'classic-reimagined', name: 'Classic Reimagined', emoji: '📚', description: 'Traditional forum modernized' },
  { id: 'ai-curated', name: 'AI Curated', emoji: '🤖', description: 'Smart personalized feed' },
];
