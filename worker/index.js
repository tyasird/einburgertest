function json(body, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getOrigin(request) {
  return request.headers.get("Origin") || "*";
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const origin = getOrigin(request);

    if (request.method === "OPTIONS") {
      return json({ ok: true }, 200, origin);
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    const url = new URL(request.url);
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    if (normalizedPath !== "/auth/register" && normalizedPath !== "/auth/login") {
      return json({ ok: false, error: "Not found" }, 404, origin);
    }

    const payload = await readJson(request);
    const username = typeof payload?.username === "string" ? payload.username.trim() : "";
    const password = typeof payload?.password === "string" ? payload.password : "";
    const bundesland = typeof payload?.bundesland === "string" ? payload.bundesland.trim() : "";

    if (!username || !password) {
      return json({ ok: false, error: "Username and password are required." }, 400, origin);
    }

    if (password.length < 6) {
      return json({ ok: false, error: "Password must be at least 6 characters." }, 400, origin);
    }

    const key = `user:${username.toLowerCase()}`;
    const existingRaw = await env.AUTH_USERS.get(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : null;

    if (normalizedPath === "/auth/register") {
      if (existing) {
        return json({ ok: false, error: "This username is already registered." }, 409, origin);
      }

      const salt = createSalt();
      const passwordHash = await sha256Hex(`${salt}:${password}`);
      await env.AUTH_USERS.put(
        key,
        JSON.stringify({
          username,
          bundesland,
          salt,
          passwordHash,
          createdAt: Date.now(),
        })
      );

      return json(
        {
          ok: true,
          user: { username, bundesland, isGuest: false },
        },
        200,
        origin
      );
    }

    if (!existing) {
      return json({ ok: false, error: "User not found. Please register first." }, 404, origin);
    }

    const incomingHash = await sha256Hex(`${existing.salt}:${password}`);
    if (incomingHash !== existing.passwordHash) {
      return json({ ok: false, error: "Wrong password." }, 401, origin);
    }

    return json(
      {
        ok: true,
        user: {
          username: existing.username,
          bundesland: existing.bundesland || "",
          isGuest: false,
        },
      },
      200,
      origin
    );
  },
};
