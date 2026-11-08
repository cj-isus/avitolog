import { BundleSchema, type Bundle } from "../domain/transfer.ts";

const MAX_IMPORT_BYTES = 5_000_000;

export async function readWorkspaceFile(
  file: Pick<File, "size" | "text">,
): Promise<unknown> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("Файл больше 5 МБ");
  return JSON.parse(await file.text()) as unknown;
}

export function downloadWorkspace(input: Bundle): void {
  const data = BundleSchema.parse(input);
  const objectUrl = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  let link: HTMLAnchorElement | undefined;
  try {
    link = document.createElement("a");
    link.href = objectUrl;
    link.download = "avitolog-workspace.json";
    document.body.append(link);
    link.click();
  } finally {
    link?.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  }
}
