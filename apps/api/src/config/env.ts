import "dotenv/config";

export const env = {
  apiPort: Number(process.env.API_PORT ?? 4000),
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET ?? "dev-access-token-secret",
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenExpiresInDays: 7,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
};
