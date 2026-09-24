import type { Config } from "@react-router/dev/config";

import { specimens } from "./app/lib/specimens";

export default {
  ssr: false, // no runtime server: static deploy of build/client
  // build-time HTML per URL; the list comes from the data, not from the routes
  async prerender() {
    return ["/", ...specimens.map(({ slug }) => `/specimens/${slug}`)];
  },
  future: {
    // dev: pre-bundle deps from the route modules; otherwise Vite discovers
    // them on first navigation and reloads mid import() (error boundary flash)
    unstable_optimizeDeps: true,
  },
} satisfies Config;
