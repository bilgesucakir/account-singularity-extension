import type { DetectedFormSummary, FormKind } from '../shared/protocol';

const SIGNUP_HINTS =
  /sign[\s_-]?up|regist(er|ration)|create[\s_-]?(an[\s_-]?)?account|join[\s_-]?(now|us)?|new[\s_-]?account/i;
const LOGIN_HINTS = /log[\s_-]?(in|on)|sign[\s_-]?in|authenticate|current[\s_-]?password/i;
const NEW_PASSWORD_NAME = /new|confirm|repeat|retype|verify/i;

function passwordInputs(form: HTMLFormElement): HTMLInputElement[] {
  return [...form.querySelectorAll<HTMLInputElement>('input[type="password"]')];
}

function hasNewPassword(passwords: HTMLInputElement[]): boolean {
  return passwords.some(
    (input) =>
      input.autocomplete === 'new-password' || NEW_PASSWORD_NAME.test(`${input.name} ${input.id}`),
  );
}

function textSignals(form: HTMLFormElement): string {
  return [
    form.id,
    form.name,
    form.className,
    form.getAttribute('action') ?? '',
    form.getAttribute('aria-label') ?? '',
    form.textContent?.slice(0, 400) ?? '',
  ].join(' ');
}

/**
 * Best-effort classification of a form as a login or signup form. Deliberately
 * conservative: a form with no password field is never our concern.
 */
export function classifyForm(form: HTMLFormElement): FormKind {
  const passwords = passwordInputs(form);
  if (passwords.length === 0) return 'unknown';

  if (passwords.length > 1 || hasNewPassword(passwords)) return 'signup';

  const signals = textSignals(form);
  if (SIGNUP_HINTS.test(signals) && !LOGIN_HINTS.test(signals)) return 'signup';

  // A single password field with no signup signals is overwhelmingly a login.
  return 'login';
}

export function summarizeForm(form: HTMLFormElement): DetectedFormSummary {
  const passwords = passwordInputs(form);
  const fields = [...form.querySelectorAll<HTMLInputElement>('input, select, textarea')];
  return {
    kind: classifyForm(form),
    hasPasswordField: passwords.length > 0,
    hasNewPasswordField: hasNewPassword(passwords),
    fieldNames: fields.map((field) => field.name || field.id).filter((name) => name.length > 0),
  };
}
