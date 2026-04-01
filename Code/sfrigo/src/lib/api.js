import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

async function redirectToLogin() {
  await signOut(auth).catch(() => {});
  document.cookie = "__session=; path=/; max-age=0; SameSite=Strict";
  window.location.href = "/login";
}

export async function apiFetch(path, options = {}, retry = true) {
  // Forza sempre il refresh del token per avere quello più recente
  const token = await auth.currentUser?.getIdToken(true).catch(() => null);

  // Nessun utente in sessione — redirect immediato
  if (!token) {
    redirectToLogin();
    return;
  }

  const res = await fetch(`${GATEWAY}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (retry) {
      return apiFetch(path, options, false);
    }
    redirectToLogin();
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}