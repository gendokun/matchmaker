// functions/_middleware.ts

export const onRequest: PagesFunction<{ SITE_PASSWORD?: string }> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("Cookie") || "";
  const SITE_PASSWORD = env.SITE_PASSWORD;

  // Wenn kein Passwort gesetzt ist, Schutz überspringen
  if (!SITE_PASSWORD) {
    return next();
  }

  // PWA-Manifest und Icons für Browser-Erkennung immer freigeben
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.png" ||
    url.pathname === "/sw.js"
  ) {
    return next();
  }

  // 1. Check, ob der Auth-Cookie bereits existiert und korrekt ist
  if (cookieHeader.includes(`auth_token=${SITE_PASSWORD}`)) {
    return next(); // Passwort korrekt, weiter zur Seite
  }

  // 2. Wenn das Passwort per POST gesendet wurde (Login-Versuch)
  if (request.method === "POST" && request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const enteredPassword = formData.get("password");

    if (enteredPassword === SITE_PASSWORD) {
      // Passwort korrekt! Cookie setzen und Seite neu laden
      return new Response(null, {
        status: 302,
        headers: {
          "Location": url.pathname,
          // Cookie hält 365 Tage, Secure & HttpOnly für Sicherheit
          "Set-Cookie": `auth_token=${SITE_PASSWORD}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`,
        },
      });
    }
  }

  // 3. Wenn nicht eingeloggt: Stilvolles Login-Formular im 9IF-Design
  return new Response(
    `<!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Login – 9InchPairs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Barlow', -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #23272c;
            color: #f2efea;
            margin: 0;
            padding: 16px;
          }
          .login-card {
            background: #2e3339;
            border: 1px solid #404751;
            padding: 32px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            text-align: center;
            width: 100%;
            max-width: 380px;
          }
          .login-logo {
            height: 48px;
            margin-bottom: 12px;
          }
          h1 {
            font-family: 'Oswald', sans-serif;
            font-size: 1.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0 0 6px 0;
            color: #f2efea;
          }
          p {
            color: rgba(242, 239, 234, 0.7);
            font-size: 0.95rem;
            margin: 0 0 20px 0;
          }
          input {
            width: 100%;
            padding: 12px 14px;
            margin-bottom: 16px;
            border: 1px solid #404751;
            background: #1e2226;
            color: #f2efea;
            border-radius: 6px;
            font-size: 1rem;
            font-family: inherit;
          }
          input:focus {
            outline: none;
            border-color: #f0692e;
            box-shadow: 0 0 0 2px rgba(240, 105, 46, 0.2);
          }
          button {
            width: 100%;
            padding: 12px;
            background: #f0692e;
            border: none;
            color: #1b1e22;
            font-weight: 700;
            font-size: 1rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          button:hover {
            background: #fa8043;
          }
        </style>
      </head>
      <body>
        <div class="login-card">
          <img src="/icons/logo.png" alt="9IF Logo" class="login-logo">
          <h1>9InchPairs</h1>
          <p>Bitte Club-Passwort eingeben:</p>
          <form method="POST">
            <input type="password" name="password" placeholder="Passwort" autofocus required>
            <button type="submit">Einloggen</button>
          </form>
        </div>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
};
