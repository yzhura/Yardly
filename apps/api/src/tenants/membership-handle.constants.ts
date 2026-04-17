/** Canonical stored handle: lowercase Latin, digits, underscore; starts with a letter; length 3–32. */
export const MEMBERSHIP_HANDLE_STORED_REGEX = /^[a-z][a-z0-9_]{2,31}$/;

/**
 * Client input before lowercasing (DTO `@Matches`). Length bounds are enforced separately
 * with `@MinLength` / `@MaxLength`.
 */
export const MEMBERSHIP_HANDLE_INPUT_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const MEMBERSHIP_HANDLE_MIN_LENGTH = 3;
export const MEMBERSHIP_HANDLE_MAX_LENGTH = 32;

/** Max length for auto-generated handles (`user` + suffix). */
export const MEMBERSHIP_HANDLE_GENERATED_MAX_LENGTH = 12;
