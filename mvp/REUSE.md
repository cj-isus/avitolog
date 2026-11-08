# Переиспользование компонентов и происхождение кода

Обновлено **8 ноября 2026 года**. Основа демо — готовые npm-пакеты и небольшие компоненты АВИТОЛОГА с едиными CSS tokens. Целые приложения, чужие страницы, темы и несвязанные шаблоны в исходники не переносились. Лицензия собственного кода приложения пока не выбрана.

Точные установленные версии, lock locations, npm integrity, происхождение каждого legal-файла и SHA-256 находятся в [manifest](public/licenses/manifest.json). Читаемый индекс — [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES.md). Эти документы фиксируют состав и сохранение уведомлений; они не являются юридической гарантией отсутствия претензий.

## Готовые части и наша ответственность

| Пакет / первоисточник | Что берём | Что остаётся нашим | Сохраняемые условия |
|---|---|---|---|
| [React](https://registry.npmjs.org/react/19.3.1), [React DOM](https://registry.npmjs.org/react-dom/19.3.1) | UI runtime, hooks, композицию. | Экран, состояния, props и предметные сценарии. | Оригинальные MIT LICENSE. |
| [Base UI React 1.9.0](https://registry.npmjs.org/@base-ui%2freact/1.9.0), [Dialog docs](https://base-ui.com/react/components/dialog) | Headless Button, Input и Dialog. | Публичные props обёрток, содержимое, размеры, CSS на наших tokens. | Оригинальный MIT LICENSE и notices фактической цепочки, включая Floating UI. |
| [Recharts 3.10.1](https://registry.npmjs.org/recharts/3.10.1) | Графические примитивы, responsive container. | Данные, подписи, табличное представление, интерпретацию цены. | MIT главного пакета; у `victory-vendor` составная декларация MIT/ISC/BSD-3-Clause и вложенные оригинальные notices. Сохранены все найденные тексты. |
| [Dexie 4.4.7](https://registry.npmjs.org/dexie/4.4.7), [React Hooks 4.4.0](https://registry.npmjs.org/dexie-react-hooks/4.4.0) | IndexedDB API, транзакции, реактивное чтение. | Схему, миграции, импорт/экспорт и предметные правила. | Apache-2.0 LICENSE и применимые NOTICE. Upstream-файлы не изменялись; вызов API не является патчем библиотеки. |
| [Lucide React 1.70.0](https://registry.npmjs.org/lucide-react/1.70.0) | Готовые SVG-иконки через React. | Размещение, размеры, доступные названия. | Полный LICENSE содержит ISC и MIT для перечисленных Feather-derived иконок; одного npm-поля `ISC` недостаточно. |
| [Zod 4.6.7](https://registry.npmjs.org/zod/4.6.7) | Runtime-схемы и разбор данных. | Контракты и ограничения импорта. | Оригинальный MIT LICENSE. Валидная структура не доказывает истинность объявления. |
| [WXT 0.21.5](https://registry.npmjs.org/wxt/0.21.5), [browser 0.3.7](https://registry.npmjs.org/@wxt-dev%2fbrowser/0.3.7) | Extension entrypoints, MV3-сборку, включённые browser/runtime helpers. | Permissions, extractor, хранение и продуктовую логику. | MIT; version-matched source LICENSE восстановлены способом ниже. Dev-флаг не исключает runtime из inventory. |

Полные условия берутся из сохранённых текстов. Лицензии зависимостей не назначают MIT всему приложению и не разрешают доступ к Авито. Для Apache-2.0, BSD и составных пакетов сохраняются их собственные условия.

## Одна компонентная система

- `src/components/ui/Button.tsx` импортирует `@base-ui/react/button`, `Input.tsx` — `@base-ui/react/input`, `Dialog.tsx` — `@base-ui/react/dialog`. Это наши небольшие wrappers с общими props и CSS `ui-*`, а не скопированные upstream-исходники.
- `IconButton` использует наш `Button`. `Select`, `Textarea`, `Field`, `Card`, `Badge`, `Alert`, `EmptyState`, `SectionHeading`, `StatCard` — собственные композиции/native HTML. `Field` связывает label/help/error с контролом; он не содержит предметных правил.
- `BikeIllustration` использует `Bike`, а `Dialog` — `X` из Lucide. Самостоятельные чужие SVG и изображения не переносились.
- `src/application/`, `src/domain/`, `src/data/`, `src/integrations/` сохраняют разные обязанности. UI-примитивы не получают правила оценки велосипеда, IndexedDB или доступ к страницам Авито.
- Recharts, Dexie, Zod и Lucide подключены пакетами. Содержимое экранов и предметное поведение остаются модулями нашего проекта. `node_modules` не редактируется.

Код `shadcn/ui`, CLI/registry items, Tailwind, `tailwind-merge` и готовые Avito-приложения в этом этапе не заимствовались. Их названия в исследовании обозначали кандидатов/референсы, а не источник наших компонентов.

## Адресная замена Radix

В прежней цепочке Radix Dialog 1.3.1 у `react-remove-scroll-bar@2.3.8` MIT был объявлен в metadata, но оригинального LICENSE в пакете не оказалось. По сообщённому npm gitHead и предполагаемым version tags его восстановить не удалось. LICENSE из `master`, другой версии или шаблон MIT вместо оригинала не подставлялся.

Для нынешней основы выбран Base UI React 1.9.0: tarball содержит оригинальный MIT LICENSE. До установки проверены tarballs Base UI, utils, Floating UI, Babel runtime, reselect и use-sync-external-store по npm SHA-512; после установки collector сверяет конкретный lock и оригинальные notices. Эта замена закрывает конкретный пропуск выбранного набора; будущие импорты проверяются отдельно.

## Version-matched WXT LICENSE

В npm tarballs WXT и browser отдельного LICENSE нет. Вместо текущего `main` сохранены registry provenance statements: их subject SHA-512 совпадает с npm integrity и проверенными байтами соответствующих tarballs. Resolved dependency указывает immutable commits:

| Артефакт | Source commit и оригинальный LICENSE |
|---|---|
| `wxt@0.21.5` | [`24ee2417d3a9c85ceb2b1cdf76184f6c6cb3e2af`](https://github.com/wxt-dev/wxt/blob/24ee2417d3a9c85ceb2b1cdf76184f6c6cb3e2af/LICENSE) |
| `@wxt-dev/browser@0.3.7` | [`f5386b496d28ca66baa1efc5ae6e49f85f5d8d2d`](https://github.com/wxt-dev/wxt/blob/f5386b496d28ca66baa1efc5ae6e49f85f5d8d2d/LICENSE) |

Оба исходных MIT LICENSE, Copyright (c) 2023 Aaron, содержат 1062 байта, SHA-256 `7b0b00fcdbc6a036078aad84d0bc0fae240ac67144b86c911149c2daa37c9f85`. Оригинальные байты и [sources.json](scripts/license-sources/sources.json) находятся в `scripts/license-sources/`; JSON хранит metadata/provenance URLs и декодированные statements. Collector проверяет lock integrity, source commit, размер и SHA-256 перед копированием. Статус `collected_version_matched_source_files` отличается от текста из установленного пакета.

Это проверка полученных registry данных и связей между хешами/исходником. DSSE/Sigstore-подпись и transparency proof независимо не проверялись; такая проверка не заявляется.

## Runtime из devDependencies и точные счётчики

Collector объединяет все production entries установленного lock (`dev !== true`, включая отмеченные npm optional/devOptional/types) и дополнительные package locations из реально emitted chunks preview/extension с положительным `renderedLength`. Отчёт `.artifacts/bundled-runtime.json` создаётся из `chunk.modules`, а не всех parsed modules; каждый target связан с SHA-256 lock, устаревший hash отклоняется. Manifest различает причины включения, targets и production/runtime additions. Production entry не означает, что весь пакет сохранился после tree-shaking.

Виртуальные runtime-модули не получают придуманные file IDs. У Vite IDs `\0vite/*` (в частности preload helpers), а у WXT `\0virtual:wxt-*` связаны с проверенными установленными generators/templates. `\0rolldown/runtime.js` связан с interop runtime Rolldown 1.2.16: его source виден в установленном `dist/shared/rolldown-runtime-*.mjs`; MIT LICENSE и THIRD-PARTY-LICENSE (Rollup и Evan Wallace) проверены по точному npm tarball и сохраняются целиком. Отчёт сохраняет virtual ID и явный `packageLockPath` на соответствующий пакет; manifest записывает attribution. Все positive virtual modules также вынесены в отдельный список отчёта для review. Генерируемые bundler adapters, пользовательские entrypoints и реальные dependency source modules различаются.

Raw report сохраняет module IDs и rendered lengths для review. Публичный manifest связывает лицензионный состав с semantic inventory SHA-256: canonical target names, lock hash и package locations. Число/длины внутренних модулей и абсолютный путь машины в этот digest не входят, а положительный renderedLength по fresh report всё равно проверяется. Поэтому изменение минификации при прежнем package inventory не требует переписывать originals и сводки; новое runtime package location по-прежнему меняет check.

Original legal-файлы считаются до добавления двух служебных файлов — `manifest.json` и сводки. Их число равно сумме `packages[].files.length`; installed и recovered source notices посчитаны отдельно. Файлы иконки Lucide `copyright.mjs`/`.map` не являются notices и исключены: Copyright/CopyrightNotice имена ограничены обычными текстовыми расширениями. Полный Lucide LICENSE сохранён. Legal-тексты копируются байт в байт, без смены окончаний строк и повторной записи при совпадении.

Из `mvp/`, после установки точного lock и сборки обоих targets:

```sh
node scripts/collect-notices.mjs
node scripts/collect-notices.mjs --check --require-bundle-report
```

Ранний сбор без отчёта разрешён как явно обозначенный lock-only inventory. Финальная команда требует preview + extension, актуальный lock hash, отсутствие неразрешённых пропусков LICENSE и совпадение output без записи. Обновлённые notices затем включаются в оба распространяемых результата сборки.

Collector использует Node built-ins, не выполняет dependency modules/lifecycle scripts и не обращается к сети. Отклоняются symlinks, escaping paths, чужие файлы в managed output и несовпадение установленного имени/версии с lock. Удаляются только obsolete-файлы его прежнего manifest, без рекурсивного удаления каталогов.

Охвачены conventionally named LICENSE/LICENCE/NOTICE/COPYING/CopyrightNotice/third-party files и notice directories. Inline headers, нестандартные имена, отдельные assets и будущие copied sources требуют собственного review. PASS collector доказывает указанный inventory и сохранение байтов; build, поведение в браузере и legal compatibility проверяются отдельно.

## Следующее заимствование

| Вид reuse | Что фиксируем до включения |
|---|---|
| npm-пакет | Exact version, lock integrity, установленную цепочку, notices, emitted runtime additions. |
| Собственная обёртка | Наш путь, ответственность/props и импортируемый пакет; его notices сохраняются. |
| Копируемый upstream-файл | Immutable commit, source path, применимые license/notice, наш путь, изменения и imports. Сохраняем атрибуцию; node_modules collector файл автоматически не обнаружит. |
| Референс/паттерн | URL и назначение. Не выдаём идею за скопированный код и не переносим с ней тексты, изображения или платные assets. |

Ранее изученный [pinned Clean Code skill](https://github.com/sickn33/agentic-awesome-skills/blob/828257c3037dc7c3c3ec987decc5a603025a0ce5/skills/clean-code/SKILL.md) — консультативный источник ясных имён и ограниченных обязанностей. Его текст, примеры и текст книги не копируются в приложение. Skill не устанавливается глобально и не требует механических переделок работающего кода ради численных эвристик.
