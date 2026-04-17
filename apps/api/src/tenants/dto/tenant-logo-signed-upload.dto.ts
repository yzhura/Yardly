import { IsIn, IsString } from "class-validator";

const MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export class TenantLogoSignedUploadDto {
  @IsString()
  @IsIn(MIME_TYPES)
  mimeType!: (typeof MIME_TYPES)[number];
}
