import MarkdownIt from 'markdown-it';
import { sanitizeHtml } from './sanitize.js';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

export const renderMarkdown = (content = '') => {
  if (!content) return '';
  const rendered = md.render(content);
  return sanitizeHtml(rendered);
};
