import { NextResponse } from "next/server";

const LAT = 59.92;
const LON = 30.1;
const MS_TO_KT = 1.943844;

type WindyResponse = {
  ts: number[];
  units?: Record<string, string | null>;
  [key: string]: any;
};

function toKnots(value: number | null | undefined, unit?: string | null) {
  if (value == null || Number.isNaN(value)) return null;
  if (!unit) return Math.round(value);
  if (unit.includes("m*s-1")) return Math.round(value * MS_TO_KT);
  if (unit.toLowerCase().includes("kt")) return Math.round(value);
  return Math.round(value);
}

function tempToC(value: number | null | undefined, unit?: string | null) {
  if (value == null || Number.isNaN(value)) return null;
  if (unit === "K") return Math.round(value - 273.15);
  return Math.round(value);
}

function getWeatherText(precipMm: number, tempC: number | null, ptype?: number | null) {
  if (ptype === 5) return "снег";
  if (ptype === 7) return "дождь со снегом";
  if (ptype === 1 || precipMm > 0.1) return tempC != null && tempC <= 0 ? "осадки" : "дождь";
  return "без осадков";
}

function windDirectionFromUV(u: number, v: number) {
  const deg = (Math.atan2(u, v) * 180) / Math.PI + 180;
  return Math.round((deg + 360) % 360);
}

export async function GET() {
  const key = process.env.WINDY_POINT_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "Missing WINDY_POINT_API_KEY. Add it to .env.local or Vercel Environment Variables." },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.windy.com/api/point-forecast/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: LAT,
      lon: LON,
      model: "iconEu",
      parameters: ["wind", "windGust", "temp", "precip", "ptype", "lclouds", "mclouds", "hclouds"],
      levels: ["surface"],
      key
    }),
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: `Windy API error: ${response.status}` }, { status: response.status });
  }

  const data = (await response.json()) as WindyResponse;
  const units = data.units || {};
  const now = Date.now();
  const rows = (data.ts || [])
    .map((ts, i) => {
      const u = data["wind_u-surface"]?.[i] ?? 0;
      const v = data["wind_v-surface"]?.[i] ?? 0;
      const speedMs = Math.sqrt(u * u + v * v);
      const windKnots = toKnots(speedMs, units["wind_u-surface"] || "m*s-1") ?? 0;
      const gustKnots = toKnots(data["gust-surface"]?.[i], units["gust-surface"] || "m*s-1") ?? windKnots;
      const tempC = tempToC(data["temp-surface"]?.[i], units["temp-surface"]);
      const precipMm = Number((data["past3hprecip-surface"]?.[i] ?? 0).toFixed(1));
      const ptype = data["ptype-surface"]?.[i] ?? null;

      return {
        ts,
        iso: new Date(ts).toISOString(),
        windKnots,
        gustKnots,
        directionDeg: windDirectionFromUV(u, v),
        tempC,
        precipMm,
        weatherText: getWeatherText(precipMm, tempC, ptype)
      };
    })
    .filter((row) => row.ts >= now)
    .slice(0, 24);

  return NextResponse.json({
    point: {
      name: "Створные знаки Невской губы",
      lat: LAT,
      lon: LON
    },
    updatedAt: new Date().toISOString(),
    current: rows[0] || null,
    forecast: rows
  });
}
