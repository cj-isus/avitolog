// Local documentation builder. Reads research evidence; makes no network requests.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const base = path.dirname(fileURLToPath(import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8').replace(/^\uFEFF/, ''));
const write = (name, value) => fs.writeFileSync(path.join(base, name), name.endsWith('.md') ? value.replace(/\n+$/, '\n') : value, 'utf8');
const files = ['drafts/oss-catalog.json', 'drafts/additional-integrations.json', 'drafts/root-integrations.json', 'drafts/supplement-chat.json', 'drafts/supplement-parsers.json', 'drafts/supplement-specialized.json'];
const inventory = read('data/github-repositories.json');
const broadNames = new Set(inventory.repositories.map(x => x.full_name.toLowerCase()));
const registry = new Map();
const adjacent = new Map();
const unresolved = [];
const seq = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => seq(value).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('; ');
const safe = value => text(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const roleLabels = {
  third_party_official_api_client: 'Сторонний SDK официального API', third_party_official_api_client_pre_alpha: 'Незавершённый SDK официального API',
  seller_llm_listing_and_messenger_bot_public_source: 'Генерация объявлений и диалоги продавца', seller_service_llm_messenger_bot: 'LLM-бот продавца услуг',
  educational_parser_and_price_statistics: 'Учебный парсер и статистика цен', buyer_monitor_with_price_history_and_optional_llm: 'Мониторинг, история цены и LLM-пояснения',
  http_parser_monitor_with_agent_jsonl_interface_and_rule_based_goods_price_analysis: 'HTTP-монитор с JSONL для агента и анализом цен телефонов',
  standalone_async_browser_parser_template: 'Шаблон async браузерного парсера', telegram_new_listing_monitor: 'Мониторинг новых объявлений в Telegram',
  queued_multiuser_telegram_parser: 'Многопользовательский парсер с очередями', unverified_parser_candidate_source_unavailable: 'Недоступный для проверки кандидат',
  hosted_service_client_examples: 'Примеры клиентов hosted API', open_source_scraper_with_commercial_transport_integrations: 'Парсер с интеграциями внешних сервисов',
  open_source_specialized_monitor: 'Монитор недвижимости под реновацию', public_source_car_price_ml_research: 'ML-оценка цены автомобилей',
  public_source_apartment_price_ml_university_project: 'Учебная ML-оценка квартир', public_source_apartment_price_analysis_notebook: 'Notebook оценки квартир',
  different_market_avito_ma_extension: 'Расширение оценки автомобилей для avito.ma', generic_browser_agent_extension: 'Общее расширение браузерного агента',
  generic_mcp_browser_driver: 'Общий MCP-драйвер браузера', generic_python_browser_agent: 'Общая Python-библиотека агента', generic_browser_agent_sdk: 'Общий SDK автоматизации'
};
const licenseLabels = {
  '18studio/avito_python_api': 'MIT; LICENSE прочитан', 'kozandlov/avito-python-sdk': 'AGPL-3.0-only в pyproject; LICENSE прочитан',
  'DUB1401/AvitoAPI': 'Apache-2.0; LICENSE прочитан', 'dontsovcmc/antihlam_bot': 'Лицензия не найдена в проверенном дереве',
  'marko1olo/avito-dental-ai-bot': 'MIT заявлена; текст LICENSE.md изменён, нужно уточнение',
  'Deshazior/avito-parser': 'MIT только заявлена в README; LICENSE не найден', 'Case211/avito-watch': 'AGPL-3.0; only/or-later не уточнено',
  'Egor01KKK/avito-parser': 'Лицензия проекта не найдена; vendor LICENSE не распространяется автоматически на проект',
  'xailiry/avito-parser-sdk': 'Лицензия не найдена', 'sc0urged/avito_parser': 'MIT только заявлена в README; LICENSE не найден',
  'Mak-os-sourse/AvScan': 'GPL-3.0; only/or-later не установлено', '6oT9lpa/parser-avito': 'Неизвестна: исходники недоступны',
  'abotapi/avito-scraper': 'MIT для примеров; лицензия hosted движка не установлена', '2scraper/avito-scraper': 'MIT; LICENSE прочитан',
  'l0af-t0mcat/avito_renovation': 'MIT; LICENSE прочитан', 'nfilin480/carPrice_pred': 'Лицензия не найдена',
  'Daniil-Solo/Avito-analytics': 'Лицензия не найдена', 'Zzema/avito_nedvizhimost_analyse': 'Лицензия не найдена'
};
const levelLabels = {selected_source_review: 'Выбранные исходники', readme_review: 'README', repository_index_only_source_unavailable: 'Индекс; live 404'};
const groups = {
  'AlexButiev/avito-personal-mcp': 'MCP и браузерный доступ', 'ermizin/avito-mcp': 'MCP и браузерный доступ',
  'Vladimir-Human/ru-marketplace-mcp': 'MCP и браузерный доступ', 'evgenygurin/avito-mcp-plugin': 'MCP и браузерный доступ',
  'ForseJDM/avito-gpu-helper': 'Расширения', 'alexeysever/avito-filter': 'Расширения',
  'Duff89/parser_avito': 'Сбор, мониторинг и оценка', 'xailiry/TechBot': 'Сбор, мониторинг и оценка',
  'nummyn0rih/avito-monitor-bot': 'Сбор, мониторинг и оценка', 'domovoyproj/avito-parser': 'Сбор, мониторинг и оценка',
  'Deshazior/avito-parser': 'Сбор, мониторинг и оценка', 'Case211/avito-watch': 'Сбор, мониторинг и оценка',
  'Egor01KKK/avito-parser': 'Сбор, мониторинг и оценка', 'xailiry/avito-parser-sdk': 'Сбор, мониторинг и оценка',
  'sc0urged/avito_parser': 'Сбор, мониторинг и оценка', 'Mak-os-sourse/AvScan': 'Сбор, мониторинг и оценка',
  '6oT9lpa/parser-avito': 'Сбор, мониторинг и оценка', '2scraper/avito-scraper': 'Сбор, мониторинг и оценка',
  'abotapi/avito-scraper': 'Сбор, мониторинг и оценка',
  'zlexdev/avitoapi': 'Официальный API: сторонние клиенты и MCP', '18studio/avito_python_api': 'Официальный API: сторонние клиенты и MCP',
  'kozandlov/avito-python-sdk': 'Официальный API: сторонние клиенты и MCP', 'DUB1401/AvitoAPI': 'Официальный API: сторонние клиенты и MCP',
  'ilyautov/marketplaces-mcp-ru': 'Официальный API: сторонние клиенты и MCP', 'elchin92/avito-mcp': 'Официальный API: сторонние клиенты и MCP',
  'MissiaL/avito-api': 'Официальный API: сторонние клиенты и MCP', 'jabukaservice/avito-mcp': 'Официальный API: сторонние клиенты и MCP',
  'aurusxd/avito-ai-agent': 'Диалоги и задачи продавца', 'dontsovcmc/antihlam_bot': 'Диалоги и задачи продавца',
  'marko1olo/avito-dental-ai-bot': 'Диалоги и задачи продавца', 'prog-time/tg-support-bot': 'Диалоги и задачи продавца',
  'ikermy/air_avito': 'Диалоги и задачи продавца', 'alex-polezhaev/myalert-case': 'Диалоги и задачи продавца',
  'l0af-t0mcat/avito_renovation': 'Узкие предметные исследования', 'nfilin480/carPrice_pred': 'Узкие предметные исследования',
  'Daniil-Solo/Avito-analytics': 'Узкие предметные исследования', 'Zzema/avito_nedvizhimost_analyse': 'Узкие предметные исследования'
};
for (const file of files) {
  const data = read(file);
  for (const raw of data.entries ?? data.candidates ?? []) {
    if (raw.review_level === 'unresolved_identity' || !raw.url) {
      unresolved.push(raw);
      continue;
    }
    const entry = {...raw};
    if (typeof entry.license === 'object') {
      entry.license_detail = entry.license;
      entry.license = Object.values(entry.license).filter(Boolean).join('; ');
    }
    entry.review_level_original = entry.review_level;
    if (/selected.*source|selected.*parser|selected.*client|selected.*gui/.test(entry.review_level ?? '')) entry.review_level = 'selected_source_review';
    else if (/readme_only/.test(entry.review_level ?? '')) entry.review_level = 'readme_review';
    entry.sources = (entry.sources ?? []).map(s => ({...s, path: s.path ?? s.url?.split('/').at(-1) ?? s.kind ?? 'источник'}));
    const key = entry.repo.toLowerCase();
    if (registry.has(key)) {
      const old = registry.get(key);
      old.review_files.push(file);
      for (const source of entry.sources ?? []) if (!old.sources.some(s => s.url === source.url)) old.sources.push(source);
      continue;
    }
    registry.set(key, {...entry, checked_on: entry.checked_on ?? '2026-11-05', review_level: entry.review_level ?? 'selected_source_review', runtime_verification: 'not_run', source_pinning: entry.source_pinning ?? entry.pinning ?? (entry.head_sha ? 'commit_sha' : 'default_branch_at_check'), group: groups[entry.repo] ?? 'Дополнительные кандидаты', in_broad_snapshot: broadNames.has(key), review_files: [file]});
  }
  for (const entry of data.adjacent_entries ?? []) adjacent.set(entry.repo.toLowerCase(), {...entry, review_files: [file]});
  for (const entry of seq(data.unresolved_candidates)) unresolved.push(entry);
}
const entries = [...registry.values()];
for (const e of entries) {
  const hasPinned = e.sources.some(s => /\/blob\/[a-f0-9]{40}\//i.test(s.url));
  const hasBranch = e.sources.some(s => /\/blob\/(main|master)\//i.test(s.url));
  e.source_pinning = e.review_level === 'repository_index_only_source_unavailable' ? 'unavailable' : hasPinned && hasBranch ? 'mixed_commit_and_default_branch' : hasPinned ? 'commit_sha' : e.source_pinning;
}
const counts = {};
for (const e of entries) counts[e.review_level] = (counts[e.review_level] ?? 0) + 1;
const bundle = {schema_version: 1, checked_on: '2026-11-05', scope: 'Selected public Avito-related projects; selected source/README checks only, no runtime; not an exhaustive OSS census', broad_snapshot_count: inventory.repository_count, entry_count: entries.length, review_counts: counts, adjacent_entry_count: adjacent.size, entries, adjacent_entries: [...adjacent.values()], unresolved_candidates: unresolved};
write('data/deep-reviews.json', JSON.stringify(bundle, null, 2) + '\n');

const rows = ['repo','group','kind','license','review_level','source_pinning','runtime_verification','in_broad_snapshot','url'];
const cell = v => '"' + text(v).replace(/"/g, '""') + '"';
write('data/deep-reviews.csv', '\uFEFF' + [rows.map(cell).join(','), ...entries.map(e => rows.map(k => cell(e[k])).join(','))].join('\r\n') + '\r\n');

let md = '# Каталог проектов Avito\n\nПроверено **5 ноября 2026 года**. Здесь **' + entries.length + ' карточек кандидатов**, отдельно **' + adjacent.size + ' смежных проектов**. Это результат проверки выбранных файлов, без запуска. Недоступные и README-only записи помечены своим уровнем. [Метод и границы](methodology.md) · [Карта переиспользования](reuse-map.md) · [JSON](data/deep-reviews.json) · [CSV](data/deep-reviews.csv)\n\n';
md += 'Широкая поисковая выборка содержит **1 811 репозиториев по метаданным**; она доступна отдельно в [CSV](data/github-repositories.csv). Не все строки являются интеграциями Avito или лицензированным open source.\n\n';
for (const group of [...new Set(entries.map(e => e.group))]) {
  md += `## ${group}\n\n| Проект | Роль | Лицензия по проверке | Уровень |\n|---|---|---|---|\n`;
  for (const e of entries.filter(e => e.group === group)) md += `| [${e.repo}](${e.url}) | ${safe(roleLabels[e.kind] ?? e.kind)} | ${safe(licenseLabels[e.repo] ?? e.license)} | ${safe(levelLabels[e.review_level] ?? e.review_level)} |\n`;
  md += '\n';
}
md += '## Подробные карточки\n\n`selected_source_review` означает README и выбранные исходники; `readme_review` — только описание/дерево/лицензия. Остальные статусы, включая недоступность, приведены буквально. Отсутствие функции означает «не найдена в проверенном контуре», а не полный аудит всего кода.\n\n';
for (const e of entries) {
  md += `### ${e.repo}\n\n[Репозиторий](${e.url}) · ${e.review_level} · runtime: not_run · источники: ${e.source_pinning}.\n\n`;
  if (e.head_sha) md += `Снимок default branch: [${e.head_sha.slice(0, 7)}](https://github.com/${e.repo}/commit/${e.head_sha})${e.head_commit_date_utc ? ' · committer ' + e.head_commit_date_utc : ''}.\n\n`;
  else if (e.pushed_at) md += `GitHub pushed_at: ${e.pushed_at}; это не дата релиза или проверенного commit.\n\n`;
  const fields = [['Транспорт','transport'], ['Чтение','reads'], ['Изменения/отправка','writes'], ['Оценка','scoring'], ['Полезные части','parts'], ['Ограничения','limits'], ['Лицензия','license']];
  for (const [label, key] of fields) if (e[key] != null) md += `**${label}:** ${text(key === 'license' ? licenseLabels[e.repo] ?? e[key] : e[key])}\n\n`;
  md += '**Первичные источники:** ' + (e.sources ?? []).map(s => `[${s.path ?? s.label ?? 'источник'}](${s.url})`).join(', ') + '.\n\n';
}
md += '## Смежные проекты\n\nЭто общие инструменты, другой рынок или учебные кейсы; они не считаются готовой интеграцией российского Avito.\n\n';
for (const e of adjacent.values()) {
  md += `### ${e.repo}\n\n[Репозиторий](${e.url}) · ${e.review_level ?? 'readme_review'}.\n\n`;
  for (const key of ['kind','transport','parts','limits','license']) if (e[key]) md += `${text(key === 'kind' ? roleLabels[e[key]] ?? e[key] : e[key])}\n\n`;
  md += '**Источники:** ' + (e.sources ?? []).map(s => `[${s.path ?? s.label ?? 'источник'}](${s.url})`).join(', ') + '.\n\n';
}
if (unresolved.length) md += '## Неоднозначные названия\n\n' + unresolved.map(x => '- **' + (x.repo ?? text(x)) + '**: владелец и URL не указаны в исходном обзоре; идентичность, код и лицензия не установлены.').join('\n') + '\n';
write('catalog.md', md);

let index = '# Реестр первичных источников\n\nПроверено 2026-11-05. Ссылки относятся к конкретным утверждениям в [каталоге](catalog.md). Часть закреплена commit SHA; остальные фиксируют чтение default branch на дату проверки. Сетевой доступ к файлу не доказывает работу программы.\n\n';
for (const e of [...entries, ...adjacent.values()]) {
  index += `## ${e.repo}\n\n` + (e.sources ?? []).map(s => `- [${s.path ?? s.label ?? 'источник'}](${s.url})`).join('\n') + '\n\n';
}
write('source-index.md', index);
console.log(JSON.stringify({entry_count: entries.length, adjacent_entry_count: adjacent.size, review_counts: counts, curated_not_in_broad: entries.filter(e => !e.in_broad_snapshot).map(e => e.repo)}));
