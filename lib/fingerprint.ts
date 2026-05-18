export function generateFingerprint(options?: { fresh?: boolean }): string {
  const stored = localStorage.getItem("dertin_fingerprint");
  if (stored && !options?.fresh) return stored;

  const fp = crypto.randomUUID();
  localStorage.setItem("dertin_fingerprint", fp);
  return fp;
}
