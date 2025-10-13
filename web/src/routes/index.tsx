import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Zap,
  Server,
  Route as RouteIcon,
  Shield,
  Waves,
  Sparkles,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bot-api"],
    queryFn: async () => {
      const res = await fetch("/api/bot");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: false, // Don't auto-fetch, only when button is clicked
  });

  const features = [
    {
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      title: "Powerful Server Functions",
      description:
        "Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.",
    },
    {
      icon: <Server className="w-12 h-12 text-cyan-400" />,
      title: "Flexible Server Side Rendering",
      description:
        "Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.",
    },
    {
      icon: <RouteIcon className="w-12 h-12 text-cyan-400" />,
      title: "API Routes",
      description:
        "Build type-safe API endpoints alongside your application. No separate backend needed.",
    },
    {
      icon: <Shield className="w-12 h-12 text-cyan-400" />,
      title: "Strongly Typed Everything",
      description:
        "End-to-end type safety from server to client. Catch errors before they reach production.",
    },
    {
      icon: <Waves className="w-12 h-12 text-cyan-400" />,
      title: "Full Streaming Support",
      description:
        "Stream data from server to client progressively. Perfect for AI applications and real-time updates.",
    },
    {
      icon: <Sparkles className="w-12 h-12 text-cyan-400" />,
      title: "Next Generation Ready",
      description:
        "Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src="/tanstack-circle-logo.png"
              alt="TanStack Logo"
              className="w-24 h-24 md:w-32 md:h-32"
            />
            <h1 className="text-6xl md:text-7xl font-bold text-white">
              <span className="text-gray-300">TANSTACK</span>{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                START
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            The framework for next generation AI applications
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Full-stack framework powered by TanStack Router for React and Solid.
            Build modern applications with server functions, streaming, and type
            safety.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 disabled:opacity-50"
            >
              <Music className="w-4 h-4 mr-2" />
              {isLoading ? "Calling API..." : "Test Music API"}
            </Button>
            {data && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg max-w-2xl w-full">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-800 rounded-lg max-w-2xl w-full">
                <pre className="text-sm text-red-300 whitespace-pre-wrap">Error: {error.message}</pre>
              </div>
            )}
            <p className="text-gray-400 text-sm mt-2">
              Test the music API endpoint by clicking the button above
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
