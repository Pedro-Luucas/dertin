export function generateFingerprint(): string {
  const stored = localStorage.getItem("dertin_fingerprint");
  if (stored) return stored;

  const fp = crypto.randomUUID();
  localStorage.setItem("dertin_fingerprint", fp);
  return fp;
}
