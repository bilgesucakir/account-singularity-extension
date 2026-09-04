import { requestPopupStatus } from '../shared/messaging';

const statusEl = document.querySelector<HTMLParagraphElement>('#status');

function render(text: string, modifier: 'ok' | 'pending' | 'error'): void {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = `status status--${modifier}`;
}

async function refresh(): Promise<void> {
  try {
    const status = await requestPopupStatus();
    if (!status.vaultReachable) {
      render('Local vault not reachable', 'error');
      return;
    }
    render(status.locked ? 'Vault locked' : 'Vault unlocked', 'ok');
  } catch {
    render('Local vault not reachable', 'error');
  }
}

void refresh();
