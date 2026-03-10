import { auth } from "@/lib/firebase";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

export async function apiFetch(path, options = {}) {
  const token = await auth.currentUser?.getIdToken();

  const res = await fetch(`${GATEWAY}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}