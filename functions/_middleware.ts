// functions/_middleware.ts

export const onRequest: PagesFunction<{ SITE_PASSWORD: string }> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("Cookie") || "";
  const SITE_PASSWORD = env.SITE_PASSWORD;

  // 1. Check, ob der Auth-Cookie bereits existiert und korrekt ist
  if (cookieHeader.includes(`auth_token=${SITE_PASSWORD}`)) {
    return next(); // Passwort korrekt, weiter zur Seite
  }

  // 2. Wenn das Passwort per POST gesendet wurde (Login-Versuch)
  if (request.method === "POST") {
    const formData = await request.formData();
    const enteredPassword = formData.get("password");

    if (enteredPassword === SITE_PASSWORD) {
      // Passwort korrekt! Cookie setzen und Seite neu laden
      return new Response(null, {
        status: 302,
        headers: {
          "Location": url.pathname,
          // Cookie hält 30 Tage ("Max-Age"), Secure & HttpOnly für Sicherheit
          "Set-Cookie": `auth_token=${SITE_PASSWORD}; Path=/; Max-Age=34473600; HttpOnly; SameSite=Lax`,
        },
      });
    }
  }

  // 3. Wenn nicht eingeloggt: Zeige ein minimales Login-Formular an
  // (Anstatt das echte index.html auszuliefern)
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login - 9IF Matchmaker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #121212; color: white; margin: 0; }
          form { background: #1e1e1e; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align: center; }
          input { padding: 10px; margin: 10px 0; border: 1px solid #333; background: #2a2a2a; color: white; border-radius: 4px; width: 80%; }
          button { padding: 10px 20px; background: #007bff; border: none; color: white; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <form method="POST">
          <h2>Matchmaker</h2>
          <p>Bitte gib das Passwort ein:</p>
          <input type="password" name="password" autofocus>
          <br>
          <button type="submit">Einloggen</button>
        </form>
      </body>
    </html>
    `,
    { headers: { "Content-Type": "text/html" } }
  );
};
