# Сайт базы знаний АВИТОЛОГА

Адрес: **https://cj-isus.github.io/avitolog/**.

Оболочка переиспользована из базы Snowden пользователя: та же тёмная тема, Quartz, дерево слева, большой граф на главной, локальный граф и обратные ссылки у статей. Тексты и данные Snowden в этот проект не переносились.

## Как пополнять

- Проверенные карточки проектов и их источники хранятся в `research/data/deep-reviews.json`. Текущие материалы исследования и сборщик каталога сохранены в `research/`.
- Новые самостоятельные заметки добавляются в `research/notes/` как Markdown. Они автоматически становятся статьями и узлами графа. Связи создаются обычными Markdown-ссылками и `[[wikilinks]]`.
- Метод, карта переиспользования и сверка исследования берутся из соответствующих Markdown-файлов `research/`.
- После push в `main` workflow `knowledge-pages.yml` экспортирует разрешённые материалы из конкретного commit, собирает сайт и публикует GitHub Pages.

Граф содержит отобранные карточки, категории, способности и заметки. Широкая выборка из 1 811 строк доступна отдельными JSON/CSV, чтобы поисковый шум не превращал карту в нечитаемое облако.

Переговоры, скриншоты аккаунта, `.env`, локальные артефакты и настройки браузера не входят в публикацию. Экспортер не обходит весь рабочий каталог.

## Сборка

`upstream.json` фиксирует Quartz 4.5.2, commit `d25a6eabf96751ffca56f8a8139272def7a65041`. Движок устанавливается в отдельный каталог; его зависимости и Mermaid закреплены lockfile. Лицензии Quartz и Mermaid сохранены рядом.

```powershell
# В изолированном каталоге Quartz:
npm ci --ignore-scripts --no-audit --no-fund

# В корне этой базы:
npm ci --prefix knowledge-site/runtime --ignore-scripts --no-audit --no-fund
node knowledge-site/export-content.mjs --repository . --ref HEAD --out .artifacts/quartz/site-content --quartz .artifacts/quartz --source-url https://github.com/cj-isus/avitolog
node knowledge-site/apply-site.mjs --quartz .artifacts/quartz
node knowledge-site/build-site.mjs --quartz .artifacts/quartz
```

Применять `apply-site.mjs` нужно к чистому checkout закреплённого Quartz: патчи проверяют ожидаемые фрагменты исходника. Для просмотра незакоммиченных изменений у экспортера есть явный режим `--working-tree`; такой результат помечается как черновой. Публикующий workflow всегда читает Git commit.

`build-site.mjs` сохраняет receipt со ссылкой на исходную версию, количеством страниц и связей, хешем главной и размером индексов. Это проверка упаковки сайта; работоспособность чужих Avito-проектов она не доказывает.
