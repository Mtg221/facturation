import { describe, it, expect } from 'vitest';
import { cn } from '../../../utils/cn';

describe('Design System & UI Component Utility Tests', () => {
  it('cn helper combines class names without duplicate tailwind classes', () => {
    const combined = cn('px-4 py-2', 'px-6', { 'bg-primary': true, 'text-muted': false });
    expect(combined).toBe('py-2 px-6 bg-primary');
  });

  it('cn helper handles conditional class merging', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'btn-base',
      isActive && 'btn-active',
      isDisabled && 'btn-disabled',
    );
    expect(result).toBe('btn-base btn-active');
  });
});
