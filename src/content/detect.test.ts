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
  window.history.pushState(null, '', '/');
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

  it('returns "unknown" for a lone email field on a non-auth URL', () => {
    window.history.pushState(null, '', '/newsletter');
    const form = formFixture('<form><input type="email" name="email"></form>');
    expect(classifyForm(form)).toBe('unknown');
  });

  it('returns "unknown" for a lone email field with no auth-like URL even with login wording', () => {
    // Wording alone isn't trusted without the password anchor or an auth URL —
    // it doesn't survive localization reliably.
    const form = formFixture(`
      <form aria-label="Sign in"><input type="email" name="email"></form>
    `);
    expect(classifyForm(form)).toBe('unknown');
  });

  it('classifies a lone email field as login on an auth-flow URL', () => {
    window.history.pushState(null, '', '/login/two-step');
    const form = formFixture('<form><input type="email" name="email"></form>');
    expect(classifyForm(form)).toBe('login');
  });

  it('classifies a lone email field as signup on an auth-flow URL with signup wording', () => {
    window.history.pushState(null, '', '/account/signup');
    const form = formFixture(`
      <form><input type="email" name="email"><button>Create account</button></form>
    `);
    expect(classifyForm(form)).toBe('signup');
  });

  it('does not treat a form with an email field plus other unrelated fields as identifier-only', () => {
    window.history.pushState(null, '', '/login');
    const form = formFixture(`
      <form>
        <input type="email" name="email" />
        <textarea name="message"></textarea>
      </form>
    `);
    expect(classifyForm(form)).toBe('unknown');
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
