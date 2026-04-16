import { IsIn, IsString } from "class-validator";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export class MaterialImageSignedUploadDto {
  @IsString()
  @IsIn([...ALLOWED_MIME_TYPES])
  mimeType!: (typeof ALLOWED_MIME_TYPES)[number];
}

