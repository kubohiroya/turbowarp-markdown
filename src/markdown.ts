export type MarkdownFragment =
  | MarkdownText
  | MarkdownEmphasis
  | MarkdownLink
  | MarkdownCode
  | MarkdownHeading
  | MarkdownParagraph
  | MarkdownQuote
  | MarkdownCodeBlock
  | MarkdownList
  | MarkdownListItem
  | MarkdownSequence
  | MarkdownEmpty;

export interface MarkdownText {
  readonly kind: 'text';
  readonly value: string;
}

export interface MarkdownEmphasis {
  readonly kind: 'bold' | 'italic';
  readonly content: MarkdownFragment;
}

export interface MarkdownLink {
  readonly kind: 'link';
  readonly content: MarkdownFragment;
  readonly url: string;
}

export interface MarkdownCode {
  readonly kind: 'code';
  readonly value: string;
}

export interface MarkdownHeading {
  readonly kind: 'heading';
  readonly level: number;
  readonly content: MarkdownFragment;
}

export interface MarkdownParagraph {
  readonly kind: 'paragraph';
  readonly content: MarkdownFragment;
}

export interface MarkdownQuote {
  readonly kind: 'quote';
  readonly content: MarkdownFragment;
}

export interface MarkdownCodeBlock {
  readonly kind: 'codeBlock';
  readonly language: string;
  readonly value: string;
}

export interface MarkdownList {
  readonly kind: 'list';
  readonly ordered: boolean;
  readonly items: readonly MarkdownFragment[];
}

export interface MarkdownListItem {
  readonly kind: 'listItem';
  readonly content: MarkdownFragment;
}

export interface MarkdownSequence {
  readonly kind: 'sequence';
  readonly children: readonly MarkdownFragment[];
}

export interface MarkdownEmpty {
  readonly kind: 'empty';
}

export const empty: MarkdownEmpty = {kind: 'empty'};

const SAFE_URL_PATTERN = /^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?|$)/iu;

export function text(value: string): MarkdownText {
  return {kind: 'text', value};
}

export function bold(content: MarkdownFragment | string): MarkdownEmphasis {
  return {kind: 'bold', content: normalizeContent(content)};
}

export function italic(content: MarkdownFragment | string): MarkdownEmphasis {
  return {kind: 'italic', content: normalizeContent(content)};
}

export function link(content: MarkdownFragment | string, url: string): MarkdownLink {
  validateSafeUrl(url);
  return {kind: 'link', content: normalizeContent(content), url};
}

export function code(value: string): MarkdownCode {
  return {kind: 'code', value};
}

export function heading(level: number, content: MarkdownFragment | string): MarkdownHeading {
  return {kind: 'heading', level: clampHeadingLevel(level), content: normalizeContent(content)};
}

export function paragraph(content: MarkdownFragment | string): MarkdownParagraph {
  return {kind: 'paragraph', content: normalizeContent(content)};
}

export function quote(content: MarkdownFragment | string): MarkdownQuote {
  return {kind: 'quote', content: normalizeContent(content)};
}

export function codeBlock(value: string, language = ''): MarkdownCodeBlock {
  return {kind: 'codeBlock', language: sanitizeLanguage(language), value};
}

export function listItem(content: MarkdownFragment | string): MarkdownListItem {
  return {kind: 'listItem', content: normalizeContent(content)};
}

export function unorderedList(items: MarkdownFragment | string): MarkdownList {
  return {kind: 'list', ordered: false, items: normalizeItems(items)};
}

export function orderedList(items: MarkdownFragment | string): MarkdownList {
  return {kind: 'list', ordered: true, items: normalizeItems(items)};
}

export function concat(left: MarkdownFragment, right: MarkdownFragment): MarkdownFragment {
  const children = [...flattenSequence(left), ...flattenSequence(right)].filter(
    (child) => child.kind !== 'empty'
  );
  if (children.length === 0) return empty;
  if (children.length === 1) return children[0] ?? empty;
  return {kind: 'sequence', children};
}

export function render(fragment: MarkdownFragment): string {
  return renderDocument(fragment);
}

export function normalizeContent(content: MarkdownFragment | string): MarkdownFragment {
  return typeof content === 'string' ? text(content) : content;
}

function renderDocument(fragment: MarkdownFragment): string {
  if (fragment.kind === 'empty') return '';
  if (fragment.kind === 'sequence') {
    if (fragment.children.every((child) => isInline(child) || child.kind === 'sequence')) {
      return renderInline(fragment);
    }
    return fragment.children.map(renderDocument).filter(Boolean).join('\n\n');
  }
  if (isInline(fragment)) return renderInline(fragment);
  return renderBlock(fragment);
}

function renderBlock(fragment: MarkdownFragment): string {
  switch (fragment.kind) {
    case 'heading':
      return `${'#'.repeat(fragment.level)} ${renderInlineish(fragment.content)}`;
    case 'paragraph':
      return renderInlineish(fragment.content);
    case 'quote':
      return renderDocument(fragment.content)
        .split('\n')
        .map((line) => (line.length === 0 ? '>' : `> ${line}`))
        .join('\n');
    case 'codeBlock':
      return renderCodeBlock(fragment);
    case 'list':
      return fragment.items
        .map((item, index) => renderListItem(item, fragment.ordered ? `${index + 1}.` : '-'))
        .join('\n');
    case 'listItem':
      return renderInlineish(fragment.content);
    default:
      return renderDocument(fragment);
  }
}

function renderInline(fragment: MarkdownFragment): string {
  switch (fragment.kind) {
    case 'text':
      return escapeMarkdownText(fragment.value);
    case 'bold':
      return `**${renderInlineish(fragment.content)}**`;
    case 'italic':
      return `*${renderInlineish(fragment.content)}*`;
    case 'link':
      return `[${renderInlineish(fragment.content)}](${escapeUrl(fragment.url)})`;
    case 'code':
      return renderInlineCode(fragment.value);
    case 'sequence':
      return fragment.children.map(renderInlineish).join('');
    case 'empty':
      return '';
    default:
      return renderBlock(fragment);
  }
}

function renderInlineish(fragment: MarkdownFragment): string {
  return isInline(fragment) || fragment.kind === 'sequence' ? renderInline(fragment) : renderBlock(fragment);
}

function renderCodeBlock(fragment: MarkdownCodeBlock): string {
  const fence = longestBacktickRun(fragment.value) >= 3 ? '````' : '```';
  const language = fragment.language.length > 0 ? fragment.language : '';
  return `${fence}${language}\n${fragment.value}\n${fence}`;
}

function renderInlineCode(value: string): string {
  const fence = '`'.repeat(Math.max(1, longestBacktickRun(value) + 1));
  const needsPadding = value.startsWith('`') || value.endsWith('`') || value.includes('\n');
  const content = needsPadding ? ` ${value} ` : value;
  return `${fence}${content}${fence}`;
}

function renderListItem(fragment: MarkdownFragment, marker: string): string {
  const content = fragment.kind === 'listItem' ? fragment.content : fragment;
  const rendered = renderDocument(content);
  const [first = '', ...rest] = rendered.split('\n');
  const padding = ' '.repeat(marker.length + 1);
  return [`${marker} ${first}`, ...rest.map((line) => `${padding}${line}`)].join('\n');
}

function normalizeItems(items: MarkdownFragment | string): readonly MarkdownFragment[] {
  const fragment = normalizeContent(items);
  if (fragment.kind === 'sequence') return fragment.children;
  if (fragment.kind === 'empty') return [];
  return [fragment];
}

function flattenSequence(fragment: MarkdownFragment): readonly MarkdownFragment[] {
  if (fragment.kind === 'sequence') return fragment.children.flatMap(flattenSequence);
  return [fragment];
}

function isInline(fragment: MarkdownFragment): boolean {
  return ['text', 'bold', 'italic', 'link', 'code', 'empty'].includes(fragment.kind);
}

function clampHeadingLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(6, Math.max(1, Math.trunc(level)));
}

function sanitizeLanguage(language: string): string {
  return language.trim().replace(/[^a-zA-Z0-9_+.-]/gu, '');
}

function validateSafeUrl(value: string): void {
  const trimmed = value.trim();
  if (!SAFE_URL_PATTERN.test(trimmed)) {
    throw new TypeError(`Unsafe URL value: ${value}`);
  }
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!<>|])/gu, '\\$1');
}

function escapeUrl(value: string): string {
  return value.trim().replace(/\)/gu, '%29').replace(/\s/gu, '%20');
}

function longestBacktickRun(value: string): number {
  return Math.max(0, ...Array.from(value.matchAll(/`+/gu), (match) => match[0]?.length ?? 0));
}
