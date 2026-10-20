import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const start = async () => {
  try {
    await connectDatabase(env.MONGODB_URI);
    const server = app.listen(env.PORT, () =>
      console.log(`API listening on port ${env.PORT}`),
    );
    const shutdown = async () => {
      server.close(async () => {
        const { disconnectDatabase } = await import("./config/db.js");
        await disconnectDatabase();
        process.exit(0);
      });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Database connection failed; server was not started.");
    if (env.NODE_ENV !== "production") console.error(error.message);
    process.exit(1);
  }
};
start();
