import WindyMap from "./components/WindyMap";

const windLevels = [
  { min: 0, max: 4, level: 0, colorName: "белый / серый", label: "не пиздячит", className: "calm" },
  { min: 5, max: 9, level: 1, colorName: "голубо-синий", label: "умеренно пиздячит", className: "moderate" },
  { min: 10, max: 16, level: 2, colorName: "зелёный", label: "нормально пиздячит", className: "normal" },
  { min: 17, max: 21, level: 3, colorName: "жёлтый", label: "уверенно пиздячит", className: "confident" },
  { min: 22, max: 30, level: 4, colorName: "оранжевый", label: "сильно пиздячит", className: "strong" },
  { min: 31, max: 999, level: 5, colorName: "розовый", label: "пиздячит как не в себя", className: "insane" }
];

const resultThresholds = [
  { max: 0.74, label: "не пиздячит" },
  { max: 1.49, label: "умеренно пиздячит" },
  { max: 2.74, label: "нормально пиздячит" },
  { max: 3.49, label: "уверенно пиздячит" },
  { max: 4.49, label: "сильно пиздячит" },
  { max: 999, label: "пиздячит как не в себя" }
];

type ForecastRow = {
  ts: number;
  iso: string;
  windKnots: number;
  gustKnots: number;
  directionDeg: number;
  tempC: number | null;
  precipMm: number;
  weatherText: string;
};

type ForecastPayload = {
  point: { name: string; lat: number; lon: number };
  updatedAt: string;
  current: ForecastRow | null;
  forecast: ForecastRow[];
};

function getWindLevel(speedKnots: number) {
  return windLevels.find((item) => speedKnots >= item.min && speedKnots <= item.max) || windLevels[windLevels.length - 1];
}

function getCombinedCategory(windKnots: number, gustKnots: number) {
  const wind = getWindLevel(windKnots);
  const gust = getWindLevel(gustKnots);
  const score = wind.level * 0.6 + gust.level * 0.4;
  const result = resultThresholds.find((item) => score <= item.max) || resultThresholds[resultThresholds.length - 1];
  const details = windLevels.find((item) => item.label === result.label) || wind;
  return { ...details, score: Number(score.toFixed(1)), wind, gust };
}

function compass(deg: number) {
  const dirs = ["северный", "северо-восточный", "восточный", "юго-восточный", "южный", "юго-западный", "западный", "северо-западный"];
  return dirs[Math.round(deg / 45) % 8];
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(new Date(iso));
}

async function getForecast(): Promise<ForecastPayload | null> {
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/forecast`, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const fallback: ForecastPayload = {
  point: { name: "Створные знаки Невской губы", lat: 59.92, lon: 30.1 },
  updatedAt: new Date().toISOString(),
  current: { ts: Date.now(), iso: new Date().toISOString(), windKnots: 7, gustKnots: 23, directionDeg: 270, tempC: 10, precipMm: 0.2, weatherText: "облачно" },
  forecast: [
    { ts: Date.now(), iso: new Date().toISOString(), windKnots: 7, gustKnots: 23, directionDeg: 270, tempC: 10, precipMm: 0.2, weatherText: "облачно" },
    { ts: Date.now() + 10800000, iso: new Date(Date.now() + 10800000).toISOString(), windKnots: 11, gustKnots: 28, directionDeg: 260, tempC: 11, precipMm: 0, weatherText: "переменная облачность" },
    { ts: Date.now() + 21600000, iso: new Date(Date.now() + 21600000).toISOString(), windKnots: 16, gustKnots: 32, directionDeg: 250, tempC: 10, precipMm: 0.2, weatherText: "дождь" }
  ]
};

export default async function Home() {
  const data = (await getForecast()) || fallback;
  const current = data.current || fallback.current!;
  const category = getCombinedCategory(current.windKnots, current.gustKnots);
  const forecast = data.forecast.length ? data.forecast.slice(0, 24) : fallback.forecast;

  return (
    <main>
      <section className="hero">
        <header className="topbar">
          <div>
            <p className="eyebrow">Невская губа</p>
            <h1>Пиздячит ли ветер?</h1>
          </div>
          <a className="refresh" href="/">Обновить прогноз</a>
        </header>

        <div className="grid">
          <section className={`verdict ${category.className}`}>
            <div className="chips">
              <span>{data.point.name}</span>
              <span>{data.point.lat.toFixed(2)}°N, {data.point.lon.toFixed(2)}°E</span>
              <span>обновлено {new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(new Date(data.updatedAt))}</span>
            </div>
            <p className="sub">Сейчас ветер {compass(current.directionDeg)}</p>
            <h2>{category.label}</h2>
            <p className="tone">Итог считается по формуле: 60% основная скорость ветра + 40% порывы.</p>

            <div className="metrics">
              <div><span>Ветер</span><b>{current.windKnots}</b><small>узл. · {category.wind.colorName}</small></div>
              <div><span>Порывы</span><b>{current.gustKnots}</b><small>узл. · {category.gust.colorName}</small></div>
              <div><span>Температура</span><b>{current.tempC ?? "—"}°</b><small>{current.weatherText}</small></div>
              <div><span>Осадки</span><b>{current.precipMm}</b><small>мм за период</small></div>
            </div>
          </section>

          <section className="mapCard">
            <WindyMap />
          </section>
        </div>

        <section className="forecast">
          <div className="sectionTitle">
            <h3>Прогноз на 3 дня</h3>
            <p>Каждый слот окрашен по итоговой категории.</p>
          </div>
          <div className="forecastGrid">
            {forecast.map((item) => {
              const slot = getCombinedCategory(item.windKnots, item.gustKnots);
              return (
                <article className={`slot ${slot.className}`} key={item.iso}>
                  <small>{formatTime(item.iso)}</small>
                  <strong>{slot.label}</strong>
                  <p>ветер {item.windKnots} узл.</p>
                  <p>порывы {item.gustKnots} узл.</p>
                  <em>{item.tempC ?? "—"}° · {item.precipMm} мм · {item.weatherText}</em>
                </article>
              );
            })}
          </div>
        </section>

        <section className="legend">
          <h3>Шкала цветов</h3>
          <div className="legendGrid">
            {windLevels.map((item) => (
              <div className={`legendItem ${item.className}`} key={item.label}>
                <b>{item.label}</b>
                <span>{item.min}–{item.max === 999 ? "∞" : item.max} узл. · {item.colorName}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
