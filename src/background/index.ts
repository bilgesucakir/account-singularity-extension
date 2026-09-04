import type { PopupStatusReply, RuntimeMessage } from '../shared/messaging';
import { NATIVE_HOST_NAME, PROTOCOL_VERSION } from '../shared/protocol';

/**
 * Background service worker. It is ephemeral — the browser can tear it down
 * between events — so it keeps no durable state in memory. The native-messaging
 * port to account-singularity-core is opened lazily and allowed to close when
 * idle. Vault secrets never leave this worker for the rest of the extension.
 */

let nativePort: chrome.runtime.Port | undefined;

function connectNative(): chrome.runtime.Port {
  if (nativePort) return nativePort;

  const port = chrome.runtime.connectNative(NATIVE_HOST_NAME);
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.warn(
        '[account-singularity] native host disconnected:',
        chrome.runtime.lastError.message,
      );
    }
    nativePort = undefined;
  });
  port.onMessage.addListener((message) => {
    console.debug('[account-singularity] core →', message);
  });

  nativePort = port;
  return port;
}

async function readVaultStatus(): Promise<PopupStatusReply> {
  // TODO: issue a real `vault.status` request over the native port and await the
  // matching response once the protocol schema (docs/PROTOCOL.md) is settled.
  try {
    connectNative();
    return { vaultReachable: true, locked: true };
  } catch (error) {
    console.warn('[account-singularity] native host unavailable:', error);
    return { vaultReachable: false, locked: true };
  }
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'form.detected':
      console.debug('[account-singularity] form detected:', message.form.kind, message.url);
      // TODO: ask core whether we have (or should create) an account here.
      return false;

    case 'page.state':
      console.debug('[account-singularity] page state:', message.state, message.url);
      // TODO: on 'login-success', confirm and persist the pending account.
      return false;

    case 'popup.status':
      void readVaultStatus().then(sendResponse);
      return true; // response is sent asynchronously

    default:
      return false;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.info('[account-singularity] installed, protocol v%d', PROTOCOL_VERSION);
});
