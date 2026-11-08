import type { Listing } from "./listing.ts";

export function draft(listing: Listing, offer: number | null) {
  if (
    offer !== null &&
    (!Number.isInteger(offer) || offer < 1 || offer > listing.askingPrice)
  ) {
    throw new Error(
      "Предложение должно быть целым числом от 1 до цены объявления",
    );
  }
  const questions = [
    "Какой точный размер рамы и можно ли получить фото маркировки или ссылку на геометрию модели?",
    "Когда обслуживали вилку и трансмиссию, есть ли люфты, трещины или детали, требующие замены?",
  ];
  const price =
    offer === null
      ? ""
      : ` Если размер подойдёт и осмотр подтвердит состояние, готов обсудить покупку за ${offer.toLocaleString("ru-RU")} ₽.`;

  return {
    listingId: listing.id,
    questions,
    offer,
    status: "draft",
    text: `Здравствуйте! Рассматриваю ваш «${listing.title}». ${questions.join(" ")}${price}`,
  };
}
