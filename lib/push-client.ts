'use client';

// Browser-side Web Push helpers: register the service worker, request
// permission, subscribe with the VAPID public key, and ship the subscription
// to the server. All functions are safe to call in unsupported browsers
// (they resolve to a clear status instead of throwing).

export type PushResult =
  | 'subscribed'
  | 'denied'
  | 'unsupported'
  | 'no-key'
  | 'error';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  return existing ?? (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
}

export async function subscribeToPush(): Promise<PushResult> {
  if (!pushSupported()) return 'unsupported';
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return 'no-key';

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const reg = await registration();
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
    }

    const json = sub.toJSON();
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: json.keys,
      }),
    });
    return res.ok ? 'subscribed' : 'error';
  } catch (e) {
    console.error('[push-client] subscribe failed', e);
    return 'error';
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
  } catch (e) {
    console.error('[push-client] unsubscribe failed', e);
  }
}
