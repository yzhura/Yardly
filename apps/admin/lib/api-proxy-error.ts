import { NextResponse } from "next/server";

/** Nest `ValidationPipe` often returns `message` as a string array; we normalize to one UA code. */
const VALIDATION_FAILED_CODE = "validation_failed";

const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Auth / membership
  not_a_member_of_tenant: "Ви не є учасником цієї організації.",
  membership_deactivated: "Ваш доступ до організації деактивовано.",
  insufficient_role_to_manage_materials: "У вас немає прав для керування матеріалами.",
  insufficient_role_to_manage_colors: "У вас немає прав для керування кольорами.",
  insufficient_role_to_manage_attributes: "У вас немає прав для керування характеристиками.",

  // Materials / categories / colors
  category_not_found: "Категорію не знайдено.",
  material_not_found: "Матеріал не знайдено.",
  color_not_found: "Колір не знайдено.",
  material_sku_already_exists: "Матеріал з таким артикулом вже існує.",
  material_category_name_already_exists: "Категорія з такою назвою вже існує.",
  color_already_exists: "Колір з такою назвою або HEX вже існує.",

  // Attributes
  attribute_definition_not_found: "Характеристику не знайдено.",
  attribute_value_not_found: "Значення характеристики не знайдено.",
  attribute_definition_already_exists: "Характеристика з такою назвою вже існує.",
  attribute_value_already_exists: "Таке значення характеристики вже існує.",
  invalid_attribute_name: "Некоректна назва характеристики.",
  invalid_attribute_value_name: "Некоректна назва значення характеристики.",
  no_updates: "Немає змін для збереження.",

  // Storage
  invalid_mime_type: "Непідтримуваний формат файлу.",
  create_signed_upload_url_failed: "Не вдалося підготувати завантаження.",

  [VALIDATION_FAILED_CODE]: "Перевірте введені дані.",
};

function isSnakeCaseAppCode(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value) && value.length < 96;
}

async function readJsonPayload(response: Response): Promise<Record<string, unknown> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

export async function handleApiProxyError(response: Response, fallbackUaMessage: string) {
  const payload = await readJsonPayload(response);
  if (!payload) {
    return NextResponse.json({ message: fallbackUaMessage }, { status: response.status });
  }

  const message = payload.message;

  if (Array.isArray(message) && message.some((x) => typeof x === "string" && String(x).trim().length > 0)) {
    return NextResponse.json(
      {
        message: ERROR_MESSAGE_MAP[VALIDATION_FAILED_CODE],
        code: VALIDATION_FAILED_CODE,
      },
      { status: response.status },
    );
  }

  if (typeof message === "string") {
    const trimmed = message.trim();
    if (trimmed && ERROR_MESSAGE_MAP[trimmed]) {
      return NextResponse.json(
        { message: ERROR_MESSAGE_MAP[trimmed], code: trimmed },
        { status: response.status },
      );
    }
    if (trimmed && isSnakeCaseAppCode(trimmed)) {
      return NextResponse.json(
        { message: fallbackUaMessage, code: trimmed },
        { status: response.status },
      );
    }
  }

  const errorField = typeof payload.error === "string" ? payload.error.trim() : "";
  if (errorField && errorField !== "Bad Request") {
    return NextResponse.json(
      { message: fallbackUaMessage, code: errorField },
      { status: response.status },
    );
  }

  return NextResponse.json({ message: fallbackUaMessage }, { status: response.status });
}
