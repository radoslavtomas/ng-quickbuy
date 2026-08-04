import { extractDomainName } from './api.config';

describe('extractDomainName', () => {
  it('drops a compound suffix such as co.uk', () => {
    expect(extractDomainName('quotelinedirect.co.uk')).toBe('quotelinedirect');
    expect(extractDomainName('choicequote.co.uk')).toBe('choicequote');
  });

  it('drops a single-label suffix such as com', () => {
    expect(extractDomainName('ajg.com')).toBe('ajg');
    expect(extractDomainName('example.net')).toBe('example');
  });

  it('ignores subdomains, however many', () => {
    expect(extractDomainName('www.quotelinedirect.co.uk')).toBe('quotelinedirect');
    expect(extractDomainName('quickbuyv3-dev.quotelinedirect.co.uk')).toBe('quotelinedirect');
    expect(extractDomainName('a.b.c.ajg.com')).toBe('ajg');
  });

  it('normalises case and strips a port', () => {
    expect(extractDomainName('WWW.AJG.COM')).toBe('ajg');
    expect(extractDomainName('quotelinedirect.co.uk:4200')).toBe('quotelinedirect');
  });

  it('leaves single-label hosts alone', () => {
    expect(extractDomainName('localhost')).toBe('localhost');
  });

  it('leaves IP addresses alone, since they have no domain name', () => {
    expect(extractDomainName('127.0.0.1')).toBe('127.0.0.1');
    expect(extractDomainName('192.168.1.20')).toBe('192.168.1.20');
  });

  it('is idempotent, so an already-bare override survives unchanged', () => {
    expect(extractDomainName('quotelinedirect')).toBe('quotelinedirect');
    expect(extractDomainName(extractDomainName('quotelinedirect.co.uk'))).toBe('quotelinedirect');
  });

  it('handles other country compounds and plain country suffixes', () => {
    expect(extractDomainName('brand.com.au')).toBe('brand');
    expect(extractDomainName('brand.org.uk')).toBe('brand');
    // Not a compound: `brand` is the label immediately before the suffix.
    expect(extractDomainName('brand.de')).toBe('brand');
  });

  it('returns an empty string for empty or malformed input', () => {
    expect(extractDomainName('')).toBe('');
    expect(extractDomainName('   ')).toBe('');
    expect(extractDomainName('.')).toBe('');
  });
});
