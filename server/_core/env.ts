export const ENV = {
  appId: process.env.VITE_APP_ID ?? "dummy-app-id",
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-key-12345678",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "http://localhost:3000",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
