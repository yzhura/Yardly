import { IsIn, IsString } from "class-validator";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

export class VariantImageSignedUploadDto {
  @IsString()
  @IsIn([...ALLOWED_MIME_TYPES])
  mimeType!: (typeof ALLOWED_MIME_TYPES)[number];
}
