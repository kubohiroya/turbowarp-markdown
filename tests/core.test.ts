import {describe, expect, it} from 'vitest';
import {append, bold, code, codeBlock, heading, italic, link, paragraph, quote, renderMarkdown, text} from '../src/core.js';

describe('Markdown builder', () => {
  it('builds a representative document immutably', () => {
    const title = heading(1, text('Sensor'));
    const body = paragraph(append(text('Temperature: '), bold(text('24 °C'))));
    const document = append(title, body);
    expect(renderMarkdown(document)).toBe('# Sensor\n\nTemperature: **24 °C**');
    expect(renderMarkdown(title)).toBe('# Sensor');
  });

  it('escapes ordinary text', () => {
    expect(renderMarkdown(text('*not bold* <tag>'))).toBe('\\*not bold\\* \\<tag\\>');
  });

  it('supports inline formatting and links', () => {
    const value = append(italic(text('read ')), link(code('x`y'), 'https://example.com/a b'));
    expect(renderMarkdown(value)).toBe('*read *[`x`y``](https://example.com/a%20b)');
  });

  it('clamps heading levels', () => {
    expect(renderMarkdown(heading(99, text('x')))).toBe('###### x');
  });

  it('chooses a safe code fence', () => {
    expect(renderMarkdown(codeBlock('```\nhello', 'js<script>'))).toBe('````jsscript\n```\nhello\n````');
  });

  it('renders quotes', () => {
    expect(renderMarkdown(quote(paragraph(text('hello\nworld'))))).toBe('> hello\n> world');
  });
});
