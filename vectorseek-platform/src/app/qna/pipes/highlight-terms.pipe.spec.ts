import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightTermsPipe } from './highlight-terms.pipe';

describe('HighlightTermsPipe', () => {
  let pipe: HighlightTermsPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new HighlightTermsPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return original text when no terms provided', () => {
    const text = 'Hello world';
    expect(pipe.transform(text)).toBe(text);
  });

  it('should return original text when terms array is empty', () => {
    const text = 'Hello world';
    expect(pipe.transform(text, [])).toBe(text);
  });

  it('should highlight single term', () => {
    const text = 'Hello world';
    const result = pipe.transform(text, 'world');
    expect(result).toContain('<mark class="highlight">world</mark>');
  });

  it('should highlight multiple occurrences of same term', () => {
    const text = 'Hello world, world is beautiful';
    const result = pipe.transform(text, 'world');
    const matches = (result as string).match(/<mark class="highlight">world<\/mark>/g);
    expect(matches?.length).toBe(2);
  });

  it('should highlight multiple different terms', () => {
    const text = 'Hello world from Angular';
    const result = pipe.transform(text, ['world', 'Angular']);
    expect(result).toContain('<mark class="highlight">world</mark>');
    expect(result).toContain('<mark class="highlight">Angular</mark>');
  });

  it('should be case insensitive', () => {
    const text = 'Hello WORLD World';
    const result = pipe.transform(text, 'world');
    const matches = (result as string).match(/<mark class="highlight">/g);
    expect(matches?.length).toBe(2);
  });

  it('should escape special regex characters', () => {
    const text = 'Cost is $100.00';
    const result = pipe.transform(text, '$100');
    expect(result).toContain('<mark class="highlight">$100</mark>');
  });

  it('should handle empty terms in array', () => {
    const text = 'Hello world';
    const result = pipe.transform(text, ['', 'world', '  ']);
    expect(result).toContain('<mark class="highlight">world</mark>');
  });

  it('should sanitize output to prevent XSS', () => {
    const text = 'Hello <script>alert("xss")</script> world';
    const result = pipe.transform(text, 'world');
    // Sanitizer should remove or escape the script tag
    expect(result).not.toContain('<script>');
  });

  it('should handle text with existing HTML tags safely', () => {
    const text = 'Hello <b>world</b>';
    const result = pipe.transform(text, 'world');
    // Should still work even with existing HTML
    expect(result).toBeTruthy();
  });

  it('should handle parentheses in search terms', () => {
    const text = 'Function call is doSomething()';
    const result = pipe.transform(text, 'doSomething()');
    expect(result).toContain('<mark class="highlight">doSomething()</mark>');
  });

  it('should handle brackets in search terms', () => {
    const text = 'Array access is items[0]';
    const result = pipe.transform(text, 'items[0]');
    expect(result).toContain('<mark class="highlight">items[0]</mark>');
  });
});
