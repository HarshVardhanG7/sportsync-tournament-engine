import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export function hashPassword(password: string) {
  return bcrypt.hash(password, env.bcryptSaltRounds);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
