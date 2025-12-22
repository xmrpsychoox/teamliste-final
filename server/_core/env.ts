export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: "https://teamliste-final.onrender.com",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: "https://teamliste-final.onrender.com",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  masterPassword: process.env.MASTER_PASSWORD ?? "", // <--- DIESE ZEILE HINZUFÜGEN
};
