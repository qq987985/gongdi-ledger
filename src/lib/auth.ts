const SESSION_KEY = "gongdi-gate-session";
const REMEMBER_KEY = "gongdi-gate-remember";

async function sha256Hex(text: string): Promise<string> {
  const c = globalThis.crypto;
  if (c?.subtle) {
    const buf = await c.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return sha256Pure(text);
}

function sha256Pure(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const K = [
    1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748,
    2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206,
    2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983,
    1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671,
    3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372,
    1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
    3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734,
    506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
    1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
    3329325298,
  ];
  function rotr(n: number, x: number) {
    return (x >>> n) | (x << (32 - n));
  }
  const l = bytes.length;
  const withPad = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  withPad.set(bytes);
  withPad[l] = 128;
  const view = new DataView(withPad.buffer);
  view.setUint32(withPad.length - 4, l * 8, false);
  let h0 = 1779033703,
    h1 = 3144134277,
    h2 = 1013904242,
    h3 = 2773480762,
    h4 = 1359893119,
    h5 = 2600822924,
    h6 = 528734635,
    h7 = 1541459225;
  const w = new Uint32Array(64);
  for (let i = 0; i < withPad.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const temp2 = ((rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
}

export async function hashPassword(raw: string): Promise<string> {
  const t = raw.trim();
  if (!t) return "";
  return sha256Hex(`gongdi-ledger::${t}`);
}

export function gateUnlocked(accessHash: string): boolean {
  if (!accessHash || typeof window === "undefined") return !accessHash;
  return (sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY)) === accessHash;
}

export function unlockGate(accessHash: string, remember: boolean): void {
  sessionStorage.setItem(SESSION_KEY, accessHash);
  if (remember) localStorage.setItem(REMEMBER_KEY, accessHash);
  else localStorage.removeItem(REMEMBER_KEY);
}

export function lockGate(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

export interface BookInfo {
  id: string;
  name: string;
  ownerId?: string;
}

export interface AuthStatus {
  persist: boolean;
  needSetup: boolean;
  user: AuthUser | null;
  books: BookInfo[];
  bookId: string;
  users: AuthUser[];
  perms?: string[];
  members: unknown[];
}

export async function authStatus(): Promise<AuthStatus> {
  const j = await (await fetch("/api/auth", { credentials: "include" })).json();
  return {
    persist: Boolean(j.persist),
    needSetup: Boolean(j.needSetup),
    user: j.user || null,
    books: j.books || [],
    bookId: j.bookId || "",
    users: j.users || [],
    perms: j.perms,
    members: j.members || [],
  };
}

export async function authOp(op: string, extra: Record<string, unknown> = {}): Promise<any> {
  const r = await fetch("/api/auth", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op, ...extra }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "请求失败");
  return j;
}
