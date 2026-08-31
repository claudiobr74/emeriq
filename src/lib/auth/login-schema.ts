import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const recoverBodySchema = z.object({
  email: z.email(),
});

export const recoverConfirmBodySchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
  password: z.string().min(8).max(256),
});
