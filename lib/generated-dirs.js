// Directories under public/ that the app writes to at runtime (generated documents, media and
// uploads). They are persisted via the /data volume in the container (see docker-entrypoint.sh)
// and served by app/api/files through the fallback rewrites in next.config.js.
// Keep docker-entrypoint.sh in sync with this list.
export const GENERATED_DIRS = [
  'activity-books', 'ai-video-studio', 'ai-video-uploads', 'checklists', 'coloring-books',
  'ebooks', 'flashcards', 'generated', 'guides', 'journals', 'library', 'music-cache',
  'notion-templates', 'planners', 'presentations', 'quizzes', 'recipe-books', 'story-reels',
  'story-reels-preview', 'storybooks', 'ugc-audio', 'uploads', 'video-editor',
  'voice-previews', 'worksheets',
]
