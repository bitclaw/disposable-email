import { describe, expect, it } from 'bun:test';
import { isDisposableEmail } from './validator';

describe('isDisposableEmail', () => {
  it('detects known disposable domains', () => {
    expect(isDisposableEmail('test@mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('test@yopmail.com')).toBe(true);
    expect(isDisposableEmail('test@trashmail.com')).toBe(true);
    expect(isDisposableEmail('test@sharklasers.com')).toBe(true);
  });

  it('detects rotating alias domains present in the community blocklist', () => {
    // regression test: vtmpj.net is a 10minutemail.com rotating alias that
    // slipped through the old hand-maintained 682-domain list
    expect(isDisposableEmail('test@vtmpj.net')).toBe(true);
  });

  it('allows legitimate email providers', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@outlook.com')).toBe(false);
    expect(isDisposableEmail('user@yahoo.com')).toBe(false);
    expect(isDisposableEmail('user@protonmail.com')).toBe(false);
    expect(isDisposableEmail('user@company.com')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isDisposableEmail('test@MAILINATOR.COM')).toBe(true);
    expect(isDisposableEmail('test@Yopmail.Com')).toBe(true);
  });

  it('handles invalid input gracefully', () => {
    expect(isDisposableEmail('notanemail')).toBe(false);
    expect(isDisposableEmail('')).toBe(false);
    expect(isDisposableEmail('@')).toBe(false);
  });

  it('handles emails with whitespace', () => {
    expect(isDisposableEmail('test@ mailinator.com ')).toBe(true);
  });
});
