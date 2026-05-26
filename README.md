# Пиздячит ли ветер в Финском заливе?

Готовый Next.js-сайт для прогноза ветра по створным знакам Невской губы.

## Что внутри

- Главный вердикт: насколько пиздячит.
- Формула: 60% основная скорость ветра + 40% порывы.
- Ветер и порывы в узлах.
- Цвета как в Windy: белый, синий, зелёный, жёлтый, оранжевый, розовый.
- Прогноз на 3 дня.
- Погода, температура и осадки.
- Заготовка под живую карту Windy Map Forecast.

## Запуск локально

```bash
npm install
cp .env.example .env.local
npm run dev
```

Открой http://localhost:3000

## Ключи Windy

Нужны два ключа:

```bash
WINDY_POINT_API_KEY=...
NEXT_PUBLIC_WINDY_MAP_API_KEY=...
```

Point Forecast key используется на сервере в `/app/api/forecast/route.ts`.
Map Forecast key используется на клиенте для карты Windy.

## Деплой на Vercel

1. Залей папку в GitHub.
2. Импортируй репозиторий в Vercel.
3. В Project Settings -> Environment Variables добавь:
   - WINDY_POINT_API_KEY
   - NEXT_PUBLIC_WINDY_MAP_API_KEY
4. Нажми Deploy.
