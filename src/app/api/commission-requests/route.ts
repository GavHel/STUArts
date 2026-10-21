import "server-only";

import { createClient } from "@supabase/supabase-js";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_DIMENSION = 200;

const mediumPricing = {
  Painting: 250,
  Ceramics: 180,
  "Mixed media": 225,
  Printmaking: 120,
} as const;

const placements = [
  "Living space",
  "Office or studio",
  "A thoughtful gift",
  "Somewhere else",
] as const;

const scaleGuides = [
  "Small — fits on a bookshelf",
  "Medium — about the size of a carry-on",
  "Large — makes a statement on the wall",
] as const;

type Medium = keyof typeof mediumPricing;
type Placement = (typeof placements)[number];
type ScaleGuide = (typeof scaleGuides)[number];

type CommissionSubmission = {
  medium: Medium;
  placement: Placement;
  brief: string | null;
  width: number | null;
  height: number | null;
  units: "inches" | "centimeters";
  scale: ScaleGuide | null;
  inspiration: string | null;
  delivery: string | null;
  name: string;
  email: string;
};

class RequestValidationError extends Error {}
class RequestTooLargeError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${name} must be text.`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new RequestValidationError(`${name} is too long.`);
  }
  return result;
}

function readOptionalDimension(value: unknown, name: string): number | null {
  if (value === null || value === "") return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > MAX_DIMENSION
  ) {
    throw new RequestValidationError(
      `${name} must be a number between 1 and ${MAX_DIMENSION}.`,
    );
  }
  return value;
}

function readOptionalDate(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RequestValidationError("Delivery date must be a valid date.");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value ||
    value < new Date().toISOString().slice(0, 10)
  ) {
    throw new RequestValidationError("Delivery date must be today or later.");
  }
  return value;
}

function validateSubmission(value: unknown): CommissionSubmission {
  if (!isRecord(value)) {
    throw new RequestValidationError("The request body must be a JSON object.");
  }

  const mediumValue = value.medium;
  if (
    typeof mediumValue !== "string" ||
    !Object.hasOwn(mediumPricing, mediumValue)
  ) {
    throw new RequestValidationError("Choose a valid artwork medium.");
  }

  const placementValue = value.placement;
  if (
    typeof placementValue !== "string" ||
    !placements.includes(placementValue as Placement)
  ) {
    throw new RequestValidationError("Choose a valid artwork placement.");
  }

  const unitsValue = value.units;
  if (unitsValue !== "inches" && unitsValue !== "centimeters") {
    throw new RequestValidationError("Choose inches or centimeters.");
  }

  const scaleValue = value.scale;
  if (
    scaleValue !== null &&
    scaleValue !== "" &&
    (typeof scaleValue !== "string" ||
      !scaleGuides.includes(scaleValue as ScaleGuide))
  ) {
    throw new RequestValidationError("Choose a valid size guide.");
  }

  const width = readOptionalDimension(value.width, "Width");
  const height = readOptionalDimension(value.height, "Height");
  const scale = typeof scaleValue === "string" && scaleValue ? scaleValue as ScaleGuide : null;
  const dimensionsProvided = width !== null && height !== null;
  if ((width === null) !== (height === null)) {
    throw new RequestValidationError("Provide both width and height.");
  }
  if (!dimensionsProvided && !scale) {
    throw new RequestValidationError("Provide dimensions or choose a size guide.");
  }

  const brief = readText(value.brief ?? "", "Project idea", 2000);
  const name = readText(value.name, "Name", 120);
  const email = readText(value.email, "Email", 320);
  if (!name) throw new RequestValidationError("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError("Enter a valid email address.");
  }

  const inspirationInput = readText(value.inspiration ?? "", "Inspiration link", 2048);
  let inspiration: string | null = null;
  if (inspirationInput) {
    let parsed: URL;
    try {
      parsed = new URL(inspirationInput);
    } catch {
      throw new RequestValidationError("Enter a valid inspiration link.");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new RequestValidationError("Inspiration links must use HTTP or HTTPS.");
    }
    inspiration = parsed.toString();
  }

  return {
    medium: mediumValue as Medium,
    placement: placementValue as Placement,
    brief: brief || null,
    width,
    height,
    units: unitsValue,
    scale,
    inspiration,
    delivery: readOptionalDate(value.delivery),
    name,
    email,
  };
}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new RequestValidationError("A JSON request body is required.");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new RequestValidationError("Request body must contain valid JSON.");
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json(
      { error: "Send the request as application/json." },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Request body is too large." }, { status: 413 });
  }

  let submission: CommissionSubmission;
  try {
    submission = validateSubmission(await readJsonBody(request));
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return Response.json({ error: "Request body is too large." }, { status: 413 });
    }
    if (error instanceof RequestValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Unable to read commission request body.", error);
    return Response.json(
      { error: "We could not read your request. Please try again." },
      { status: 400 },
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Commission requests require a Supabase project URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    return Response.json(
      { error: "Request submissions are not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const area =
    submission.width !== null && submission.height !== null
      ? submission.width *
        submission.height *
        (submission.units === "centimeters" ? 0.155 : 1)
      : submission.scale?.startsWith("Small")
        ? 120
        : submission.scale?.startsWith("Large")
          ? 650
          : 300;
  const basePrice = mediumPricing[submission.medium];
  const materials = Math.round(basePrice + area * 0.55);
  const artistFee = Math.round(basePrice * 0.75);
  const studioTime = area > 500 ? "5—7 weeks" : area < 180 ? "2—3 weeks" : "3—4 weeks";

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.from("commission_requests").insert({
      artist_slug: "maya-linnea-chen",
      medium: submission.medium,
      placement: submission.placement,
      project_brief: submission.brief,
      width: submission.width,
      height: submission.height,
      units: submission.units,
      scale_guide: submission.scale,
      inspiration_url: submission.inspiration,
      requested_delivery_date: submission.delivery,
      requester_name: submission.name,
      requester_email: submission.email,
      estimated_materials_cad: materials,
      estimated_artist_fee_cad: artistFee,
      estimated_total_cad: materials + artistFee,
      estimated_studio_time: studioTime,
    });

    if (error) {
      console.error("Supabase rejected commission request insert.", error);
      return Response.json(
        { error: "We could not save your request. Please try again later." },
        { status: 500 },
      );
    }

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Commission request persistence failed.", error);
    return Response.json(
      { error: "We could not save your request. Please try again later." },
      { status: 500 },
    );
  }
}
