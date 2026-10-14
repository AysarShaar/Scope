import React from 'react';
import { isYouTubeUrl } from '../lib/youtube';
import { YouTubeEmbed } from './YouTubeEmbed';
import { blockToText, isHtmlBlock } from '../lib/articleText';

interface ArticleBodyProps {
  content: string[];
  title: string;
}

export function ArticleBody({ content, title }: ArticleBodyProps) {
  return (
    <>
      {content.map((block, idx) => {
        const text = blockToText(block);
        if (isYouTubeUrl(text) && !/\s/.test(text)) {
          return (
            <div key={idx} className="my-6">
              <YouTubeEmbed urlOrId={text} title={`${title} - مقطع ${idx + 1}`} />
            </div>
          );
        }

        if (isHtmlBlock(block)) {
          return (
            <div
              key={idx}
              className="article-rich"
              dangerouslySetInnerHTML={{ __html: block }}
            />
          );
        }

        if (block.startsWith('# ')) return <h2 key={idx} className="article-rich-h2">{block.slice(2)}</h2>;
        if (block.startsWith('> ')) return <blockquote key={idx} className="article-rich-quote">{block.slice(2)}</blockquote>;
        return <p key={idx}>{block}</p>;
      })}
    </>
  );
}
