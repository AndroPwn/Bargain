const DEV_JWT_SECRET = "dev_secret_change_in_prod";

export function getJwtSecret() {
  return process.env.JWT_SECRET || DEV_JWT_SECRET;
}

export function validateServerEnv() {
  const missing = [];

  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (!process.env.DATABASE_URL) {
    console.warn("[env] DATABASE_URL is not set; pg will use local defaults.");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}
