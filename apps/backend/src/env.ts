import { Value } from "@sinclair/typebox/value";
import { t } from "elysia";

const server = t.Object({
  PORT: t.Optional(t.String({ minLength: 1 })),
  DATABASE_URL: t.String({ minLength: 1 }),
  TOKEN_SECRET: t.String({ minLength: 1 }),
  ALGORITHM: t.String({ minLength: 1 }),
  HOSTNAME: t.Optional(t.String({ minLength: 1 }))
});

type ServerEnv = typeof server.static;

const processEnv = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  ALGORITHM: process.env.ALGORITHM,
  HOSTNAME: process.env.HOSTNAME
} satisfies Record<keyof ServerEnv, string | undefined>;

// Don't touch the part below
// --------------------------

let defaultEnv = process.env;

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined";

  let parsed = Value.Check(server, processEnv);

  if (parsed === false) {
    console.error(
      "❌ Invalid environment variables:",
      [...Value.Errors(server, processEnv)].map((error) => ({
        path: error.path,
        value: error.value,
        message: error.message
      }))
    );
    process.exit(1);
  }

  defaultEnv = new Proxy(processEnv, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        );
      return target[prop as keyof typeof target];
    }
  });
}

export const env = defaultEnv as ServerEnv;
