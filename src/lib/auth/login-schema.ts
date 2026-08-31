import { z } from "zod";

const emailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email());

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const recoverBodySchema = z.object({
  email: emailSchema,
});

export const recoverConfirmBodySchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
  password: z.string().min(8).max(256),
});
