import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { spawnSync } from "node:child_process"

// This is an explicit publication allowlist, not a recursive repository exporter.
const permitted = [
  "research/data/deep-reviews.json", "research/data/github-repositories.json",
  "research/data/deep-reviews.csv", "research/data/github-repositories.csv",
  "research/reuse-map.md", "research/methodology.md", "research/reconciliation.md", "research/catalog.md",
]
const conceptFiles = [
  "01-brief.png", "02-radar.png", "03-sidepanel.png", "04-dossier.png", "05-compare.png",
  "06-market.png", "07-map.png", "08-negotiation.png", "09-inspection.png", "10-decision.png",
]
const conceptDestinations = new Map(conceptFiles.map(file => [`design/concepts/${file}`, `assets/concepts/${file}`]))
const flags = new Map()
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i]
  if (key === "--working-tree") flags.set(key, true)
  else if (["--repository", "--ref", "--out", "--quartz", "--source-url"].includes(key) && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) flags.set(key, process.argv[++i])
  else throw new Error(`Unknown or incomplete argument: ${key}`)
}
for (const key of ["--repository", "--out", "--quartz"]) if (!flags.has(key)) throw new Error(`Required argument: ${key}`)
const repository = path.resolve(flags.get("--repository"))
const output = path.resolve(flags.get("--out"))
const quartz = path.resolve(flags.get("--quartz"))
const workingTree = flags.has("--working-tree")
const ref = flags.get("--ref") ?? "HEAD"
if ([repository, quartz].includes(output) || !path.relative(quartz, output) || path.relative(quartz, output).startsWith("..")) throw new Error("Output must be an isolated directory inside the Quartz engine")
if (fs.existsSync(output) && fs.readdirSync(output).length) throw new Error("Use a fresh export directory; existing content is never overwritten")
if (!fs.existsSync(quartz) || !fs.statSync(quartz).isDirectory()) throw new Error("Quartz directory is missing")

function git(...args) {
  const result = spawnSync("git", ["-C", repository, ...args], { maxBuffer: 32 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`Git failed: ${result.stderr.toString().trim()}`)
  return result.stdout
}
function getOrigin() {
  const result = spawnSync("git", ["-C", repository, "remote", "get-url", "origin"], { encoding: "utf8" })
  return result.status === 0 ? result.stdout.trim().replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "") : ""
}
const sourceBase = (flags.get("--source-url") ?? getOrigin()).replace(/\/$/, "")
if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(sourceBase)) throw new Error("Provide a GitHub origin or --source-url https://github.com/owner/repository")
const sourceRef = workingTree ? "working-tree" : git("rev-parse", "--verify", `${ref}^{commit}`).toString().trim()
if (!workingTree && !/^[a-f0-9]{40}$/.test(sourceRef)) throw new Error("Expected a pinned Git commit")
const sourceUrl = file => `${sourceBase}/blob/${workingTree ? "HEAD" : sourceRef}/${file.split("/").map(encodeURIComponent).join("/")}`
const realRepository = fs.realpathSync(repository)
function assertRepositoryFile(absolute) {
  const relative = path.relative(realRepository, fs.realpathSync(absolute))
  if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) throw new Error("Input escapes the repository")
}
const notePaths = []
if (workingTree) {
  function discoverNotes(directory) {
    if (!fs.existsSync(directory)) return
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      if (item.name.startsWith(".") || item.isSymbolicLink()) continue
      const absolute = path.join(directory, item.name)
      if (item.isDirectory()) discoverNotes(absolute)
      else if (item.isFile() && item.name.endsWith(".md")) notePaths.push(path.relative(repository, absolute).replaceAll("\\", "/"))
    }
  }
  const notesRoot = path.join(repository, "research/notes")
  if (fs.existsSync(notesRoot)) {
    if (fs.lstatSync(notesRoot).isSymbolicLink()) throw new Error("Notes root must not be a symlink")
    assertRepositoryFile(notesRoot)
  }
  discoverNotes(notesRoot)
} else {
  for (const record of git("ls-tree", "-r", "-z", sourceRef, "--", "research/notes/").toString().split("\0").filter(Boolean)) {
    const match = record.match(/^(100644|100755) blob [a-f0-9]+\t(research\/notes\/.+\.md)$/)
    if (match && !match[2].split("/").some(part => part.startsWith("."))) notePaths.push(match[2])
  }
}
permitted.push(...notePaths.sort())
const availableConcepts = new Set()
if (workingTree) {
  for (const file of conceptDestinations.keys()) {
    const absolute = path.join(repository, file)
    if (!fs.existsSync(absolute)) continue
    for (const part of ["design", "design/concepts", file]) {
      if (fs.lstatSync(path.join(repository, part)).isSymbolicLink()) throw new Error(`Symlink concept input is not allowed: ${part}`)
    }
    if (!fs.statSync(absolute).isFile()) throw new Error(`Concept input is not a regular file: ${file}`)
    availableConcepts.add(file)
  }
} else {
  for (const record of git("ls-tree", "-r", "-z", sourceRef, "--", ...conceptDestinations.keys()).toString().split("\0").filter(Boolean)) {
    const match = record.match(/^(\d+) blob [a-f0-9]+\t(.+)$/)
    if (!match || !conceptDestinations.has(match[2]) || !["100644", "100755"].includes(match[1])) throw new Error("Concept input must be an explicitly allowed regular Git blob")
    availableConcepts.add(match[2])
  }
}
if (notePaths.includes("research/notes/mvp-gallery.md")) {
  const missing = [...conceptDestinations.keys()].filter(file => !availableConcepts.has(file))
  if (missing.length) throw new Error(`MVP gallery requires all ten concept images; missing: ${missing.join(", ")}`)
}
permitted.push(...availableConcepts)
const sources = new Map()
for (const file of permitted) {
  let bytes
  if (workingTree) {
    const absolute = path.join(repository, file)
    if (fs.lstatSync(absolute).isSymbolicLink()) throw new Error(`Symlink input is not allowed: ${file}`)
    assertRepositoryFile(absolute)
    bytes = fs.readFileSync(absolute)
  } else bytes = git("show", `${sourceRef}:${file}`)
  sources.set(file, bytes)
}
function inspectConceptPng(bytes, file) {
  if (bytes.length < 57 || bytes.length > 8 * 1024 * 1024) throw new Error(`Concept PNG must be at most 8 MiB: ${file}`)
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`Invalid PNG signature: ${file}`)
  let offset = 8, width, height, sawData = false, ended = false
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error(`Truncated PNG chunk: ${file}`)
    const length = bytes.readUInt32BE(offset), end = offset + 12 + length
    if (end > bytes.length) throw new Error(`Truncated PNG payload: ${file}`)
    const type = bytes.toString("ascii", offset + 4, offset + 8)
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error(`Invalid PNG chunk type: ${file}`)
    let crc = 0xffffffff
    for (const byte of bytes.subarray(offset + 4, end - 4)) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    if (((crc ^ 0xffffffff) >>> 0) !== bytes.readUInt32BE(end - 4)) throw new Error(`PNG checksum mismatch: ${file}`)
    if (offset === 8) {
      if (type !== "IHDR" || length !== 13) throw new Error(`PNG must start with IHDR: ${file}`)
      width = bytes.readUInt32BE(offset + 8); height = bytes.readUInt32BE(offset + 12)
      const depth = bytes[offset + 16], color = bytes[offset + 17]
      const validDepths = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }
      if (!validDepths[color]?.includes(depth) || bytes[offset + 18] !== 0 || bytes[offset + 19] !== 0 || bytes[offset + 20] > 1) throw new Error(`Unsupported PNG header: ${file}`)
      if (width < 320 || height < 240 || width > 4096 || height > 4096) throw new Error(`Concept PNG dimensions must be 320–4096 by 240–4096: ${file}`)
    } else if (type === "IHDR") throw new Error(`Duplicate PNG header: ${file}`)
    if (type === "IDAT" && length) sawData = true
    if (type === "IEND") {
      if (length !== 0 || end !== bytes.length || !sawData) throw new Error(`Invalid PNG end: ${file}`)
      ended = true
    }
    offset = end
  }
  if (!ended) throw new Error(`PNG has no IEND: ${file}`)
  return { width, height, bytes: bytes.length, mediaType: "image/png" }
}
const conceptAssets = [...availableConcepts].map(file => ({ source: file, destination: conceptDestinations.get(file), ...inspectConceptPng(sources.get(file), file), sha256: crypto.createHash("sha256").update(sources.get(file)).digest("hex") }))
const reviews = JSON.parse(sources.get(permitted[0]).toString("utf8").replace(/^\uFEFF/, ""))
const inventory = JSON.parse(sources.get(permitted[1]).toString("utf8").replace(/^\uFEFF/, ""))
if (!Array.isArray(reviews.entries) || !Array.isArray(reviews.adjacent_entries) || !Array.isArray(inventory.repositories)) throw new Error("Unsupported knowledge-base schema")
const allProjects = [...reviews.entries, ...reviews.adjacent_entries]
if (allProjects.length !== new Set(allProjects.map(entry => entry.repo?.toLowerCase())).size) throw new Error("Duplicate or invalid project names")
for (const entry of allProjects) if (!/^[\w.-]+\/[\w.-]+$/.test(entry.repo) || !/^https:\/\/github\.com\//.test(entry.url)) throw new Error("Invalid project identity")

const groupDefinitions = [
  ["MCP и браузерный доступ", "browser-mcp", "MCP и браузерный доступ", "Подключение языковой модели к поиску, карточкам и пользовательской сессии."],
  ["Сбор, мониторинг и оценка", "monitoring-pricing", "Сбор, мониторинг и оценка", "Парсеры, наблюдение за изменениями и разные подходы к оценке цены."],
  ["Расширения", "extensions", "Расширения", "Инструменты, которые добавляют интерфейс прямо в браузер."],
  ["Диалоги и задачи продавца", "seller-dialogues", "Диалоги и задачи продавца", "Поддержка, сообщения, генерация объявлений и ручной перехват диалога."],
  ["Официальный API: сторонние клиенты и MCP", "official-api", "Клиенты официальных API", "Сторонние SDK, MCP и справочники для авторизованных API кабинета."],
  ["Узкие предметные исследования", "domain-research", "Предметные исследования", "Исследования цены недвижимости и автомобилей, специализированный мониторинг."],
]
const groups = new Map(groupDefinitions.map(([key, id, title, description]) => [key, { id, title, description }]))
const adjacentGroup = { id: "adjacent", title: "Смежные проекты", description: "Общие браузерные инструменты и другие рынки. Они не являются готовой интеграцией с avito.ru." }
const roles = {
  third_party_official_api_client: "Сторонний клиент официального API",
  third_party_official_api_client_pre_alpha: "Сторонний клиент API на ранней стадии",
  seller_llm_listing_and_messenger_bot_public_source: "ИИ-помощник продавца: объявления и сообщения",
  seller_service_llm_messenger_bot: "ИИ-бот продавца услуг",
  educational_parser_and_price_statistics: "Учебный парсер и статистика цен",
  buyer_monitor_with_price_history_and_optional_llm: "Мониторинг покупателя, история цены и ИИ-пояснения",
  http_parser_monitor_with_agent_jsonl_interface_and_rule_based_goods_price_analysis: "HTTP-монитор с интерфейсом JSONL и анализом цен",
  standalone_async_browser_parser_template: "Шаблон асинхронного браузерного парсера",
  telegram_new_listing_monitor: "Мониторинг новых объявлений в Telegram",
  queued_multiuser_telegram_parser: "Многопользовательский парсер с очередями",
  unverified_parser_candidate_source_unavailable: "Кандидат с недоступными исходниками",
  hosted_service_client_examples: "Примеры клиентов внешнего сервиса",
  open_source_scraper_with_commercial_transport_integrations: "Парсер с интеграциями внешних сервисов",
  open_source_specialized_monitor: "Специализированный мониторинг",
  public_source_car_price_ml_research: "Исследование машинного обучения для цены автомобилей",
  public_source_apartment_price_ml_university_project: "Учебное исследование цены квартир",
  public_source_apartment_price_analysis_notebook: "Исследование цены недвижимости в блокноте",
  different_market_avito_ma_extension: "Расширение для автомобильного рынка avito.ma",
  generic_browser_agent_extension: "Универсальный браузерный ИИ-агент в расширении",
  generic_mcp_browser_driver: "Универсальный браузерный драйвер MCP",
  generic_python_browser_agent: "Универсальный браузерный ИИ-агент на Python",
  generic_browser_agent_sdk: "SDK браузерного ИИ-агента",
}
const reviewLabels = {
  selected_source_review: "Прочитаны выбранные исходники",
  readme_review: "Прочитан README",
  repository_index_only_source_unavailable: "Только индекс; исходники недоступны (404)",
}
const capabilityDefinitions = [
  ["browser", "Браузер", "Чтение страницы или управление браузером. Способ подключения и необходимость отдельного профиля различаются."],
  ["mcp", "MCP", "Инструменты, которые языковая модель может вызывать через Model Context Protocol."],
  ["monitoring", "Мониторинг", "Наблюдение за новыми объявлениями, историей и изменением цены."],
  ["pricing", "Оценка", "Статистика, правила или модели оценки цены. Наличие оценщика не подтверждает точность."],
  ["dialogues", "Диалоги", "Чтение или отправка сообщений, маршрутизация ответов и передача человеку."],
  ["api", "API", "Клиенты официальных API кабинета. Для них нужны соответствующие права и учётные данные."],
  ["extensions", "Расширения", "Интерфейс или агент, работающий как браузерное расширение."],
]
const capabilities = new Map(capabilityDefinitions.map(([id, title, description]) => [id, { id, title, description }]))
// These connections describe the reviewed role, not runtime compatibility.
const projectCapabilities = {
  "AlexButiev/avito-personal-mcp": ["browser", "mcp", "dialogues"],
  "ermizin/avito-mcp": ["browser", "mcp", "dialogues"],
  "Vladimir-Human/ru-marketplace-mcp": ["browser", "mcp"],
  "evgenygurin/avito-mcp-plugin": ["mcp", "monitoring"],
  "Duff89/parser_avito": ["browser", "monitoring"],
  "xailiry/TechBot": ["browser", "monitoring", "pricing"],
  "ForseJDM/avito-gpu-helper": ["extensions", "pricing", "monitoring"],
  "nummyn0rih/avito-monitor-bot": ["browser", "monitoring"],
  "domovoyproj/avito-parser": ["monitoring", "pricing"],
  "aurusxd/avito-ai-agent": ["browser", "dialogues"],
  "alexeysever/avito-filter": ["extensions", "monitoring"],
  "zlexdev/avitoapi": ["api", "dialogues"],
  "18studio/avito_python_api": ["api", "dialogues"],
  "kozandlov/avito-python-sdk": ["api", "dialogues"],
  "DUB1401/AvitoAPI": ["api"],
  "dontsovcmc/antihlam_bot": ["browser", "api", "dialogues"],
  "marko1olo/avito-dental-ai-bot": ["browser", "dialogues"],
  "Deshazior/avito-parser": ["pricing"],
  "Case211/avito-watch": ["browser", "monitoring", "pricing"],
  "ilyautov/marketplaces-mcp-ru": ["mcp", "api", "dialogues"],
  "prog-time/tg-support-bot": ["api", "dialogues"],
  "elchin92/avito-mcp": ["mcp", "api", "dialogues"],
  "MissiaL/avito-api": ["api"],
  "jabukaservice/avito-mcp": ["mcp", "api", "dialogues"],
  "ikermy/air_avito": ["api", "dialogues"],
  "alex-polezhaev/myalert-case": ["api", "dialogues"],
  "Egor01KKK/avito-parser": ["monitoring", "pricing"],
  "xailiry/avito-parser-sdk": ["browser"],
  "sc0urged/avito_parser": ["monitoring"],
  "Mak-os-sourse/AvScan": ["browser", "monitoring"],
  "l0af-t0mcat/avito_renovation": ["monitoring"],
  "nfilin480/carPrice_pred": ["pricing"],
  "Daniil-Solo/Avito-analytics": ["pricing"],
  "Zzema/avito_nedvizhimost_analyse": ["pricing"],
  "itsma3il/Avito-Price-Estimator-Extension": ["extensions", "pricing"],
  "nanobrowser/nanobrowser": ["browser", "extensions"],
  "microsoft/playwright-mcp": ["browser", "mcp"],
  "browser-use/browser-use": ["browser"],
  "browserbase/stagehand": ["browser"],
}
const slug = repo => `projects/${repo.toLowerCase().replace("/", "--")}`
const wiki = (target, title) => `[[${target}|${title}]]`
const projectLink = entry => wiki(slug(entry.repo), entry.repo)
const groupOf = entry => reviews.adjacent_entries.includes(entry) ? adjacentGroup : groups.get(entry.group)
const text = value => value === "Unknown" ? "Неизвестно: в проверенных материалах не установлено." : String(value)
const content = value => Array.isArray(value) ? value.map(item => `- ${text(item)}`).join("\n") : text(value)
const label = kind => roles[kind] ?? kind.replace("Read-only multi-marketplace MCP", "MCP нескольких площадок для чтения").replace("Универсальный browser MCP", "Универсальный браузерный MCP").replace("AI outreach и лидогенерация", "ИИ для исходящих сообщений и поиска клиентов").replace("MCP официальных seller API", "MCP официальных API продавца").replace("Seller notification SaaS showcase:", "Публичный пример сервиса уведомлений:")
const stats = {
  projects: reviews.entries.length,
  adjacent: reviews.adjacent_entries.length,
  metadata: inventory.repositories.length,
  source: reviews.entries.filter(entry => entry.review_level === "selected_source_review").length,
  readme: reviews.entries.filter(entry => entry.review_level === "readme_review").length,
  unavailable: reviews.entries.filter(entry => entry.review_level === "repository_index_only_source_unavailable").length,
}
const pageEntries = []
const pages = new Map()
function writePage(destination, title, body, source, tags = [], checkedOn = reviews.checked_on) {
  if (pages.has(destination)) throw new Error(`Duplicate page: ${destination}`)
  const url = sourceUrl(source)
  const frontmatter = { title, description: `${title} — база знаний АВИТОЛОГ`, tags, source_url: url, sourceUrl: url, source_ref: sourceRef, source_path: source, ...(checkedOn ? { checked_on: checkedOn } : {}) }
  if (workingTree) frontmatter.draft_snapshot = true
  const yaml = Object.entries(frontmatter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")
  const draft = workingTree ? "> Локальный предпросмотр из рабочего дерева. Ссылка на источник ведёт к HEAD; содержимое ещё не закреплено коммитом.\n\n" : ""
  const markdown = `---\n${yaml}\n---\n\n${draft}${body.trim()}\n`
  if (/(?:\b[A-Z]:[\\/]|file:\/\/|avito-negotiations|SNOWDEN-SYSTEM)/i.test(markdown)) throw new Error(`Forbidden local or private reference in ${destination}`)
  pages.set(destination, markdown)
  pageEntries.push({ type: "material", destination, title, source, sourceUrl: url })
}

const documentTargets = new Map([
  ["research/reuse-map.md", "research/reuse/index"], ["research/methodology.md", "research/methodology/index"],
  ["research/reconciliation.md", "research/reconciliation/index"], ["research/catalog.md", "catalog"],
])
const noteDestinations = new Map(notePaths.map(file => [file, "notes/" + file.slice("research/notes/".length, -3).split("/").map(part => part.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_.-]/gu, "")).join("/")]))
if (new Set(noteDestinations.values()).size !== notePaths.length) throw new Error("Two research notes produce the same destination")
for (const [file, destination] of noteDestinations) documentTargets.set(file, destination)
const noteSpecs = [
  ["research/reuse-map.md", "reuse", "Карта переиспользования"],
  ["research/methodology.md", "methodology", "Метод исследования"],
  ["research/reconciliation.md", "reconciliation", "Сверка присланного исследования"],
]
function rewriteLinks(body, source) {
  return body.replace(/(!?)\[([^\]\n]+)\]\(([^\s)]+)(?:\s+("[^"\n]*"))?\)/g, (original, image, title, url, caption) => {
    if (!image && /^https:\/\/github\.com\//.test(url)) {
      const match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)\/?$/)
      const entry = match && allProjects.find(item => item.repo.toLowerCase() === match[1].toLowerCase())
      return entry ? wiki(slug(entry.repo), title) : original
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("#")) return original
    const pathname = url.split(/[?#]/)[0]
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(source), decodeURIComponent(pathname)))
    if (conceptDestinations.has(target)) {
      if (!availableConcepts.has(target)) throw new Error(`Referenced concept image is missing: ${target}`)
      const destination = documentTargets.get(source)
      if (!destination) throw new Error(`No page destination for concept reference: ${source}`)
      const relative = path.posix.relative(path.posix.dirname(destination), conceptDestinations.get(target))
      return `${image}[${title}](${relative}${caption ? " " + caption : ""})`
    }
    if (image) throw new Error(`Local image is outside the publication allowlist: ${target}`)
    if (documentTargets.has(target)) return wiki(documentTargets.get(target), title)
    if (target === "research/source-index.md") return wiki("catalog", title)
    if (permitted.includes(target)) return `[${title}](${sourceUrl(target)})`
    // Keep the sentence, but do not publish arbitrary local attachments or drafts.
    return title
  })
}
function splitDocument(file) {
  const body = sources.get(file).toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
  const parts = body.split(/^## /m)
  return {
    introduction: parts.shift().replace(/^# .*\n+/, "").trim(),
    sections: parts.map(part => { const newline = part.indexOf("\n"); return { title: part.slice(0, newline).trim(), body: part.slice(newline + 1).trim() } }),
  }
}

for (const entry of allProjects) {
  const group = groupOf(entry)
  if (!group) throw new Error(`Unknown group for ${entry.repo}`)
  const connections = (projectCapabilities[entry.repo] ?? []).map(id => wiki(`capabilities/${id}`, capabilities.get(id).title))
  const related = allProjects.filter(item => item.repo !== entry.repo && groupOf(item)?.id === group.id).slice(0, 3)
  const body = [
    `${label(entry.kind)}. [Открыть репозиторий](${entry.url}).`,
    `| Проверка | Результат |\n|---|---|\n| Уровень | ${reviewLabels[entry.review_level] ?? entry.review_level} |\n| Дата | ${entry.checked_on ?? reviews.checked_on} |\n| Работа на текущем Avito | ${entry.runtime_verification === "not_run" ? "Не проверялась; проект не запускался" : entry.runtime_verification ?? "Не установлено"} |\n| Фиксация первичных источников | ${entry.head_sha ? `Коммит \`${entry.head_sha}\`` : (entry.source_pinning ?? entry.pinning) === "unavailable" || entry.pinning === "source_unavailable" ? "Источник недоступен" : "Ветка на момент проверки; ссылки могут изменяться"} |`,
    `**Категория:** ${wiki(`categories/${group.id}`, group.title)}.${connections.length ? `\n\n**Возможности по прочитанным материалам:** ${connections.join(" · ")}.` : entry.review_level === "repository_index_only_source_unavailable" ? "\n\nВозможности не установлены: исходники недоступны." : "\n\nФункции и ограничения описаны ниже; дополнительные связи с возможностями не назначены."}`,
    ...[["Как устроено взаимодействие", entry.transport], ["Что читает", entry.reads], ["Что изменяет", entry.writes], ["Оценка и сравнение", entry.scoring], ["Что можно переиспользовать или изучить", entry.parts], ["Ограничения", entry.limits], ["Лицензия", entry.license], ["Зависимости", entry.deps]].filter(([, value]) => value != null).map(([heading, value]) => `## ${heading}\n\n${content(value)}`),
    `## Первичные источники\n\n${(entry.sources ?? []).filter(item => /^https?:\/\//.test(item.url)).map(item => `- [${item.path}](${item.url})`).join("\n") || "Адресные источники не установлены."}\n\nСсылки фиксируют прочитанный контур. Они не заменяют запуск и проверку заявленных функций.`,
    related.length ? `## Рядом в графе\n\n${related.map(projectLink).join(" · ")}\n\n${wiki("research/reuse/index", "Карта переиспользования")} · ${wiki("research/methodology/index", "Уровни доказательств")}` : "",
  ].filter(Boolean).join("\n\n")
  writePage(`${slug(entry.repo)}.md`, entry.repo, body, "research/data/deep-reviews.json", [reviews.adjacent_entries.includes(entry) ? "смежное" : "проекты"])
}

for (const group of [...groups.values(), adjacentGroup]) {
  const members = allProjects.filter(entry => groupOf(entry).id === group.id)
  const table = `| Проект | Роль | Уровень проверки |\n|---|---|---|\n${members.map(entry => `| ${projectLink(entry)} | ${label(entry.kind)} | ${reviewLabels[entry.review_level] ?? entry.review_level} |`).join("\n")}`
  const relevant = [...new Set(members.flatMap(entry => projectCapabilities[entry.repo] ?? []))].map(id => wiki(`capabilities/${id}`, capabilities.get(id).title))
  writePage(`categories/${group.id}.md`, group.title, `${group.description}\n\n${members.length} проектов. Работа на текущем Avito в этой базе не проверялась.\n\n${table}\n\n## Связанные возможности\n\n${relevant.join(" · ")}\n\n${wiki("catalog", "Каталог")} · ${wiki("research/reuse/index", "Карта переиспользования")}`, "research/data/deep-reviews.json", ["категории"])
}
for (const capability of capabilities.values()) {
  const primary = reviews.entries.filter(entry => projectCapabilities[entry.repo]?.includes(capability.id))
  const adjacent = reviews.adjacent_entries.filter(entry => projectCapabilities[entry.repo]?.includes(capability.id))
  const list = entries => entries.map(entry => `- ${projectLink(entry)} — ${label(entry.kind)}.`).join("\n")
  writePage(`capabilities/${capability.id}.md`, capability.title, `${capability.description}\n\nСвязь означает функцию в прочитанном контуре, а не подтверждённую совместимость или готовность к эксплуатации.\n\n## Проекты Avito\n\n${list(primary) || "Нет установленных кандидатов."}${adjacent.length ? `\n\n## Смежные основания\n\n${list(adjacent)}` : ""}\n\n## Что учитывать\n\n${wiki("research/methodology/index", "Метод и границы проверки")} · ${wiki("research/reuse/index", "Переиспользование и пробелы")} · ${wiki("index", "Главная карта")}`, "research/data/deep-reviews.json", ["возможности"])
}

for (const [file, id, title] of noteSpecs) {
  const document = splitDocument(file)
  const links = document.sections.map((section, i) => `- ${wiki(`research/${id}/section-${i + 1}`, section.title)}`).join("\n")
  writePage(`research/${id}/index.md`, title, `${rewriteLinks(document.introduction, file)}\n\n## Разделы\n\n${links}\n\n${wiki("catalog", "Проекты")} · ${wiki("index", "Главная карта")}`, file, ["исследование"])
  document.sections.forEach((section, i) => {
    writePage(`research/${id}/section-${i + 1}.md`, section.title, `${rewriteLinks(section.body, file)}\n\n---\n\n${wiki(`research/${id}/index`, title)} · ${wiki("catalog", "Каталог проектов")}`, file, ["исследование"])
  })
}
for (const [file, destination] of noteDestinations) {
  let body = sources.get(file).toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---\n/)
  let frontTitle
  const noteCheckedOn = frontmatter?.[1].match(/^checked_on:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1] ?? null
  if (frontmatter) {
    const raw = frontmatter[1].match(/^title:\s*(.+)$/m)?.[1]
    if (raw) { try { frontTitle = JSON.parse(raw) } catch { frontTitle = raw.replace(/^['"]|['"]$/g, "") } }
    body = body.slice(frontmatter[0].length)
  }
  const firstHeading = body.match(/^# (.+)$/m)
  const title = frontTitle ?? firstHeading?.[1] ?? path.posix.basename(file, ".md")
  if (firstHeading) body = body.replace(firstHeading[0], "")
  body = rewriteLinks(body, file).replace(/\[\[([^\]|#]+)(#[^\]|]*)?(\|[^\]]*)?\]\]/g, (original, target, anchor = "", alias = "") => {
    const targetPath = path.posix.normalize(path.posix.join(path.posix.dirname(file), target.replace(/\.md$/, "") + ".md"))
    const mapped = documentTargets.get(targetPath)
    return mapped ? `[[${mapped}${anchor}${alias}]]` : original
  })
  writePage(destination + ".md", title, `${body.trim()}\n\n---\n\n${wiki("research/notes/index", "Исследования")} · ${wiki("index", "Главная карта")}`, file, ["исследование"], noteCheckedOn)
}
writePage("research/notes/index.md", "Исследования", `Пополняемые заметки, которые связывают проекты, источники и выводы. Канонические статьи находятся в разделе research/notes репозитория.\n\n${notePaths.length ? notePaths.map(file => { const destination = noteDestinations.get(file); return `- ${wiki(destination, pageEntries.find(entry => entry.destination === destination + ".md").title)}` }).join("\n") : "Новых самостоятельных статей пока нет. Исходная база доступна в разделах ниже."}\n\n## Основания базы\n\n${wiki("research/reuse/index", "Карта переиспользования")} · ${wiki("research/methodology/index", "Метод и лицензии")} · ${wiki("research/reconciliation/index", "Сверка присланного исследования")}\n\n${wiki("catalog", "Каталог проектов")} · ${wiki("index", "Главная карта")}`, "research/methodology.md", ["исследование"])
const catalogIntroduction = sources.get("research/catalog.md").toString("utf8").replace(/^# .*\r?\n+/, "").split(/^## Подробные карточки/m)[0]
writePage("catalog.md", "Каталог проектов", `${rewriteLinks(catalogIntroduction, "research/catalog.md")}\n\n## Смежные проекты\n\n${wiki("categories/adjacent", "Общие инструменты, другие рынки и учебные проекты")}\n\nКаждый отобранный проект вынесен в отдельную заметку графа. ${wiki("registry", "Широкая поисковая выборка")} хранится отдельно.`, "research/catalog.md", ["исследование"])
writePage("registry.md", "Поисковая выборка GitHub", `**${stats.metadata.toLocaleString("ru-RU")} репозиториев по метаданным** на ${reviews.checked_on}. Это поисковая выборка, а не полный список всего open source или подтверждение функций каждой строки.\n\nВ граф вынесены ${stats.projects} подробных карточек и ${stats.adjacent} смежных проектов. Остальные строки остаются в реестре, чтобы карта была читаемой.\n\n## Скачать снимок\n\n- [Широкий реестр CSV](downloads/github-repositories.csv)\n- [Широкий реестр JSON](downloads/github-repositories.json)\n- [Подробные карточки CSV](downloads/deep-reviews.csv)\n- [Подробные карточки JSON](downloads/deep-reviews.json)\n\nВ реестре есть учебные задания, клоны, другие рынки и нерелевантные результаты. Категории по метаданным назначены эвристически; функции не проверены по исходникам.\n\n${wiki("research/methodology/index", "Охват поиска, лицензии и границы")} · ${wiki("catalog", "Отобранные проекты")}`, "research/data/github-repositories.json", ["исследование"])
const researchEntryLinks = [
  ["research/notes/research-map.md", "Карта направлений"],
  ["research/notes/research-conclusions.md", "Основные выводы"],
  ["research/notes/faculty-brief.md", "Для преподавателя"],
].filter(([file]) => noteDestinations.has(file)).map(([file, title]) => wiki(noteDestinations.get(file), title)).join(" · ")
writePage("index.md", "Граф знаний", `**База знаний АВИТОЛОГ** — исследования покупательского помощника, готовые проекты вокруг Avito, первичные источники и условия переиспользования.\n\n${researchEntryLinks ? `${researchEntryLinks}\n\n` : ""}**${stats.projects} подробных карточек** (${stats.source} по выбранным исходникам, ${stats.readme} по README, ${stats.unavailable} недоступный кандидат), **${stats.adjacent} смежных проектов** и **${stats.metadata.toLocaleString("ru-RU")} репозиториев в поисковой выборке**. Проверка карточек: ${reviews.checked_on}.\n\n## По направлениям\n\n${[...groups.values(), adjacentGroup].map(group => `- ${wiki(`categories/${group.id}`, group.title)} — ${group.description}`).join("\n")}\n\n## Что уже умеют проекты\n\n${[...capabilities.values()].map(capability => wiki(`capabilities/${capability.id}`, capability.title)).join(" · ")}\n\n## Исследование\n\n${wiki("research/notes/index", "Исследования")} · ${wiki("catalog", "Каталог")} · ${wiki("research/reuse/index", "Карта переиспользования")} · ${wiki("research/methodology/index", "Метод и лицензии")} · ${wiki("research/reconciliation/index", "Сверка исследования")} · ${wiki("registry", "Реестр и загрузки")}\n\nУзел — проект, направление или исследовательская заметка. Связи показывают категории и функции из прочитанных материалов. Публичность кода не всегда означает разрешение на его перенос. Работа проектов на текущем Avito и точность оценок цены пока не проверялись.`, "research/data/deep-reviews.json", ["исследование"])

for (const [destination, markdown] of pages) {
  for (const match of markdown.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) if (!pages.has(`${match[1]}.md`)) throw new Error(`Unresolved graph link in ${destination}: ${match[1]}`)
}
fs.mkdirSync(output, { recursive: true })
for (const [destination, markdown] of pages) {
  const target = path.join(output, destination)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, markdown)
}
fs.mkdirSync(path.join(output, "downloads"), { recursive: true })
for (const file of permitted.filter(file => /^research\/data\//.test(file))) fs.writeFileSync(path.join(output, "downloads", path.basename(file)), sources.get(file))
for (const asset of conceptAssets) {
  const target = path.join(output, asset.destination)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, sources.get(asset.source))
}
const report = {
  schemaVersion: 1, materials: pageEntries.length, sourceRef, requestedRef: ref,
  sourceMode: workingTree ? "working-tree-preview" : "pinned-git-commit", sourceRepository: sourceBase,
  checkedOn: reviews.checked_on, counts: stats, entries: pageEntries,
  inputs: [...sources].map(([file, bytes]) => ({ path: file, sha256: crypto.createHash("sha256").update(bytes).digest("hex") })),
  downloads: permitted.filter(file => /^research\/data\//.test(file)).map(file => `downloads/${path.basename(file)}`),
  assets: conceptAssets,
}
fs.writeFileSync(path.join(quartz, "knowledge-export.json"), JSON.stringify(report, null, 2) + "\n")
console.log(JSON.stringify({ materials: report.materials, sourceRef, sourceMode: report.sourceMode, counts: stats, downloads: report.downloads.length }))
