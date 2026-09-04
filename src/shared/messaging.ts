import type { DetectedFormSummary } from './protocol';

/**
 * Typed messages passed over `chrome.runtime` between the content script, the
 * popup, and the background worker. This is the in-extension channel only — it
 * never carries vault secrets, which stay between the background worker and the
 * native host.
 */

export type ContentToBackground =
  | { type: 'form.detected'; form: DetectedFormSummary; url: string }
  | { type: 'page.state'; state: 'login-success' | 'signup-submitted'; url: string };

export type PopupToBackground = { type: 'popup.status' };

export type RuntimeMessage = ContentToBackground | PopupToBackground;

export interface PopupStatusReply {
  vaultReachable: boolean;
  locked: boolean;
}

export function notifyBackground(message: ContentToBackground): void {
  void chrome.runtime.sendMessage(message);
}

export async function requestPopupStatus(): Promise<PopupStatusReply> {
  const reply: unknown = await chrome.runtime.sendMessage({
    type: 'popup.status',
  } satisfies PopupToBackground);
  return reply as PopupStatusReply;
}
