import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { Music, Zap, Server, Route, Shield, Waves, Sparkles } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const handleApiCall = async () => {
    setIsLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/music");
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };
  const features = [{
    icon: /* @__PURE__ */ jsx(Zap, { className: "w-12 h-12 text-cyan-400" }),
    title: "Powerful Server Functions",
    description: "Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple."
  }, {
    icon: /* @__PURE__ */ jsx(Server, { className: "w-12 h-12 text-cyan-400" }),
    title: "Flexible Server Side Rendering",
    description: "Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where."
  }, {
    icon: /* @__PURE__ */ jsx(Route, { className: "w-12 h-12 text-cyan-400" }),
    title: "API Routes",
    description: "Build type-safe API endpoints alongside your application. No separate backend needed."
  }, {
    icon: /* @__PURE__ */ jsx(Shield, { className: "w-12 h-12 text-cyan-400" }),
    title: "Strongly Typed Everything",
    description: "End-to-end type safety from server to client. Catch errors before they reach production."
  }, {
    icon: /* @__PURE__ */ jsx(Waves, { className: "w-12 h-12 text-cyan-400" }),
    title: "Full Streaming Support",
    description: "Stream data from server to client progressively. Perfect for AI applications and real-time updates."
  }, {
    icon: /* @__PURE__ */ jsx(Sparkles, { className: "w-12 h-12 text-cyan-400" }),
    title: "Next Generation Ready",
    description: "Built from the ground up for modern web applications. Deploy anywhere JavaScript runs."
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative py-20 px-6 text-center overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" }),
      /* @__PURE__ */ jsxs("div", { className: "relative max-w-5xl mx-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-6 mb-6", children: [
          /* @__PURE__ */ jsx("img", { src: "/tanstack-circle-logo.png", alt: "TanStack Logo", className: "w-24 h-24 md:w-32 md:h-32" }),
          /* @__PURE__ */ jsxs("h1", { className: "text-6xl md:text-7xl font-bold text-white", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "TANSTACK" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent", children: "START" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl md:text-3xl text-gray-300 mb-4 font-light", children: "The framework for next generation AI applications" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-400 max-w-3xl mx-auto mb-8", children: "Full-stack framework powered by TanStack Router for React and Solid. Build modern applications with server functions, streaming, and type safety." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: handleApiCall, disabled: isLoading, className: "px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 disabled:opacity-50", children: [
            /* @__PURE__ */ jsx(Music, { className: "w-4 h-4 mr-2" }),
            isLoading ? "Calling API..." : "Test Music API"
          ] }),
          response && /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-slate-800 rounded-lg max-w-2xl w-full", children: /* @__PURE__ */ jsx("pre", { className: "text-sm text-gray-300 whitespace-pre-wrap", children: response }) }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mt-2", children: "Test the music API endpoint by clicking the button above" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-6 max-w-7xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: features.map((feature, index) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: feature.icon }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-white mb-3", children: feature.title }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-400 leading-relaxed", children: feature.description })
    ] }, index)) }) })
  ] });
}

export { App as component };
//# sourceMappingURL=index-CUThHa4v.mjs.map
