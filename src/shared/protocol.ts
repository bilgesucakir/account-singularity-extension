/**
 * DRAFT native-messaging protocol between the background service worker and the
 * `account-singularity-core` host. The concrete schema is still undecided — see
 * `docs/PROTOCOL.md`. These types are a starting point, not a committed contract.
 */

export const PROTOCOL_VERSION = 0;

/** Must match the host manifest name registered by account-singularity-core. */
export const NATIVE_HOST_NAME = 'com.account_singularity.core';

export type RequestId = string;

export interface Envelope<TType extends string, TPayload> {
  v: typeof PROTOCOL_VERSION;
  id: RequestId;
  type: TType;
  payload: TPayload;
}

// --- extension -> core --------------------------------------------------------

export type CoreRequest =
  | Envelope<'ping', Record<string, never>>
  | Envelope<'vault.status', Record<string, never>>
  | Envelope<'fill.request', FillRequestPayload>
  | Envelope<'account.confirm', AccountConfirmPayload>;

export interface FillRequestPayload {
  origin: string;
  url: string;
  form: DetectedFormSummary;
}

export interface AccountConfirmPayload {
  origin: string;
  username: string | null;
}

// --- core -> extension -------------------------------------------------------

export type CoreResponse =
  | Envelope<'pong', { protocolVersion: number }>
  | Envelope<'vault.status', VaultStatus>
  | Envelope<'fill.payload', FillPayload>
  | Envelope<'error', { code: string; message: string }>;

export interface VaultStatus {
  locked: boolean;
  accountCount: number | null;
}

export interface FillPayload {
  fields: FillField[];
  /** Whether the core generated a fresh password for this fill (signup flow). */
  generatedPassword: boolean;
}

export interface FillField {
  selector: string;
  value: string;
  kind: FillFieldKind;
}

export type FillFieldKind = 'username' | 'email' | 'password' | 'identity';

// --- shared with content-script detection ------------------------------------

export type FormKind = 'login' | 'signup' | 'unknown';

export interface DetectedFormSummary {
  kind: FormKind;
  hasPasswordField: boolean;
  hasNewPasswordField: boolean;
  fieldNames: string[];
}
