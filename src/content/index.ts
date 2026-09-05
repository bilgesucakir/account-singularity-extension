import { notifyBackground } from '../shared/messaging';
import { summarizeForm } from './detect';

/**
 * Content script: watches the page for login/signup forms and reports them to
 * the background worker. It holds no credentials and performs no filling yet —
 * that arrives once the native-messaging protocol is settled.
 */

const reported = new WeakSet<HTMLFormElement>();

function inspect(form: HTMLFormElement): void {
  if (reported.has(form)) return;

  const summary = summarizeForm(form);
  if (summary.kind === 'unknown') return;

  reported.add(form);
  notifyBackground({ type: 'form.detected', form: summary, url: location.href });
}

function scan(root: ParentNode): void {
  if (root instanceof HTMLFormElement) inspect(root);
  for (const form of root.querySelectorAll<HTMLFormElement>('form')) inspect(form);

  // A mutation may add a field into a <form> that was already present (and
  // already scanned as password-less) rather than adding the form itself —
  // common with components that mount fields one at a time. Re-check the
  // enclosing form so it isn't missed.
  const enclosingForm = root instanceof Element ? root.closest('form') : null;
  if (enclosingForm) inspect(enclosingForm);
}

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof Element) scan(node);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
scan(document);
