import { numberToWords } from './number-to-words.util';

describe('numberToWords', () => {
  it('should handle zero', () => {
    expect(numberToWords(0).toLowerCase()).toContain('zéro');
  });

  it('should handle simple numbers', () => {
    expect(numberToWords(1).toLowerCase()).toContain('un');
    expect(numberToWords(15).toLowerCase()).toContain('quinze');
    expect(numberToWords(100).toLowerCase()).toContain('cent');
  });

  it('should handle thousands', () => {
    expect(numberToWords(1000).toLowerCase()).toContain('mille');
    expect(numberToWords(531000).toLowerCase()).toContain('cinq cent');
  });

  it('should include currency', () => {
    expect(numberToWords(500, 'FCFA')).toContain('FCFA');
  });

  it('should handle decimals', () => {
    const result = numberToWords(100.50);
    expect(result).toContain('centimes');
  });
});
