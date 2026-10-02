-- Cloudflare D1 Database Schema for SCOPE MEDIA (سكوب ميديا)
-- Run with: npx wrangler d1 execute scope_media_db --file=./schema.sql

-- 1. Articles Table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  category_color TEXT DEFAULT 'red',
  time TEXT,
  date TEXT NOT NULL,
  comments_count INTEGER DEFAULT 0,
  is_special INTEGER DEFAULT 0,
  image_type TEXT NOT NULL,
  caption TEXT,
  author_name TEXT,
  author_role TEXT,
  content_json TEXT, -- JSON array of strings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);

-- 2. Breaking News Table
CREATE TABLE IF NOT EXISTS breaking_news (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  is_special INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  avatar TEXT,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
