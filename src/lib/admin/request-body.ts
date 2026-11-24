export async function readJsonObject(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return {
      ok: false as const,
      response: Response.json({ error: "Send the request as application/json." }, { status: 415 }),
    };
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return {
      ok: false as const,
      response: Response.json({ error: "Request body must contain valid JSON." }, { status: 400 }),
    };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      ok: false as const,
      response: Response.json({ error: "Request body must be a JSON object." }, { status: 400 }),
    };
  }
  return { ok: true as const, value: value as Record<string, unknown> };
}

export function readText(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  required = false,
) {
  const value = body[key];
  if (typeof value !== "string") {
    return { ok: false as const, error: `${key} must be text.` };
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength || (required && !trimmed)) {
    return {
      ok: false as const,
      error: required && !trimmed ? `${key} is required.` : `${key} is too long.`,
    };
  }
  return { ok: true as const, value: trimmed };
}

export function readOptionalUrl(body: Record<string, unknown>, key: string) {
  const result = readText(body, key, 2048);
  if (!result.ok || !result.value) {
    return result.ok ? { ok: true as const, value: null } : result;
  }
  try {
    const url = new URL(result.value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported protocol");
    }
    return { ok: true as const, value: url.toString() };
  } catch {
    return { ok: false as const, error: `${key} must be a complete HTTP or HTTPS URL.` };
  }
}

export function readOptionalInteger(
  body: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
) {
  const value = body[key];
  if (value === null || value === "") return { ok: true as const, value: null };
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    return {
      ok: false as const,
      error: `${key} must be a whole number between ${minimum} and ${maximum}.`,
    };
  }
  return { ok: true as const, value: number };
}

export function readBoolean(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "boolean") {
    return { ok: false as const, error: `${key} must be true or false.` };
  }
  return { ok: true as const, value };
}
