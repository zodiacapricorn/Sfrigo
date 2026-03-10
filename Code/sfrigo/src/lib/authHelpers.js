const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

export async function setSessionCookie(user) {
  const token = await user.getIdToken();
  document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`;
}

// Salva o aggiorna l'utente in PostgreSQL tramite il gateway.
// Usa ON CONFLICT DO UPDATE, quindi è sicuro chiamarlo sia alla registrazione che al login.
export async function syncUserToDb(user, username) {
  try {
    const token = await user.getIdToken();
    await fetch(`${GATEWAY}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: username || user.displayName || user.email.split("@")[0],
      }),
    });
  } catch (err) {
    // Non blocchiamo il login se la sync fallisce — l'utente può riprovare
    console.error("Errore sync utente su DB:", err);
  }
}