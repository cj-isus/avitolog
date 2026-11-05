# Что уже есть и что можно переиспользовать

Проверка на 5 ноября 2026 года. Это карта компонентов существующих проектов; состав MVP пока не выбран. Подробные карточки и первичные файлы — в [каталоге](catalog.md) и [машиночитаемой базе](data/deep-reviews.json).

## Основные кандидаты

| Нужная часть | Где уже реализована | Что полезно взять или изучить | Условия и предел проверки |
|---|---|---|---|
| LLM-инструменты личного аккаунта | [AlexButiev/avito-personal-mcp](https://github.com/AlexButiev/avito-personal-mcp) | MCP-контракты поиска/карточек/чатов; preview → одноразовый token → одна попытка отправки | MIT. Отправка в существующий chat_id; открытие нового диалога из любой карточки не подтверждено. Нужен отдельный Chrome с CDP |
| Чтение фото и управление страницей | [ermizin/avito-mcp](https://github.com/ermizin/avito-mcp) | Извлечение полноразмерных фото, DOM и UI-действия | MIT. Собственный Chrome-профиль; confirm-флаг эвристический. Windows и текущий сайт не проверены |
| Проверка идентичности полученной карточки | [Vladimir-Human/ru-marketplace-mcp](https://github.com/Vladimir-Human/ru-marketplace-mcp) | Сверка itemId/userId и fail-closed извлечение вместо доверия любому успешному HTTP-ответу | MIT. Read-only, отдельные HTTP/CDP/DOM транспорты; не оценщик |
| Расширение прямо в выдаче Avito | [ForseJDM/avito-gpu-helper](https://github.com/ForseJDM/avito-gpu-helper) | MV3, badges, панель сравнения, локальный кеш аналогов, отдельный движок цены | MIT-текст + trademark note, GitHub NOASSERTION. GPU-справочник и коэффициенты; LLM нет, точность и актуальность внешнего price feed не измерены |
| Скрытие просмотренного и отметки | [alexeysever/avito-filter](https://github.com/alexeysever/avito-filter) | Состояния seen/hidden/new и chrome.storage | ISC заявлена в package.json, отдельный LICENSE не найден. Старые DOM-селекторы требуют проверки |
| Мониторинг и история цены с LLM-пояснением | [Case211/avito-watch](https://github.com/Case211/avito-watch) | История, медиана выдачи, классификация проблем сбора; LLM получает текстовые данные отдельно от браузера | AGPL-3.0. Не готовое расширение или покупательский чат; медиана выдачи ещё не цена сопоставимого товара |
| Модульный MCP-парсер | [evgenygurin/avito-mcp-plugin](https://github.com/evgenygurin/avito-mcp-plugin) | Gateway, модели, мониторинг/экспорт, адаптеры уведомлений | MIT. Текущий код использует Supabase/Postgres; TG/VK notification не является сообщением продавцу |
| Модель объявления, дедуп и экспорт | [Duff89/parser_avito](https://github.com/Duff89/parser_avito) | Фильтры, seen(id,price), Excel и история изменений как референс | Лицензия не найдена. Не переносить код в продукт без установленного разрешения; текущий сбор не запускался |
| Объяснимый скоринг | [domovoyproj/avito-parser](https://github.com/domovoyproj/avito-parser) | Отдельные score/reasons/confidence, правила, optional LLM, история | Лицензия не найдена. Это референс; сравнимость объектов и качество оценки не измерены |
| Резерв ремонта, ликвидность и доходность | [xailiry/TechBot](https://github.com/xailiry/TechBot) | Robust median/IQR, clustering, condition/repair reserve и ROI | Лицензия не найдена. Предметная модель электроники не переносится на велосипеды без новой проверки |
| Клиент официальных API | [zlexdev/avitoapi](https://github.com/zlexdev/avitoapi), [18studio/avito_python_api](https://github.com/18studio/avito_python_api), [kozandlov/avito-python-sdk](https://github.com/kozandlov/avito-python-sdk) | Типы, авторизация, события и Messenger-методы | Первые два MIT, третий AGPL-3.0-only. Это сторонние SDK; нужны API-права, браузерная авторизация их не заменяет |
| MCP над API кабинета | [ilyautov/marketplaces-mcp-ru](https://github.com/ilyautov/marketplaces-mcp-ru), [elchin92/avito-mcp](https://github.com/elchin92/avito-mcp) | Каталог endpoints, проверка write-операций; у elchin92 preview/confirmation и idempotency | MIT у обоих. В Avito YAML ilyautov 64 операции; все сетевые вызовы не проверялись, публичный покупательский каталог из этого не следует |
| JSON-интерфейс для агента | [Egor01KKK/avito-parser](https://github.com/Egor01KKK/avito-parser) | JSONL события, FATAL/exit, scan/watch; группировка model+memory и trimmed median | Лицензия проекта не найдена. Оценка заточена под телефоны; HTTP-клиент не наследует env proxy, это требует отдельной проверки маршрута |
| Навигация по API-схемам | [MissiaL/avito-api](https://github.com/MissiaL/avito-api) | Skill, поиск endpoint и скрипты авторизации | Оригинальные scripts/SKILL MIT; приложенные материалы Avito исключены из MIT. Это справочник/CLI, а не готовый SDK |
| Состояния и ручной перехват диалога | [marko1olo/avito-dental-ai-bot](https://github.com/marko1olo/avito-dental-ai-bot), [aurusxd/avito-ai-agent](https://github.com/aurusxd/avito-ai-agent), [prog-time/tg-support-bot](https://github.com/prog-time/tg-support-bot) | Draft/auto/ignore, дедупликация, этапы, manager handoff | Seller-side задачи. У dental изменённый MIT-disclaimer, у aurusxd лицензия не найдена, у tg-support-bot MIT. Это не доказанный покупательский переговорщик |

Первичные файлы для этих выводов сохранены у каждой карточки [каталога](catalog.md); формулировки выше относятся только к прочитанному контуру, без runtime-проверки.

## Что пока не подтверждено готовым решением

В проверенных проектах не подтверждён единый качественно измеренный цикл «найти сопоставимые объявления → оценить конкретную комплектацию и износ → уточнить неизвестное → пересчитать цену → провести покупательский торг». Отдельные реализации оценки и диалогов существуют. Само их наличие не показывает качество объединённого сценария.

Для дальнейшего выбора компонентов остаются предметные вопросы:

- Как отличать действительно сопоставимые товары от просто дешёвых строк выдачи? Для велосипеда размер рамы, геометрия, колёса и компоненты могут менять пригодность и цену сильнее названия модели.
- Как отличать заявленное продавцом состояние от наблюдения по фото или подтверждённого осмотра? «Неизвестно» должно сохраняться отдельно от «хорошее состояние».
- Как калибровать цену и уверенность при малом числе аналогов, дубликатах и объявлениях с отсутствующей комплектацией? Цена объявления не подтверждает цену сделки.
- Как учитывать ответы продавца, актуальную цену и контекст до отправки следующего предложения? Наличие sendMessage само по себе не решает выбор цены и тактику торга.

Это список пробелов для следующего исследования, а не утверждение, что такого решения нигде не существует.

## Смежные основания

[NanoBrowser](https://github.com/nanobrowser/nanobrowser) даёт готовое расширение агента, [Playwright MCP](https://github.com/microsoft/playwright-mcp) — подключение к открытым Chrome/Edge tabs через extension, [browser-use](https://github.com/browser-use/browser-use) и [Stagehand](https://github.com/browserbase/stagehand) — отдельные agent/automation SDK. Они могут сократить работу над общим browser-control, но не содержат проверенную предметную оценку Avito. Условия и источники приведены в [смежных карточках](catalog.md#смежные-проекты).

Марокканское [Avito Price Estimator](https://github.com/itsma3il/Avito-Price-Estimator-Extension) полезно как пример extension → DOM features → оценка, но работает с avito.ma и автомобилями; backend оценки в проверенном репозитории не опубликован.
