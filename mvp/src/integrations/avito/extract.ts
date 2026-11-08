// Self-contained for scripting.executeScript: helpers must stay inside this function.
// Reads only item-scoped DOM. No account data, cookies, fetch or mutations.
export function extractVisibleListing() {
  const url = new URL(location.href);
  if (
    !["avito.ru", "www.avito.ru"].includes(url.hostname) ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error("Откройте карточку на avito.ru");
  const itemMatch = url.pathname.match(/^\/(?:[^/]+\/)+[^/]+_(\d{1,30})\/?$/);
  if (
    !itemMatch?.[1] ||
    /^0+$/.test(itemMatch[1]) ||
    /^(profile|brands|users?|messenger|account|login|help|support|web|api)$/.test(
      url.pathname.split("/")[1]?.toLowerCase() || "",
    )
  )
    throw new Error("Нужна отдельная карточка, не выдача или профиль");
  const itemId = itemMatch[1].replace(/^0+(?=\d)/, "");
  const pageState = [
    document.title,
    document.querySelector("h1")?.textContent,
    document.body?.innerText || document.body?.textContent,
  ].join(" ");
  if (
    /доступ\s+ограничен|слишком\s+много\s+запросов|подтвердите,?\s+что\s+вы\s+(?:не\s+робот|человек)|проверка\s+браузера|captcha|объявление\s+(?:не\s+найдено|снято\s+с\s+публикации|больше\s+не\s*доступно|закрыто|завершено)/i.test(
      pageState,
    )
  )
    throw new Error(
      "Карточка недоступна или сайт требует проверку. Снимок не сохранён.",
    );
  const idNodes = [
    ...document.querySelectorAll('[data-marker="item-view/item-id"]'),
  ];
  if (
    !idNodes.length ||
    idNodes.some((node) => {
      const match = node.textContent
        ?.trim()
        .match(/^(?:Объявление\s*)?(?:№\s*)?(\d{1,30})$/);
      return !match?.[1] || match[1].replace(/^0+(?=\d)/, "") !== itemId;
    })
  )
    throw new Error(
      "ID карточки на странице не совпадает с источником. Используйте ручное добавление.",
    );
  const titles = [
    ...document.querySelectorAll('h1[data-marker="item-view/title-info"]'),
  ];
  const title = titles.length === 1 ? titles[0]?.textContent?.trim() || "" : "";
  if (!title)
    throw new Error(
      "Не удалось подтвердить заголовок карточки. Используйте ручное добавление.",
    );
  let priceNodes = [
    ...document.querySelectorAll('[data-marker="item-view/item-price"]'),
  ];
  if (!priceNodes.length)
    priceNodes = [
      ...document.querySelectorAll(
        '[data-marker="item-view/item-price-container"]',
      ),
    ];
  if (!priceNodes.length)
    throw new Error(
      "Не удалось подтвердить цену карточки. Используйте ручное добавление.",
    );
  const prices = priceNodes.map((node) => {
    const text = (node.textContent || "")
      .replace(/[\u00a0\u202f]/g, " ")
      .trim();
    const match = text.match(/^(\d+|\d{1,3}(?: \d{3})+)\s*(?:₽|руб\.?|RUB)$/i);
    if (!match?.[1])
      throw new Error(
        "Нужна одна целая цена в рублях. Копейки, диапазоны и несколько сумм требуют ручного ввода.",
      );
    const price = Number(match[1].replace(/ /g, ""));
    if (!Number.isSafeInteger(price) || price < 1 || price > 100000000)
      throw new Error("Цена карточки вне допустимого диапазона");
    const metadata = [
      node,
      ...node.querySelectorAll('[itemprop="price"]'),
    ].filter((element) => element.getAttribute("itemprop") === "price");
    for (const element of metadata) {
      const value = element.getAttribute("content");
      if (value !== null && (!/^\d+$/.test(value) || Number(value) !== price))
        throw new Error(
          "Цена содержит копейки или противоречивые значения. Используйте ручное добавление.",
        );
    }
    return price;
  });
  if (prices.some((price) => price !== prices[0]))
    throw new Error(
      "На карточке несколько разных цен. Используйте ручное добавление.",
    );
  const askingPrice = prices[0]!;
  const description =
    document
      .querySelector('[data-marker="item-view/item-description"]')
      ?.textContent?.trim() || "";
  const specs =
    document
      .querySelector('[data-marker="item-view/item-params"]')
      ?.textContent?.trim() || "";
  return {
    itemId,
    title,
    askingPrice,
    sourceUrl: "https://www.avito.ru" + url.pathname.replace(/\/$/, ""),
    rawText: [title, description, specs].join("\n\n").slice(0, 18000),
  };
}
