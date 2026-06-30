// Converts a number to French words for invoice amounts
const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function convertBelow1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    if (ten === 7 || ten === 9) {
      return tens[ten] + (one === 0 ? '' : '-' + ones[10 + one]);
    }
    if (ten === 8) {
      return tens[ten] + (one === 0 ? 's' : '-' + ones[10 + one]);
    }
    return tens[ten] + (one > 0 ? '-' + ones[one] : '');
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredWord = hundreds === 1 ? 'cent' : ones[hundreds] + ' cent';
  return hundredWord + (rest > 0 ? ' ' + convertBelow1000(rest) : hundreds > 1 && rest === 0 ? 's' : '');
}

export function numberToWords(amount: number, currency = 'FCFA'): string {
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);

  let result = '';

  if (intPart === 0) {
    result = 'zéro';
  } else if (intPart < 1000) {
    result = convertBelow1000(intPart);
  } else if (intPart < 1_000_000) {
    const thousands = Math.floor(intPart / 1000);
    const rest = intPart % 1000;
    result = (thousands === 1 ? 'mille' : convertBelow1000(thousands) + ' mille') +
      (rest > 0 ? ' ' + convertBelow1000(rest) : '');
  } else if (intPart < 1_000_000_000) {
    const millions = Math.floor(intPart / 1_000_000);
    const rest = intPart % 1_000_000;
    result = convertBelow1000(millions) + ' million' + (millions > 1 ? 's' : '') +
      (rest > 0 ? ' ' + numberToWords(rest, '').trim() : '');
  } else {
    const billions = Math.floor(intPart / 1_000_000_000);
    const rest = intPart % 1_000_000_000;
    result = convertBelow1000(billions) + ' milliard' + (billions > 1 ? 's' : '') +
      (rest > 0 ? ' ' + numberToWords(rest, '').trim() : '');
  }

  const words = result.charAt(0).toUpperCase() + result.slice(1);

  if (decPart > 0) {
    return `${words} ${currency} et ${convertBelow1000(decPart)} centimes`;
  }

  return `${words} ${currency}`;
}
