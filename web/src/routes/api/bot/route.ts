import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start"

export const Route = createFileRoute("/api/bot")({
  server: {
    handlers: {
      GET: async () => {
        return json({
          ok: true,
          message: "Bot API route is working!",
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});
