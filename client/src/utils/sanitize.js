const DANGEROUS_SELECTORS = 'script, style, iframe, object, embed, link, meta';
const ALLOWED_ATTRS = new Set(['href', 'target', 'rel', 'class', 'title', 'aria-label', 'role', 'lang']);

export const sanitizeHtml = (html = '') => {
  if (!html) return '';
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll(DANGEROUS_SELECTORS).forEach((node) => node.remove());

  template.content.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name === 'href') {
        const value = attr.value.trim();
        const isSafeLink = value.startsWith('#') || value.startsWith('/') || /^https?:/i.test(value);
        if (!isSafeLink) {
          node.removeAttribute(name);
        }
      } else if (name === 'src' || name.startsWith('on')) {
        node.removeAttribute(name);
      } else if (!ALLOWED_ATTRS.has(name) && !name.startsWith('data-')) {
        node.removeAttribute(name);
      }
    });

    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return template.innerHTML;
};
