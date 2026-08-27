import {extensionConfig} from './config';
import definitions from './block-definitions.json';
import {
  bold,
  code,
  codeBlock,
  concat,
  formatValidationResult,
  getLastRenderValidationErrorText,
  getLastRenderValidationErrors,
  heading,
  isValid,
  italic,
  link,
  listItem,
  orderedList,
  paragraph,
  quote,
  render,
  renderWithValidation,
  text,
  unorderedList,
  validate,
  type MarkdownFragment
} from './markdown';

type BlockTypeName = 'REPORTER' | 'BOOLEAN';
type ArgumentTypeName = 'STRING' | 'NUMBER';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string | number;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

const SERIALIZED_PREFIX = 'turbowarp-markdown:v1:';
const blockDefinitions = definitions.blocks as readonly BlockDefinition[];

export class MarkdownExtension implements TurboWarpExtension {
  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
    };
  }

  public text(args: {TEXT: unknown}): string {
    return encode(text(Scratch.Cast.toString(args.TEXT)));
  }

  public bold(args: {CONTENT: unknown}): string {
    return encode(bold(decodeOrText(args.CONTENT)));
  }

  public italic(args: {CONTENT: unknown}): string {
    return encode(italic(decodeOrText(args.CONTENT)));
  }

  public link(args: {CONTENT: unknown; URL: unknown}): string {
    return encode(link(decodeOrText(args.CONTENT), Scratch.Cast.toString(args.URL)));
  }

  public code(args: {TEXT: unknown}): string {
    return encode(code(Scratch.Cast.toString(args.TEXT)));
  }

  public heading(args: {LEVEL: unknown; CONTENT: unknown}): string {
    return encode(heading(Scratch.Cast.toNumber(args.LEVEL), decodeOrText(args.CONTENT)));
  }

  public paragraph(args: {CONTENT: unknown}): string {
    return encode(paragraph(decodeOrText(args.CONTENT)));
  }

  public quote(args: {CONTENT: unknown}): string {
    return encode(quote(decodeOrText(args.CONTENT)));
  }

  public codeBlock(args: {TEXT: unknown; LANGUAGE: unknown}): string {
    return encode(codeBlock(Scratch.Cast.toString(args.TEXT), Scratch.Cast.toString(args.LANGUAGE)));
  }

  public listItem(args: {CONTENT: unknown}): string {
    return encode(listItem(decodeOrText(args.CONTENT)));
  }

  public unorderedList(args: {ITEMS: unknown}): string {
    return encode(unorderedList(decodeOrText(args.ITEMS)));
  }

  public orderedList(args: {ITEMS: unknown}): string {
    return encode(orderedList(decodeOrText(args.ITEMS)));
  }

  public concat(args: {LEFT: unknown; RIGHT: unknown}): string {
    return encode(concat(decodeOrText(args.LEFT), decodeOrText(args.RIGHT)));
  }

  public render(args: {FRAGMENT: unknown}): string {
    return render(decodeOrText(args.FRAGMENT));
  }

  public renderWithValidation(args: {FRAGMENT: unknown}): string {
    return renderWithValidation(decodeOrText(args.FRAGMENT));
  }

  public lastValidationErrors(): string {
    return getLastRenderValidationErrorText();
  }

  public lastRenderHasValidationErrors(): boolean {
    return getLastRenderValidationErrors().length > 0;
  }

  public validateMarkdown(args: {FRAGMENT: unknown}): string {
    return formatValidationResult(validate(decodeOrText(args.FRAGMENT)));
  }

  public isValidMarkdown(args: {FRAGMENT: unknown}): boolean {
    return isValid(decodeOrText(args.FRAGMENT));
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: Scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue
          }
        ])
      )
    };
  }
}

function encode(fragment: MarkdownFragment): string {
  return `${SERIALIZED_PREFIX}${JSON.stringify(fragment)}`;
}

function decodeOrText(value: unknown): MarkdownFragment {
  const raw = Scratch.Cast.toString(value);
  if (!raw.startsWith(SERIALIZED_PREFIX)) return text(raw);
  return parseFragment(raw.slice(SERIALIZED_PREFIX.length));
}

function parseFragment(json: string): MarkdownFragment {
  const parsed = JSON.parse(json) as MarkdownFragment;
  if (!isFragment(parsed)) throw new TypeError('Invalid serialized Markdown fragment.');
  return parsed;
}

function isFragment(value: unknown): value is MarkdownFragment {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.kind === 'empty') return true;
  if (record.kind === 'text' || record.kind === 'code') return typeof record.value === 'string';
  if (record.kind === 'bold' || record.kind === 'italic' || record.kind === 'paragraph') {
    return isFragment(record.content);
  }
  if (record.kind === 'link') {
    return typeof record.url === 'string' && isFragment(record.content);
  }
  if (record.kind === 'heading') {
    return typeof record.level === 'number' && isFragment(record.content);
  }
  if (record.kind === 'quote' || record.kind === 'listItem') return isFragment(record.content);
  if (record.kind === 'codeBlock') {
    return typeof record.language === 'string' && typeof record.value === 'string';
  }
  if (record.kind === 'list') {
    return (
      typeof record.ordered === 'boolean' &&
      Array.isArray(record.items) &&
      record.items.every(isFragment)
    );
  }
  if (record.kind === 'sequence') return Array.isArray(record.children) && record.children.every(isFragment);
  return false;
}
