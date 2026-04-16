import { IsIn, IsString } from "class-validator";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export class AvatarSignedUploadDto {
  @IsString()
  @IsIn([...ALLOWED_MIME])
  mimeType!: (typeof ALLOWED_MIME)[number];
}
