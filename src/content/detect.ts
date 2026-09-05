import type { DetectedFormSummary, FormKind } from '../shared/protocol';

const SIGNUP_HINTS =
  /sign[\s_-]?up|regist(er|ration)|create[\s_-]?(an[\s_-]?)?account|join[\s_-]?(now|us)?|new[\s_-]?account|kaydol|üye[\s_-]?ol|hesap[\s_-]?oluştur|kayıt[\s_-]?ol/i;
const LOGIN_HINTS =
  /log[\s_-]?(in|on)|sign[\s_-]?in|authenticate|current[\s_-]?password|oturum[\s_-]?aç|giriş[\s_-]?yap/i;
const NEW_PASSWORD_NAME = /new|confirm|repeat|retype|verify/i;
const IDENTIFIER_FIELD_NAME = /e-?mail|user(name)?|identifier/i;

// Route keywords tend to stay in English even on fully localized sites (e.g.
// account.pullandbear.com/login/two-step), so they're a more reliable signal
// than on-page copy for an identifier-only step.
const AUTH_URL_HINT =
  /log[\s_-]?in|log[\s_-]?on|sign[\s_-]?in|sign[\s_-]?up|regist(er|ration)|passwordless|two-step|verify-otp|\baccount\b|\bauth\b/i;

function passwordInputs(form: HTMLFormElement): HTMLInputElement[] {
  return [...form.querySelectorAll<HTMLInputElement>('input[type="password"]')];
}

function hasNewPassword(passwords: HTMLInputElement[]): boolean {
  return passwords.some(
    (input) =>
      input.autocomplete === 'new-password' || NEW_PASSWORD_NAME.test(`${input.name} ${input.id}`),
  );
}

function isIdentifierInput(input: HTMLInputElement): boolean {
  if (input.type === 'email') return true;
  if (input.autocomplete === 'username' || input.autocomplete === 'email') return true;
  return IDENTIFIER_FIELD_NAME.test(`${input.name} ${input.id}`);
}

/** Visible, fillable fields — excludes hidden inputs and buttons, which say nothing about form intent. */
function meaningfulFields(form: HTMLFormElement): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] {
  return [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea',
  )].filter((field) => {
    if (!(field instanceof HTMLInputElement)) return true;
    return field.type !== 'hidden' && field.type !== 'submit' && field.type !== 'button';
  });
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
 * Best-effort classification of a form as a login or signup form.
 *
 * Level 1: a password field is present — the strong, language-independent
 * anchor signal we trust most.
 *
 * Level 2: no password field yet, which is normal for the identity-first step
 * of a two-step or passwordless login (email now, password/OTP on the next
 * screen). The password anchor is gone, so this stays conservative: it only
 * fires for a single identifier field on a page whose URL itself looks like
 * an auth flow.
 */
export function classifyForm(form: HTMLFormElement): FormKind {
  const passwords = passwordInputs(form);

  if (passwords.length > 0) {
    if (passwords.length > 1 || hasNewPassword(passwords)) return 'signup';

    const signals = textSignals(form);
    if (SIGNUP_HINTS.test(signals) && !LOGIN_HINTS.test(signals)) return 'signup';

    // A single password field with no signup signals is overwhelmingly a login.
    return 'login';
  }

  // A single meaningful field that also looks like an identifier — anything
  // else present (a message box, a promo checkbox alongside other text) means
  // this probably isn't an identity-first auth step.
  const fields = meaningfulFields(form);
  const [onlyField] = fields;
  if (fields.length !== 1 || !(onlyField instanceof HTMLInputElement) || !isIdentifierInput(onlyField)) {
    return 'unknown';
  }
  if (!AUTH_URL_HINT.test(form.ownerDocument.URL)) return 'unknown';

  const signals = textSignals(form);
  if (SIGNUP_HINTS.test(signals) && !LOGIN_HINTS.test(signals)) return 'signup';
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
