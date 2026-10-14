import { describe, it, expect } from 'vitest';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('reads the message of an Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('accepts a plain string', () => {
    expect(errorMessage('failed')).toBe('failed');
  });

  it('returns empty string for anything else', () => {
    expect(errorMessage(null)).toBe('');
    expect(errorMessage(undefined)).toBe('');
    expect(errorMessage({ message: 'not an Error instance' })).toBe('');
    expect(errorMessage(42)).toBe('');
  });
});
