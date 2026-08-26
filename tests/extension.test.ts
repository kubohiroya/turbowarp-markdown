import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {MarkdownExtension} from '../src/extension.js';

beforeEach(() => {
  vi.stubGlobal('Scratch', {
    BlockType: {REPORTER: 'reporter'},
    ArgumentType: {STRING: 'string', NUMBER: 'number'},
    Cast: {
      toString: (value: unknown) => String(value),
      toNumber: (value: unknown) => Number(value),
      toBoolean: (value: unknown) => Boolean(value)
    },
    translate: (
      message: string | {default: string},
      placeholders: Record<string, string | number> = {}
    ) => {
      const value = typeof message === 'string' ? message : message.default;
      return Object.entries(placeholders).reduce(
        (result, [name, replacement]) => result.replace(`{${name}}`, String(replacement)),
        value
      );
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MarkdownExtension', () => {
  it('publishes block metadata', () => {
    const info = new MarkdownExtension().getInfo() as {
      name: string;
      blocks: Array<{opcode: string}>;
    };
    expect(info.name).toBe('TurboWarp Markdown');
    expect(info.blocks.map((block) => block.opcode)).toContain('render');
    expect(info.blocks.map((block) => block.opcode)).not.toContain('rawMarkdown');
  });

  it('builds and renders Markdown through reporter values', () => {
    const extension = new MarkdownExtension();
    const title = extension.heading({LEVEL: 1, CONTENT: 'Sensor'});
    const body = extension.paragraph({
      CONTENT: extension.concat({
        LEFT: extension.text({TEXT: 'temperature: '}),
        RIGHT: extension.code({TEXT: '21C'})
      })
    });
    expect(extension.render({FRAGMENT: extension.concat({LEFT: title, RIGHT: body})})).toBe(
      '# Sensor\n\ntemperature: `21C`'
    );
  });

  it('builds lists through reporter values', () => {
    const extension = new MarkdownExtension();
    const items = extension.concat({
      LEFT: extension.listItem({CONTENT: 'one'}),
      RIGHT: extension.listItem({CONTENT: 'two'})
    });
    expect(extension.render({FRAGMENT: extension.unorderedList({ITEMS: items})})).toBe(
      '- one\n- two'
    );
  });
});
