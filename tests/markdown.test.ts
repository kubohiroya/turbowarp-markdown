import {describe, expect, it} from 'vitest';
import {
  bold,
  code,
  codeBlock,
  concat,
  heading,
  italic,
  link,
  listItem,
  orderedList,
  paragraph,
  quote,
  render,
  text,
  unorderedList
} from '../src/markdown.js';

describe('Markdown builder API', () => {
  it('escapes plain text and preserves Unicode', () => {
    expect(render(text('5 * 7 [雨] <ok>'))).toBe('5 \\* 7 \\[雨\\] \\<ok\\>');
  });

  it('renders inline fragments deterministically', () => {
    const fragment = concat(bold('hot'), concat(text(' and '), italic(code('ready'))));
    expect(render(fragment)).toBe('**hot** and *`ready`*');
  });

  it('renders representative documents with block spacing', () => {
    const document = concat(heading(1, 'Sensor'), paragraph(concat(text('temperature: '), code('21C'))));
    expect(render(document)).toBe('# Sensor\n\ntemperature: `21C`');
  });

  it('builds unordered and ordered lists from immutable item fragments', () => {
    const items = concat(listItem('one'), listItem(link('two', '/two')));
    expect(render(unorderedList(items))).toBe('- one\n- [two](/two)');
    expect(render(orderedList(items))).toBe('1. one\n2. [two](/two)');
  });

  it('renders quotes and fenced code blocks safely', () => {
    expect(render(quote(paragraph('quoted')))).toBe('> quoted');
    expect(render(codeBlock('const fence = ```;', 'ts!'))).toBe(
      '````ts\nconst fence = ```;\n````'
    );
  });

  it('clamps heading levels and rejects executable URLs', () => {
    expect(render(heading(9, 'deep'))).toBe('###### deep');
    expect(() => link('bad', 'javascript:alert(1)')).toThrow('Unsafe URL value');
  });
});
