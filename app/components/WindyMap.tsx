"use client";

const LAT = 59.92;
const LON = 30.10;

export default function WindyMap() {
  const src = `https://embed.windy.com/embed2.html?lat=${LAT}&lon=${LON}&detailLat=${LAT}&detailLon=${LON}&width=650&height=450&zoom=11&level=surface&overlay=wind&product=ecmwf&menu=&message=false&marker=true&calendar=now&pressure=false&type=map&location=coordinates&detail=true&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="mapShell">
      <iframe
        className="windyFrame"
        title="Карта ветра Windy"
        src={src}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
