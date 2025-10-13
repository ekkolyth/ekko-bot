import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/music/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const botApi: string = "http://localhost:1337/api/music";
        const response = await fetch(botApi, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response;
      },
    },
  },
});
