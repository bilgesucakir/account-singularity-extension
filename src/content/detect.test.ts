import { afterEach, describe, expect, it } from 'vitest';
import { classifyForm, summarizeForm } from './detect';

function formFixture(html: string): HTMLFormElement {
  document.body.innerHTML = html;
  const form = document.querySelector('form');
  if (!form) throw new Error('fixture has no <form>');
  return form;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('classifyForm', () => {
  it('returns "unknown" without a password field', () => {
    const form = formFixture('<form><input type="email" name="email"></form>');
    expect(classifyForm(form)).toBe('unknown');
  });

  it('classifies a single current-password form as login', () => {
    const form = formFixture(`
      <form id="signin" aria-label="Log in">
        <input type="email" name="email" autocomplete="username" />
        <input type="password" name="password" autocomplete="current-password" />
      </form>
    `);
    expect(classifyForm(form)).toBe('login');
  });

  it('classifies autocomplete="new-password" as signup', () => {
    const form = formFixture(`
      <form>
        <input type="email" name="email" />
        <input type="password" name="password" autocomplete="new-password" />
      </form>
    `);
    expect(classifyForm(form)).toBe('signup');
  });

  it('classifies a confirm-password field as signup', () => {
    const form = formFixture(`
      <form>
        <input type="password" name="password" />
        <input type="password" name="confirmPassword" />
      </form>
    `);
    expect(classifyForm(form)).toBe('signup');
  });

  it('classifies text signals as signup when there are no login signals', () => {
    const form = formFixture(`
      <form class="registration-form">
        <input type="password" name="pw" />
        <button type="submit">Create account</button>
      </form>
    `);
    expect(classifyForm(form)).toBe('signup');
  });
});

describe('summarizeForm', () => {
  it('collects field names and password metadata', () => {
    const form = formFixture(`
      <form>
        <input type="text" name="fullName" />
        <input type="email" id="email" />
        <input type="password" name="password" autocomplete="new-password" />
      </form>
    `);
    expect(summarizeForm(form)).toEqual({
      kind: 'signup',
      hasPasswordField: true,
      hasNewPasswordField: true,
      fieldNames: ['fullName', 'email', 'password'],
    });
  });
});
