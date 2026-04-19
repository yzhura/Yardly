import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

export class VariantDraftImageSignedUploadDto {
  @IsString()
  @IsIn([...ALLOWED_MIME_TYPES])
  mimeType!: (typeof ALLOWED_MIME_TYPES)[number];

  /** `new` — створення товару (шлях `vd/n/{sessionId}/…`); `product` — новий варіант у вже існуючого (`vd/p/{productId}/…`). */
  @IsString()
  @IsIn(["new", "product"])
  draftKind!: "new" | "product";

  @ValidateIf((o: VariantDraftImageSignedUploadDto) => o.draftKind === "new")
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sessionId?: string;

  @ValidateIf((o: VariantDraftImageSignedUploadDto) => o.draftKind === "product")
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  productId?: string;
}
