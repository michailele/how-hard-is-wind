"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    windyInit?: (options: any, callback: (api: any) => void) => void;
    L?: any;
  }
}

const LAT = 59.92;
const LON = 30.1;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function WindyMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("Загрузка карты Windy...");

  useEffect(() => {
    let mounted = true;
    const key = process.env.NEXT_PUBLIC_WINDY_MAP_API_KEY;

    async function init() {
      if (!key) {
        setStatus("Добавь NEXT_PUBLIC_WINDY_MAP_API_KEY, чтобы включить живую карту Windy.");
        return;
      }

      try {
        await loadScript("https://unpkg.com/leaflet@1.4.0/dist/leaflet.js");
        await loadScript("https://api.windy.com/assets/map-forecast/libBoot.js");

        if (!mounted || !window.windyInit) return;

        window.windyInit(
          {
            key,
            lat: LAT,
            lon: LON,
            zoom: 11,
            overlay: "wind",
            product: "ecmwf",
            level: "surface"
          },
          (windyAPI: any) => {
            const { map, store, picker } = windyAPI;
            store.set("metric_wind", "kt");
            store.set("overlay", "wind");
            picker.open({ lat: LAT, lon: LON });

            if (window.L) {
              window.L.marker([LAT, LON]).addTo(map).bindPopup("Створные знаки Невской губы").openPopup();
            }

            setStatus("");
          }
        );
      } catch {
        setStatus("Не удалось загрузить карту Windy. Проверь ключ и доступность API.");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mapShell">
      <div id="windy" ref={mapRef} />
      {status ? <div className="mapStatus">{status}</div> : null}
    </div>
  );
}
