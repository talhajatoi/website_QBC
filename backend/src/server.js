import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { uploadDirectories, uploadsDirectory } from "./middleware/upload.middleware.js";

const start = async () => {
  try {
    await connectDatabase(env.MONGODB_URI);
    const server = app.listen(env.PORT, () => {
      console.log(`API listening on port ${env.PORT}`);
      console.log("UPLOADS_DIR environment variable:", env.UPLOADS_DIR);
      console.log("Resolved uploads directory:", uploadsDirectory);
      console.log("Product images directory:", uploadDirectories.products);
      console.log("Review images directory:", uploadDirectories.reviews);
      console.log("Category images directory:", uploadDirectories.categories);
    });
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
