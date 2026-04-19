import { NextResponse } from "next/server";

/** Nest `ValidationPipe` often returns `message` as a string array; we normalize to one UA code. */
const VALIDATION_FAILED_CODE = "validation_failed";

const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Auth / membership
  not_a_member_of_tenant: "Ви не є учасником цієї організації.",
  membership_deactivated: "Ваш доступ до організації деактивовано.",
  membership_handle_taken: "Цей псевдонім (@handle) уже зайнятий в організації.",
  invalid_membership_handle: "Некоректний формат псевдоніма (@handle).",
  tenant_id_required_for_handle:
    "Оберіть активну організацію або оновіть сторінку та спробуйте ще раз.",
  cannot_update_handle_of_deactivated_member:
    "Неможливо змінити псевдонім для деактивованого доступу.",
  cannot_change_other_member_handle: "Можна змінювати лише свій псевдонім.",
  insufficient_role_to_manage_materials: "У вас немає прав для керування матеріалами.",
  insufficient_role_to_manage_colors: "У вас немає прав для керування кольорами.",
  insufficient_role_to_manage_attributes: "У вас немає прав для керування характеристиками.",
  insufficient_role_to_manage_products: "У вас немає прав для керування товарами.",

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

  // Products
  product_not_found: "Товар не знайдено.",
  product_variant_not_found: "Варіант товару не знайдено.",
  product_variant_sku_already_exists: "Варіант з таким артикулом (SKU) уже існує.",
  attribute_value_invalid_scope: "Це значення характеристики не можна використовувати для товарів.",
  duplicate_attribute_definition_on_variant: "Для варіанта обрано кілька значень однієї характеристики.",
  duplicate_attribute_value_ids: "Одне й те саме значення характеристики передано двічі.",
  cannot_archive_last_product_variant: "Неможливо архівувати останній варіант товару.",
  product_create_failed: "Не вдалося створити товар.",
  product_update_failed: "Не вдалося оновити товар.",
  product_variant_create_failed: "Не вдалося створити варіант товару.",
  product_variant_update_failed: "Не вдалося оновити варіант товару.",
  unsupported_mime:
    "Непідтримуваний тип зображення (JPEG, PNG, WebP, HEIC/HEIF з пристроїв Apple).",
  product_image_upload_unavailable:
    "Завантаження фото товару недоступне. Перевірте bucket, префікс і змінні SUPABASE_PRODUCTS_* на API.",
  invalid_product_image_paths: "Некоректні шляхи до зображень товару.",
  duplicate_product_image_paths: "Один і той самий файл зображення вказано двічі.",
  too_many_product_images: "Занадто багато зображень для одного товару.",
  variant_images_require_draft_session:
    "Для фото варіантів при створенні товару потрібна сесія завантаження (оновіть сторінку та спробуйте ще раз).",
  too_many_variant_images: "Занадто багато зображень для одного варіанту.",
  duplicate_variant_image_paths: "Один і той самий файл зображення вказано двічі для варіанту.",
  invalid_variant_image_paths: "Некоректні шляхи до зображень варіанту.",
  invalid_draft_session_id: "Некоректний ідентифікатор сесії завантаження. Оновіть сторінку та спробуйте ще раз.",
  invalid_draft_product_id: "Некоректний ідентифікатор товару для чернетки зображення.",
  invalid_variant_id: "Некоректний ідентифікатор варіанту.",
  invalid_product_id: "Некоректний ідентифікатор товару.",
  catalog_not_found: "Каталог не знайдено.",
  duplicate_catalog_ids: "Один і той самий каталог обрано двічі.",
  product_requires_at_least_one_catalog: "Оберіть хоча б один каталог для товару.",

  // Catalogs
  invalid_catalog_name: "Некоректна назва каталогу.",
  catalog_slug_already_exists: "Каталог з таким ідентифікатором (slug) уже існує.",
  cannot_archive_catalog_would_orphan_products:
    "Неможливо архівувати каталог: у деяких товарів він єдиний.",
  catalog_create_failed: "Не вдалося створити каталог.",
  catalog_update_failed: "Не вдалося оновити каталог.",

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
