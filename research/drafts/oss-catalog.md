# Каталог Avito-проектов: первичная проверка исходников

Дата проверки: 5 ноября 2026. Проверены 12 репозиториев; каталог не исчерпывающий. Это исследование исходников, не доказательство работы на Авито. Никакой чужой код не запускался, зависимости не устанавливались, действий в аккаунте не было.

Метод: GitHub connector, metadata + commits?per_page=1 + recursive tree; README и выбранные файлы читались на зафиксированном SHA. В таблице указана дата committer последнего коммита default branch, а не pushed_at. У всех archived=false; это не оценка здоровья проекта.

| Репозиторий | Класс | Последний commit UTC | Лицензия |
|---|---|---|---|
| [AlexButiev/avito-personal-mcp](https://github.com/AlexButiev/avito-personal-mcp) | Персональный MCP | [2026-09-05 · 58c0725](https://github.com/AlexButiev/avito-personal-mcp/commit/58c072557c699370591f922d165d39b0ecf86885) | MIT, LICENSE прочитан |
| [ermizin/avito-mcp](https://github.com/ermizin/avito-mcp) | Универсальный browser MCP | [2026-10-13 · 99a37a0](https://github.com/ermizin/avito-mcp/commit/99a37a0497088d8f5ae73d19694f92568b18350f) | MIT, LICENSE прочитан |
| [Duff89/parser_avito](https://github.com/Duff89/parser_avito) | Парсер и мониторинг | [2026-09-30 · 91a5399](https://github.com/Duff89/parser_avito/commit/91a5399f79bf035d3eb919d66ada00545571c2f1) | LICENSE не найден; GitHub license=null |
| [xailiry/TechBot](https://github.com/xailiry/TechBot) | Поиск выгодной электроники | [2026-06-17 · 2c0ac2d](https://github.com/xailiry/TechBot/commit/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544) | LICENSE не найден; GitHub license=null |
| [ForseJDM/avito-gpu-helper](https://github.com/ForseJDM/avito-gpu-helper) | Расширение покупателя GPU | [2026-06-29 · 306b9a7](https://github.com/ForseJDM/avito-gpu-helper/commit/306b9a76e2153551fd7dd8d098672eee94a966f8) | MIT в LICENSE плюс trademark note; GitHub NOASSERTION |
| [nummyn0rih/avito-monitor-bot](https://github.com/nummyn0rih/avito-monitor-bot) | Минимальный мониторинг | [2026-04-28 · 236cbb7](https://github.com/nummyn0rih/avito-monitor-bot/commit/236cbb76278ed63ccfa6e64a7d7d2ba6440f37a0) | LICENSE не найден; GitHub license=null |
| [domovoyproj/avito-parser](https://github.com/domovoyproj/avito-parser) | Парсер с панелью и скорингом | [2026-10-21 · 4295c18](https://github.com/domovoyproj/avito-parser/commit/4295c18565fc961d5a7a708e702f1f52507501dc) | Root LICENSE не найден; GitHub license=null; vendor licenses не лицензируют проект |
| [Vladimir-Human/ru-marketplace-mcp](https://github.com/Vladimir-Human/ru-marketplace-mcp) | Read-only multi-marketplace MCP | [2026-11-03 · 416b065](https://github.com/Vladimir-Human/ru-marketplace-mcp/commit/416b065d03c971be86d982ccb5a6a1855069f09d) | MIT, LICENSE прочитан |
| [aurusxd/avito-ai-agent](https://github.com/aurusxd/avito-ai-agent) | AI outreach и лидогенерация | [2026-09-20 · 1155f2b](https://github.com/aurusxd/avito-ai-agent/commit/1155f2b346f3945a903e605e8a59f1206e4ebaaf) | LICENSE не найден; GitHub license=null |
| [evgenygurin/avito-mcp-plugin](https://github.com/evgenygurin/avito-mcp-plugin) | Модульный MCP-парсер | [2026-08-02 · fa1a934](https://github.com/evgenygurin/avito-mcp-plugin/commit/fa1a9345cf2be6cc3ea7983c83db8663fca14da3) | MIT, LICENSE прочитан |
| [alexeysever/avito-filter](https://github.com/alexeysever/avito-filter) | Расширение фильтрации/мониторинга | [2023-04-10 · 31bf53f](https://github.com/alexeysever/avito-filter/commit/31bf53faf4c4586b22b5dc7014dc2c82e5308afa) | ISC declared в package.json; отдельный LICENSE отсутствует, GitHub license=null |
| [zlexdev/avitoapi](https://github.com/zlexdev/avitoapi) | SDK официального Partner API | [2026-07-11 · cbbe517](https://github.com/zlexdev/avitoapi/commit/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958) | MIT, LICENSE прочитан |

## Проверенные различия

- Расширения в текущей странице: GPU Helper и avito-filter. CDP MCP — отдельный процесс, которому нужен Chrome с включённым CDP; доступ к уже открытой вкладке Codex/IAB из этого не следует.
- Поиск/мониторинг и оценка — разные функции. Предметный скоринг найден у TechBot, GPU Helper и domovoyproj; качество и калибровка оценок нами не измерялись. Цены объявлений не являются ценами завершённых сделок.
- Отправка на Авито найдена у AlexButiev, generic UI у ermizin, outreach у aurusxd и официальный Messenger у zlexdev. TG/VK notification в парсерах не означает сообщение продавцу Авито.
- MIT подтверждена текстом LICENSE у шести проектов, включая GPU Helper с GitHub NOASSERTION. У avito-filter есть ISC declaration в package.json без отдельного текста LICENSE. У остальных пяти разрешающая лицензия не найдена; изучать можно, готовность к включению кода не установлена.
- Текущие исходники важнее поисковых сниппетов и старых design docs: AlexButiev уже умеет guarded send; evgenygurin использует Supabase и pager.next; GPU Helper realtime означает кеш/внешний feed, а не автономный живой поиск Avito.

## AlexButiev/avito-personal-mcp

[Репозиторий](https://github.com/AlexButiev/avito-personal-mcp) · [HEAD 58c0725](https://github.com/AlexButiev/avito-personal-mcp/commit/58c072557c699370591f922d165d39b0ecf86885) · 2026-09-05T20:47:35Z · archived=false.

**README утверждает:** README описывает local-first персональный аккаунт, ручной вход, чтение и guarded send.

**Исходники подтверждают:** Подключается Playwright connect_over_cdp к уже запущенному пользователем отдельному Chrome; не открытая вкладка Codex/IAB автоматически.

- Чтение: Поиск, карточка, свои объявления, избранное, профили, чаты и история.
- Изменения: avito_send_message: preview, одноразовый токен, затем одна попытка отправки в существующий chat_id; не полноценное открытие нового диалога из любой карточки.
- Оценка: Оценки справедливой цены и стратегии переговоров в проверенных модулях нет.
- Зависимости: Python>=3.11; mcp[cli]>=2,<3; Playwright>=1.54,<2; Pydantic>=2.11,<3.

**Готовые части для изучения:** MCP-контракты; привязка к наблюдаемой UI-сессии; двухфазная отправка и обработка неопределённого исхода.

**Ограничения:** Experimental 0.1.0rc3; извлекатель карточки не возвращает фото; категория/география/пагинация отложены в README; чтение чата может отметить его прочитанным.

**Лицензия:** MIT, LICENSE прочитан. Для MIT при использовании сохраняются copyright/license notices; лицензия кода не даёт разрешения на доступ к Avito и использование бренда.

**Первичные файлы:** [README.md](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/README.md), [pyproject.toml](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/pyproject.toml), [LICENSE](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/LICENSE), [src/avito_personal_mcp/browser.py](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/src/avito_personal_mcp/browser.py), [src/avito_personal_mcp/listing_detail.py](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/src/avito_personal_mcp/listing_detail.py), [src/avito_personal_mcp/send_message.py](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/src/avito_personal_mcp/send_message.py), [src/avito_personal_mcp/server.py](https://github.com/AlexButiev/avito-personal-mcp/blob/58c072557c699370591f922d165d39b0ecf86885/src/avito_personal_mcp/server.py).

## ermizin/avito-mcp

[Репозиторий](https://github.com/ermizin/avito-mcp) · [HEAD 99a37a0](https://github.com/ermizin/avito-mcp/commit/99a37a0497088d8f5ae73d19694f92568b18350f) · 2026-10-13T08:23:07Z · archived=false.

**README утверждает:** README заявляет личный кабинет, Авито Pro, формы и Ozon/WB; source подтверждает универсальные UI-команды и фотогалерею.

**Исходники подтверждают:** Сам запускает отдельный Google Chrome с собственным профилем и CDP, затем подключается Playwright.

- Чтение: Поиск с городом/ценой; карточка/фотогалерея; свои объявления и статистика; профили; generic DOM snapshot.
- Изменения: Generic click/type/upload/keypress, включая отправку сообщений и формы; confirm=true для распознанных рискованных действий.
- Оценка: Готового рыночного оценщика нет; LLM-клиент выполняет рассуждения отдельно.
- Зависимости: Python>=3.12; mcp[cli]>=1.12,<2; Playwright>=1.50; uv.lock.

**Готовые части для изучения:** Компактные DOM-извлекатели, чтение полноразмерных фото, ref-based generic UI инструменты.

**Ограничения:** Защита confirm эвристическая; это не связанный с текстом одноразовый токен. OS classifiers macOS/Linux, путь Chrome по умолчанию macOS; Windows не проверен. Не доказана устойчивость к смене DOM.

**Лицензия:** MIT, LICENSE прочитан. Для MIT при использовании сохраняются copyright/license notices; лицензия кода не даёт разрешения на доступ к Avito и использование бренда.

**Первичные файлы:** [README.md](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/README.md), [pyproject.toml](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/pyproject.toml), [LICENSE](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/LICENSE), [src/avito_mcp/config.py](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/src/avito_mcp/config.py), [src/avito_mcp/browser.py](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/src/avito_mcp/browser.py), [src/avito_mcp/server.py](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/src/avito_mcp/server.py), [src/avito_mcp/extract.py](https://github.com/ermizin/avito-mcp/blob/99a37a0497088d8f5ae73d19694f92568b18350f/src/avito_mcp/extract.py).

## Duff89/parser_avito

[Репозиторий](https://github.com/Duff89/parser_avito) · [HEAD 91a5399](https://github.com/Duff89/parser_avito/commit/91a5399f79bf035d3eb919d66ada00545571c2f1) · 2026-09-30T17:34:11Z · archived=false.

**README утверждает:** README3.2.23 описывает GUI/CLI/Docker, мониторинг, Excel и TG/VK.

**Исходники подтверждают:** curl_cffi HTTP-сессия с cookies/proxy; JSON из страниц и внутренние каталожные запросы; Playwright нужен для cookie/bootstrap.

- Чтение: Каталог, фильтры, продавцы, цена, описание, просмотры; SQLite seen(id,price).
- Изменения: Локальная БД/Excel; уведомления Telegram/VK. Отправка сообщений продавцам в проверенном workflow отсутствует.
- Оценка: Мониторинг изменений и фильтрация, без проверенного AI valuation.
- Зависимости: Python 3.11+ по README; curl_cffi; BeautifulSoup 4.13.4; Playwright1.52; Flet0.24.1; Pydantic2.9.2; openpyxl3.1.5; requests/httpx.

**Готовые части для изучения:** Фильтры, экспорт, модель объявления, дедуп и фиксация смены цены — как предмет изучения.

**Ограничения:** Без разрешающей лицензии не считать готовым кодом для включения в продукт. Обходы/сервисы cookies и недокументированные endpoints требуют отдельной оценки; текущая доступность не проверялась.

**Лицензия:** LICENSE не найден; GitHub license=null. Разрешение на включение исходников в свой проект не установлено; до копирования требуется уточнить условия у правообладателя.

**Первичные файлы:** [README.md](https://github.com/Duff89/parser_avito/blob/91a5399f79bf035d3eb919d66ada00545571c2f1/README.md), [requirements.txt](https://github.com/Duff89/parser_avito/blob/91a5399f79bf035d3eb919d66ada00545571c2f1/requirements.txt), [parser/http/client.py](https://github.com/Duff89/parser_avito/blob/91a5399f79bf035d3eb919d66ada00545571c2f1/parser/http/client.py), [parser_cls.py](https://github.com/Duff89/parser_avito/blob/91a5399f79bf035d3eb919d66ada00545571c2f1/parser_cls.py), [db_service.py](https://github.com/Duff89/parser_avito/blob/91a5399f79bf035d3eb919d66ada00545571c2f1/db_service.py), [utils/build_api_params.py](https://github.com/Duff89/parser_avito/blob/91a5399f79bf035d3eb919d66ada00545571c2f1/utils/build_api_params.py).

## xailiry/TechBot

[Репозиторий](https://github.com/xailiry/TechBot) · [HEAD 2c0ac2d](https://github.com/xailiry/TechBot/commit/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544) · 2026-06-17T19:58:24Z · archived=false.

**README утверждает:** README описывает TechHunter: подписки, Discovery, обучение рынка, Telegram.

**Исходники подтверждают:** Собственный Playwright browser/context, не current-tab extension; browser/stealth слой.

- Чтение: Объявления техники; нормализация модели/характеристик, состояние, фото, дубликаты; обучаемые ценовые наблюдения.
- Изменения: SQLite и Telegram-уведомления/feedback. Авито-переговоры не найдены в проверенном buyer workflow.
- Оценка: Реальная source-логика: robust median/IQR, состояние, ремонт/резерв, resale/profit/ROI, confidence и scam heuristics; опциональный CLIP анализ фото.
- Зависимости: aiogram3.13.1; SQLAlchemy2.0.49/Alembic/aiosqlite; Playwright1.48/stealth; torch2.11/torchvision0.26/transformers5.8/Pillow/numpy.

**Готовые части для изучения:** Хороший исследовательский аналог предметной оценки, обучаемого baseline и раздельной уверенности/риска.

**Ограничения:** Специализация телефоны/электроника; правила нельзя переносить на велосипеды. Корректность цен, калибровки и фотооценки не измерялась. Разрешающая лицензия не обнаружена.

**Лицензия:** LICENSE не найден; GitHub license=null. Разрешение на включение исходников в свой проект не установлено; до копирования требуется уточнить условия у правообладателя.

**Первичные файлы:** [README.md](https://github.com/xailiry/TechBot/blob/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544/README.md), [requirements.txt](https://github.com/xailiry/TechBot/blob/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544/requirements.txt), [techhunter/valuation/engine.py](https://github.com/xailiry/TechBot/blob/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544/techhunter/valuation/engine.py), [techhunter/valuation/clustering.py](https://github.com/xailiry/TechBot/blob/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544/techhunter/valuation/clustering.py), [techhunter/ai/evaluate.py](https://github.com/xailiry/TechBot/blob/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544/techhunter/ai/evaluate.py), [techhunter/scraper/browser.py](https://github.com/xailiry/TechBot/blob/2c0ac2d7af20b3ff1fd3f42a8d4a17e3382d8544/techhunter/scraper/browser.py).

## ForseJDM/avito-gpu-helper

[Репозиторий](https://github.com/ForseJDM/avito-gpu-helper) · [HEAD 306b9a7](https://github.com/ForseJDM/avito-gpu-helper/commit/306b9a76e2153551fd7dd8d098672eee94a966f8) · 2026-06-29T23:33:30Z · archived=false.

**README утверждает:** README обещает realtime цены, состояние и антискам; source уточняет фактический кеш/feed и rules.

**Исходники подтверждают:** Chrome ManifestV3 content scripts в текущих Avito-страницах; local storage; service worker получает публичный JSON цен с GitHub.

- Чтение: DOM цены/модели/состояния/продавца; аналогичные предложения из локального search cache.
- Изменения: Бейджи/виджет/панель сравнения; локальные кеши/история, notifications. Avito chat send отсутствует в проверенных компонентах.
- Оценка: Детерминированные пороги fair-price относительно встроенной/обновляемой GPU-базы; condition multipliers, антискам признаки. Это не LLM и не доказанная рыночная модель.
- Зависимости: Нативный JS без найденного npm runtime manifest; MV3 storage/alarms/notifications и host Avito/raw.githubusercontent.com.

**Готовые части для изучения:** Наиболее близкая готовая MV3 оболочка, визуальные бейджи, раздельные детекторы и механизм аналогов.

**Ограничения:** Только видеокарты. realtime-prices.js не делает live Avito fetch; читает chrome.storage. Внешний prices.json, метод сбора и свежесть требуют независимой проверки.

**Лицензия:** MIT в LICENSE плюс trademark note; GitHub NOASSERTION. Для MIT при использовании сохраняются copyright/license notices; лицензия кода не даёт разрешения на доступ к Avito и использование бренда.

**Первичные файлы:** [README.md](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/README.md), [LICENSE](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/LICENSE), [extension/manifest.json](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/manifest.json), [extension/src/core/fair-price-engine.js](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/src/core/fair-price-engine.js), [extension/src/db/gpu-market-db.js](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/src/db/gpu-market-db.js), [extension/src/core/realtime-prices.js](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/src/core/realtime-prices.js), [extension/src/core/price-updater.js](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/src/core/price-updater.js), [extension/src/service-worker.js](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/src/service-worker.js), [extension/src/content.js](https://github.com/ForseJDM/avito-gpu-helper/blob/306b9a76e2153551fd7dd8d098672eee94a966f8/extension/src/content.js).

## nummyn0rih/avito-monitor-bot

[Репозиторий](https://github.com/nummyn0rih/avito-monitor-bot) · [HEAD 236cbb7](https://github.com/nummyn0rih/avito-monitor-bot/commit/236cbb76278ed63ccfa6e64a7d7d2ba6440f37a0) · 2026-04-28T07:01:35Z · archived=false.

**README утверждает:** README: периодически читает выбранные поиски, шлёт новые объявления в Telegram.

**Исходники подтверждают:** Собственный headless Chromium/Playwright; умеет ручной login и сохранение storage_state.

- Чтение: Готовый URL поиска с фильтрами; DOM id,title,price,url,image,location.
- Изменения: SQLite seen и отправка Telegram alerts; команды status/last/log. Сообщения продавцам отсутствуют.
- Оценка: Нет оценки выгодности: URL-фильтры + новые ID.
- Зависимости: Playwright>=1.47; httpx>=0.27; python-dotenv>=1.0; PyYAML>=6.

**Готовые части для изучения:** Небольшой понятный сборщик/дедуп/уведомитель; полезен как простой baseline.

**Ограничения:** README содержит пример велосипеда29, но не проверяет раму/обвес/износ. Это отдельный браузер, не чтение уже открытой вкладки. Лицензия не найдена.

**Лицензия:** LICENSE не найден; GitHub license=null. Разрешение на включение исходников в свой проект не установлено; до копирования требуется уточнить условия у правообладателя.

**Первичные файлы:** [README.md](https://github.com/nummyn0rih/avito-monitor-bot/blob/236cbb76278ed63ccfa6e64a7d7d2ba6440f37a0/README.md), [requirements.txt](https://github.com/nummyn0rih/avito-monitor-bot/blob/236cbb76278ed63ccfa6e64a7d7d2ba6440f37a0/requirements.txt), [avito_monitor/fetcher.py](https://github.com/nummyn0rih/avito-monitor-bot/blob/236cbb76278ed63ccfa6e64a7d7d2ba6440f37a0/avito_monitor/fetcher.py), [avito_monitor/loop.py](https://github.com/nummyn0rih/avito-monitor-bot/blob/236cbb76278ed63ccfa6e64a7d7d2ba6440f37a0/avito_monitor/loop.py).

## domovoyproj/avito-parser

[Репозиторий](https://github.com/domovoyproj/avito-parser) · [HEAD 4295c18](https://github.com/domovoyproj/avito-parser/commit/4295c18565fc961d5a7a708e702f1f52507501dc) · 2026-10-21T17:01:24Z · archived=false.

**README утверждает:** README2.6 описывает сбор, мониторинг, scores и optional LLM; прямо отделяет UI demo от сетевого сбора.

**Исходники подтверждают:** Собственный Playwright Chromium или curl_cffi HTTP с cookies/proxy; локальная web-панель.

- Чтение: Поиск/карточки, история изменений цены, сведения продавца и состояния.
- Изменения: Локальные SQLite/списки/настройки, экспорт, TG. Авито-переговоры не установлены.
- Оценка: ai_scoring.py: deterministic-2 score/grade/reasons/confidence, сравнение с переданным median/average, anomaly/flaw heuristics, custom rules; optional LLM API.
- Зависимости: Playwright>=1.40; curl_cffi>=0.7; FastAPI/uvicorn/Jinja2; aiogram; aiosqlite; Pydantic; Tailwind3.4.17; Chart.js4.5.1/Lucide1.50.

**Готовые части для изучения:** Референс объяснимых причин, отдельного статуса парсинга, истории цен, панели исследования.

**Ограничения:** Медиана сама по себе не доказывает сравнимость товаров. README-панель на пустой тестовой БД — не live Avito proof. Копирование исходников требует решения лицензии.

**Лицензия:** Root LICENSE не найден; GitHub license=null; vendor licenses не лицензируют проект. Разрешение на включение кода самого проекта не установлено; до копирования требуется уточнить условия у правообладателя.

**Первичные файлы:** [README.md](https://github.com/domovoyproj/avito-parser/blob/4295c18565fc961d5a7a708e702f1f52507501dc/README.md), [requirements.txt](https://github.com/domovoyproj/avito-parser/blob/4295c18565fc961d5a7a708e702f1f52507501dc/requirements.txt), [package.json](https://github.com/domovoyproj/avito-parser/blob/4295c18565fc961d5a7a708e702f1f52507501dc/package.json), [ai_scoring.py](https://github.com/domovoyproj/avito-parser/blob/4295c18565fc961d5a7a708e702f1f52507501dc/ai_scoring.py), [browser_engine.py](https://github.com/domovoyproj/avito-parser/blob/4295c18565fc961d5a7a708e702f1f52507501dc/browser_engine.py), [http_engine.py](https://github.com/domovoyproj/avito-parser/blob/4295c18565fc961d5a7a708e702f1f52507501dc/http_engine.py).

## Vladimir-Human/ru-marketplace-mcp

[Репозиторий](https://github.com/Vladimir-Human/ru-marketplace-mcp) · [HEAD 416b065](https://github.com/Vladimir-Human/ru-marketplace-mcp/commit/416b065d03c971be86d982ccb5a6a1855069f09d) · 2026-11-03T17:58:21Z · archived=false.

**README утверждает:** README заявляет 13+ площадок и read-only сравнение; Avito source содержит три основных read tool и selfcheck.

**Исходники подтверждают:** Avito поиск: internal /web/1/js/items через curl_cffi с CDP fallback; карточки/продавцы через Chrome CDP. Shared transport присоединяется к работающему Chrome.

- Чтение: avito_search, avito_card, avito_seller, chained selfcheck; JSON-LD Product и DOM fallback с проверкой идентичности объявления.
- Изменения: Avito write-tools в проверенном connector нет.
- Оценка: Данные и multi-source price comparison в общем репозитории; полноценной предметной оценки велосипеда/торга в проверенном Avito connector нет.
- Зависимости: Python>=3.12; workspace mcp-core==2.8.2; FastMCP>=4.1.4,<5; curl_cffi>=0.8; Playwright>=1.47; Pydantic>=2.12/httpx.

**Готовые части для изучения:** Структурированные nullable модели, parser_drift/not_found/challenge разделение; seller/card parsing; CDP pacing и canary проверки.

**Ограничения:** Сильная зависимость от внутреннего API/DOM. Исходники фиксируют, что API игнорирует itemId/userId: без проверки ложные карточки/число объявлений. Авторские live отчёты не повторялись нами.

**Лицензия:** MIT, LICENSE прочитан. Для MIT при использовании сохраняются copyright/license notices; лицензия кода не даёт разрешения на доступ к Avito и использование бренда.

**Первичные файлы:** [README.md](https://github.com/Vladimir-Human/ru-marketplace-mcp/blob/416b065d03c971be86d982ccb5a6a1855069f09d/README.md), [LICENSE](https://github.com/Vladimir-Human/ru-marketplace-mcp/blob/416b065d03c971be86d982ccb5a6a1855069f09d/LICENSE), [packages/avito-connector/pyproject.toml](https://github.com/Vladimir-Human/ru-marketplace-mcp/blob/416b065d03c971be86d982ccb5a6a1855069f09d/packages/avito-connector/pyproject.toml), [packages/avito-connector/src/avito_connector/server.py](https://github.com/Vladimir-Human/ru-marketplace-mcp/blob/416b065d03c971be86d982ccb5a6a1855069f09d/packages/avito-connector/src/avito_connector/server.py), [packages/mcp-core/src/mcp_core/transport/chrome_cdp.py](https://github.com/Vladimir-Human/ru-marketplace-mcp/blob/416b065d03c971be86d982ccb5a6a1855069f09d/packages/mcp-core/src/mcp_core/transport/chrome_cdp.py).

## aurusxd/avito-ai-agent

[Репозиторий](https://github.com/aurusxd/avito-ai-agent) · [HEAD 1155f2b](https://github.com/aurusxd/avito-ai-agent/commit/1155f2b346f3945a903e605e8a59f1206e4ebaaf) · 2026-09-20T16:49:51Z · archived=false.

**README утверждает:** README описывает автоматическую 3-stage переписку, AI interested/neutral/negative, Telegram оператору и fake mode.

**Исходники подтверждают:** Собственный Playwright Chromium; ручной вход в отдельном браузере/noVNC, storage_state на аккаунт; есть HTTP/cookie вспомогательные клиенты.

- Чтение: Каталог, группировка продавцов, входящие сообщения; AI классификация ответов.
- Изменения: Трёхэтапная рассылка через UI, rotation/schedule/daily limits; журнал идемпотентности seller+stage; TG lead handoff.
- Оценка: Определение интереса продавца/лида, не доказанная оценка справедливой цены товара.
- Зависимости: Python>=3.13; FastAPI/Pydantic; SQLAlchemy/SQLite/Alembic; APScheduler; Playwright>=1.62/curl-cffi>=0.16; Svelte5/SvelteKit/Tailwind4.

**Готовые части для изучения:** Исследовать orchestration/fake clients, журналы этапов, ограничения расписания и обработку replies.

**Ограничения:** Продукт для outreach к продавцам с несколькими объявлениями, расходится с частным buyer search. Нет подтверждённой лицензии, runtime не проводился; рассылку не запускаем.

**Лицензия:** LICENSE не найден; GitHub license=null. Разрешение на включение исходников в свой проект не установлено; до копирования требуется уточнить условия у правообладателя.

**Первичные файлы:** [README.md](https://github.com/aurusxd/avito-ai-agent/blob/1155f2b346f3945a903e605e8a59f1206e4ebaaf/README.md), [backend/pyproject.toml](https://github.com/aurusxd/avito-ai-agent/blob/1155f2b346f3945a903e605e8a59f1206e4ebaaf/backend/pyproject.toml), [frontend/package.json](https://github.com/aurusxd/avito-ai-agent/blob/1155f2b346f3945a903e605e8a59f1206e4ebaaf/frontend/package.json), [backend/app/clients/avito/playwright_client.py](https://github.com/aurusxd/avito-ai-agent/blob/1155f2b346f3945a903e605e8a59f1206e4ebaaf/backend/app/clients/avito/playwright_client.py), [backend/app/outreach/service.py](https://github.com/aurusxd/avito-ai-agent/blob/1155f2b346f3945a903e605e8a59f1206e4ebaaf/backend/app/outreach/service.py).

## evgenygurin/avito-mcp-plugin

[Репозиторий](https://github.com/evgenygurin/avito-mcp-plugin) · [HEAD fa1a934](https://github.com/evgenygurin/avito-mcp-plugin/commit/fa1a9345cf2be6cc3ea7983c83db8663fca14da3) · 2026-08-02T08:11:10Z · archived=false.

**README утверждает:** README0.5.0 заявляет scraper/db/notify/shared+gateway и7tools; не опубликован в marketplace.

**Исходники подтверждают:** curl_cffi HTTP parser с cookie/proxy provider; optional Playwright для получения cookies; не current-tab extension.

- Чтение: Поиск, карточка, мониторинг новых/смены цены; пагинация текущего кода следует pager.next.
- Изменения: Supabase/Postgres история/дедуп; экспорт; TG/VK notification. send_notification не отправляет сообщения продавцам Avito.
- Оценка: Сбор/история/фильтры; отдельного оценщика выгодности не найдено в проверенном scraper.
- Зависимости: Python>=3.12; FastMCP>=3,<4; curl_cffi>=0.7; httpx; BeautifulSoup; shared workspace; optional Playwright; DB Supabase.

**Готовые части для изучения:** 7 MCP tools, gateway/roles, модели и monitoring/export контракты под разрешающей лицензией.

**Ограничения:** README честно отмечает сетевую часть непроверенной без чистого RU proxy. Старый design doc описывал SQLite/internal API, HEAD уже Supabase и pager.next; ориентироваться на код.

**Лицензия:** MIT, LICENSE прочитан. Для MIT при использовании сохраняются copyright/license notices; лицензия кода не даёт разрешения на доступ к Avito и использование бренда.

**Первичные файлы:** [README.md](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/README.md), [LICENSE](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/LICENSE), [servers/scraper/pyproject.toml](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/servers/scraper/pyproject.toml), [servers/scraper/src/avito_mcp_scraper/tools/listings.py](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/servers/scraper/src/avito_mcp_scraper/tools/listings.py), [servers/scraper/src/avito_mcp_scraper/http/client.py](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/servers/scraper/src/avito_mcp_scraper/http/client.py), [servers/scraper/src/avito_mcp_scraper/parser/pagination.py](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/servers/scraper/src/avito_mcp_scraper/parser/pagination.py), [servers/db/src/avito_mcp_db/storage/supabase.py](https://github.com/evgenygurin/avito-mcp-plugin/blob/fa1a9345cf2be6cc3ea7983c83db8663fca14da3/servers/db/src/avito_mcp_db/storage/supabase.py).

## alexeysever/avito-filter

[Репозиторий](https://github.com/alexeysever/avito-filter) · [HEAD 31bf53f](https://github.com/alexeysever/avito-filter/commit/31bf53faf4c4586b22b5dc7014dc2c82e5308afa) · 2023-04-10T13:56:22Z · archived=false.

**README утверждает:** README описывает фильтр ненужных/просмотренных и уведомления о новых Avito+OLX.

**Исходники подтверждают:** ManifestV3 content script в текущей Avito/OLX странице, chrome.storage.

- Чтение: DOM карточки и ID объявлений, локальный список просмотренных/скрытых.
- Изменения: Скрытие/окраска карточек, локальные списки, периодический reload и звуковой сигнал.
- Оценка: Без AI и оценки рыночной цены.
- Зависимости: jQuery^3.6.4; Lodash^4.17.21; Webpack5.76/TypeScript4.9.5 для сборки.

**Готовые части для изучения:** Механика seen/hidden/new, UI фильтрации и мониторинга на странице.

**Ограничения:** Последний коммит2023; текущая совместимость с DOM не проверена. ISC в manifest полезный признак, но текст лицензии стоит уточнить перед распространением.

**Лицензия:** ISC declared в package.json; отдельный LICENSE отсутствует, GitHub license=null. Это декларация в manifest, а не проверенный полный текст LICENSE; перед распространением нужно уточнить применимость и текст условий.

**Первичные файлы:** [README.md](https://github.com/alexeysever/avito-filter/blob/31bf53faf4c4586b22b5dc7014dc2c82e5308afa/README.md), [manifest.json](https://github.com/alexeysever/avito-filter/blob/31bf53faf4c4586b22b5dc7014dc2c82e5308afa/manifest.json), [package.json](https://github.com/alexeysever/avito-filter/blob/31bf53faf4c4586b22b5dc7014dc2c82e5308afa/package.json), [content.js](https://github.com/alexeysever/avito-filter/blob/31bf53faf4c4586b22b5dc7014dc2c82e5308afa/content.js), [Storage.js](https://github.com/alexeysever/avito-filter/blob/31bf53faf4c4586b22b5dc7014dc2c82e5308afa/Storage.js).

## zlexdev/avitoapi

[Репозиторий](https://github.com/zlexdev/avitoapi) · [HEAD cbbe517](https://github.com/zlexdev/avitoapi/commit/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958) · 2026-07-11T21:40:27Z · archived=false.

**README утверждает:** README: typed async aiogram-style SDK, генерация из Avito OpenAPI, events/FSM/webhooks.

**Исходники подтверждают:** HTTP SDK с OAuth2 credentials к Avito Partner/Business API; не браузер и не доступ к произвольной сессии пользователя.

- Чтение: Свои объявления, чаты/сообщения, статистика и другие официальные account API domains.
- Изменения: Отправка/удаление сообщений, read mark, изменение цены/продвижение и другие account mutations по API-полномочиям.
- Оценка: Нет buyer price valuation.
- Зависимости: Python>=3.11; Pydantic>=2.6; pydantic-settings>=2.2; curl_cffi>=0.7; structlog/email-validator; optional web/storage transports.

**Готовые части для изучения:** Typed DTO/enum/client facades, generated methods, OAuth/error/event transport — при наличии официального доступа.

**Ограничения:** Не решает поиск произвольных чужих объявлений через бесплатную browser session. Alpha0.1.0; соответствие текущей официальной схеме и runtime не проверены.

**Лицензия:** MIT, LICENSE прочитан. Для MIT при использовании сохраняются copyright/license notices; лицензия кода не даёт разрешения на доступ к Avito и использование бренда.

**Первичные файлы:** [README.md](https://github.com/zlexdev/avitoapi/blob/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958/README.md), [LICENSE](https://github.com/zlexdev/avitoapi/blob/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958/LICENSE), [pyproject.toml](https://github.com/zlexdev/avitoapi/blob/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958/pyproject.toml), [avitoapi/methods/messenger.py](https://github.com/zlexdev/avitoapi/blob/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958/avitoapi/methods/messenger.py), [avitoapi/methods/items.py](https://github.com/zlexdev/avitoapi/blob/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958/avitoapi/methods/items.py), [avitoapi/auth/oauth.py](https://github.com/zlexdev/avitoapi/blob/cbbe51736a1e5a4cefa68be6ed9307e8a1d47958/avitoapi/auth/oauth.py).

## Что ещё не установлено

Текущая работа с Avito, поддержка Windows и конкретного Chrome, получение корректных данных, полнота поиска, реальная скорость/стоимость, качество оценки и торга, соблюдение условий Avito и лицензий транзитивных зависимостей не проверялись. Отсутствие специализированной функции означает только отсутствие в просмотренных исходниках, не доказательство отсутствия во всём репозитории.
