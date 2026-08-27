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

export type MarkdownValidationSeverity = 'error' | 'warning';

export interface MarkdownValidationIssue {
  readonly severity: MarkdownValidationSeverity;
  readonly path: string;
  readonly message: string;
}

export interface MarkdownValidationResult {
  readonly valid: boolean;
  readonly issues: readonly MarkdownValidationIssue[];
}

export const empty: MarkdownEmpty = {kind: 'empty'};

const SAFE_URL_PATTERN = /^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?|$)/iu;
let lastRenderValidationResult: MarkdownValidationResult = {valid: true, issues: []};

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

export function renderWithValidation(fragment: MarkdownFragment): string {
  lastRenderValidationResult = validate(fragment);
  return renderDocument(fragment);
}

export function validate(fragment: MarkdownFragment): MarkdownValidationResult {
  const issues: MarkdownValidationIssue[] = [];
  validateFragment(fragment, '$', [], issues);
  if (fragment.kind === 'empty') {
    issues.push({severity: 'warning', path: '$', message: 'Markdown fragment is empty.'});
  }
  return {
    valid: issues.every((issue) => issue.severity !== 'error'),
    issues
  };
}

export function isValid(fragment: MarkdownFragment): boolean {
  return validate(fragment).valid;
}

export function getLastRenderValidationResult(): MarkdownValidationResult {
  return lastRenderValidationResult;
}

export function getLastRenderValidationErrors(): readonly MarkdownValidationIssue[] {
  return lastRenderValidationResult.issues.filter((issue) => issue.severity === 'error');
}

export function formatValidationResult(result: MarkdownValidationResult): string {
  if (result.issues.length === 0) return 'valid';
  return result.issues
    .map((issue) => `${issue.severity}: ${issue.path}: ${issue.message}`)
    .join('\n');
}

export function formatValidationErrors(issues: readonly MarkdownValidationIssue[]): string {
  if (issues.length === 0) return '';
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
}

export function getLastRenderValidationErrorText(): string {
  return formatValidationErrors(getLastRenderValidationErrors());
}

export function normalizeContent(content: MarkdownFragment | string): MarkdownFragment {
  return typeof content === 'string' ? text(content) : content;
}

function validateFragment(
  fragment: MarkdownFragment,
  path: string,
  ancestors: readonly MarkdownFragment[],
  issues: MarkdownValidationIssue[]
): void {
  const parent = ancestors[ancestors.length - 1];
  const inlineAncestor = ancestors.find((ancestor) => ['bold', 'italic', 'link'].includes(ancestor.kind));

  if (!isInline(fragment) && inlineAncestor !== undefined) {
    issues.push({
      severity: 'error',
      path,
      message: `${fragment.kind} cannot be nested inside ${inlineAncestor.kind}.`
    });
  }

  if (fragment.kind === 'listItem' && parent?.kind !== 'list') {
    issues.push({severity: 'error', path, message: 'listItem must be inside a list.'});
  }

  validateWarnings(fragment, path, issues);

  for (const [index, child] of childFragments(fragment).entries()) {
    validateFragment(child, `${path}.children[${index}]`, [...ancestors, fragment], issues);
  }
}

function validateWarnings(
  fragment: MarkdownFragment,
  path: string,
  issues: MarkdownValidationIssue[]
): void {
  if (fragment.kind === 'heading' && isEmptyish(fragment.content)) {
    issues.push({severity: 'warning', path, message: 'heading should have content.'});
  }
  if (fragment.kind === 'paragraph' && isEmptyish(fragment.content)) {
    issues.push({severity: 'warning', path, message: 'paragraph is empty.'});
  }
  if (fragment.kind === 'link' && isEmptyish(fragment.content)) {
    issues.push({severity: 'warning', path, message: 'link should have visible content.'});
  }
  if (fragment.kind === 'link' && fragment.url.trim().length === 0) {
    issues.push({severity: 'warning', path, message: 'link should have a destination URL.'});
  }
  if (fragment.kind === 'list' && fragment.items.length === 0) {
    issues.push({severity: 'warning', path, message: 'list should contain at least one item.'});
  }
}

function childFragments(fragment: MarkdownFragment): readonly MarkdownFragment[] {
  switch (fragment.kind) {
    case 'bold':
    case 'italic':
    case 'link':
    case 'heading':
    case 'paragraph':
    case 'quote':
    case 'listItem':
      return [fragment.content];
    case 'list':
      return fragment.items;
    case 'sequence':
      return fragment.children;
    default:
      return [];
  }
}

function isEmptyish(fragment: MarkdownFragment): boolean {
  if (fragment.kind === 'empty') return true;
  if (fragment.kind === 'text' || fragment.kind === 'code') return fragment.value.length === 0;
  if (fragment.kind === 'sequence') return fragment.children.every(isEmptyish);
  return false;
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
