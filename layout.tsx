import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Пиздячит ли ветер в Финском заливе?",
  description: "Прогноз ветра, порывов, погоды и осадков по створным знакам Невской губы."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
