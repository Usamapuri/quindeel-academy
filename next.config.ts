import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Course-description images are stored inline (downscaled data URLs), so the
    // saveContent server action can receive payloads larger than the 1MB default.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
