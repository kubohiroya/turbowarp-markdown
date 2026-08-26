export type MarkdownInline =
  | Readonly<{kind: 'text'; value: string}>
  | Readonly<{kind: 'strong'; children: readonly MarkdownInline[]}>
  | Readonly<{kind: 'emphasis'; children: readonly MarkdownInline[]}>
  | Readonly<{kind: 'link'; children: readonly MarkdownInline[]; url: string}>
  | Readonly<{kind: 'code'; value: string}>;

export type MarkdownBlock =
  | Readonly<{kind: 'heading'; level: number; children: readonly MarkdownInline[]}>
  | Readonly<{kind: 'paragraph'; children: readonly MarkdownInline[]}>
  | Readonly<{kind: 'quote'; blocks: readonly MarkdownBlock[]}>
  | Readonly<{kind: 'codeBlock'; value: string; language: string}>
  | Readonly<{kind: 'list'; ordered: boolean; items: readonly (readonly MarkdownBlock[])[]}>;

export type MarkdownFragment =
  | Readonly<{kind: 'inline'; children: readonly MarkdownInline[]}>
  | Readonly<{kind: 'blocks'; children: readonly MarkdownBlock[]}>;

const freeze = <T>(value: T): Readonly<T> => Object.freeze(value);
const inline = (children: readonly MarkdownInline[]): MarkdownFragment =>
  freeze({kind: 'inline' as const, children: freeze([...children])});
const blocks = (children: readonly MarkdownBlock[]): MarkdownFragment =>
  freeze({kind: 'blocks' as const, children: freeze([...children])});

export const text = (value: unknown): MarkdownFragment =>
  inline([freeze({kind: 'text' as const, value: String(value ?? '')})]);

export const bold = (content: MarkdownFragment): MarkdownFragment =>
  inline([freeze({kind: 'strong' as const, children: freeze(toInline(content))})]);

export const italic = (content: MarkdownFragment): MarkdownFragment =>
  inline([freeze({kind: 'emphasis' as const, children: freeze(toInline(content))})]);

export const link = (content: MarkdownFragment, url: unknown): MarkdownFragment =>
  inline([freeze({kind: 'link' as const, children: freeze(toInline(content)), url: String(url ?? '')})]);

export const code = (value: unknown): MarkdownFragment =>
  inline([freeze({kind: 'code' as const, value: String(value ?? '')})]);

export const heading = (level: unknown, content: MarkdownFragment): MarkdownFragment => {
  const parsed = Number(level);
  const safeLevel = Number.isFinite(parsed) ? Math.min(6, Math.max(1, Math.trunc(parsed))) : 1;
  return blocks([freeze({kind: 'heading' as const, level: safeLevel, children: freeze(toInline(content))})]);
};

export const paragraph = (content: MarkdownFragment): MarkdownFragment =>
  blocks([freeze({kind: 'paragraph' as const, children: freeze(toInline(content))})]);

export const quote = (content: MarkdownFragment): MarkdownFragment =>
  blocks([freeze({kind: 'quote' as const, blocks: freeze(toBlocks(content))})]);

export const codeBlock = (value: unknown, language: unknown = ''): MarkdownFragment =>
  blocks([freeze({kind: 'codeBlock' as const, value: String(value ?? ''), language: String(language ?? '')})]);

export const listItem = (content: MarkdownFragment): readonly MarkdownBlock[] => freeze(toBlocks(content));

export const list = (
  items: readonly (readonly MarkdownBlock[])[],
  ordered = false,
): MarkdownFragment => blocks([
  freeze({kind: 'list' as const, ordered, items: freeze(items.map((item) => freeze([...item])))})
]);

export const append = (a: MarkdownFragment, b: MarkdownFragment): MarkdownFragment => {
  if (a.kind === 'inline' && b.kind === 'inline') return inline([...a.children, ...b.children]);
  return blocks([...toBlocks(a), ...toBlocks(b)]);
};

export function renderMarkdown(fragment: MarkdownFragment): string {
  return fragment.kind === 'inline'
    ? fragment.children.map(renderInline).join('')
    : fragment.children.map(renderBlock).join('\n\n');
}

function toInline(fragment: MarkdownFragment): MarkdownInline[] {
  if (fragment.kind !== 'inline') {
    throw new TypeError('This Markdown builder expects inline content here.');
  }
  return [...fragment.children];
}

function toBlocks(fragment: MarkdownFragment): MarkdownBlock[] {
  if (fragment.kind === 'blocks') return [...fragment.children];
  return [freeze({kind: 'paragraph' as const, children: freeze([...fragment.children])})];
}

function escapeText(value: string): string {
  return value.replace(/([\\`*_[\]<>#])/g, '\\$1');
}

function renderInline(node: MarkdownInline): string {
  switch (node.kind) {
    case 'text': return escapeText(node.value);
    case 'strong': return `**${node.children.map(renderInline).join('')}**`;
    case 'emphasis': return `*${node.children.map(renderInline).join('')}*`;
    case 'link': return `[${node.children.map(renderInline).join('')}](${escapeLinkDestination(node.url)})`;
    case 'code': {
      const longest = Math.max(0, ...Array.from(node.value.matchAll(/`+/g), (m) => m[0].length));
      const fence = '`'.repeat(longest + 1);
      return `${fence}${node.value}${fence}`;
    }
  }
}

function escapeLinkDestination(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\s/g, (m) => encodeURIComponent(m));
}

function renderBlock(node: MarkdownBlock): string {
  switch (node.kind) {
    case 'heading': return `${'#'.repeat(node.level)} ${node.children.map(renderInline).join('')}`;
    case 'paragraph': return node.children.map(renderInline).join('');
    case 'quote': return node.blocks.map(renderBlock).join('\n\n').split('\n').map((line) => `> ${line}`).join('\n');
    case 'codeBlock': {
      const longest = Math.max(0, ...Array.from(node.value.matchAll(/`{3,}/g), (m) => m[0].length));
      const fence = '`'.repeat(Math.max(3, longest + 1));
      const language = node.language.replace(/[^A-Za-z0-9_+.-]/g, '');
      return `${fence}${language}\n${node.value}\n${fence}`;
    }
    case 'list':
      return node.items.map((item, index) => {
        const marker = node.ordered ? `${index + 1}.` : '-';
        const rendered = item.map(renderBlock).join('\n\n').split('\n');
        return `${marker} ${rendered[0]}${rendered.slice(1).map((line) => `\n  ${line}`).join('')}`;
      }).join('\n');
  }
}
