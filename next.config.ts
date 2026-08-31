import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["openai", "node-appwrite"],
  outputFileTracingIncludes: {
    "/api/clinical/update": ["./src/clinical-knowledge/**/*.md"],
    "/api/clinical/finalize": ["./src/clinical-knowledge/**/*.md"],
  },
};

export default nextConfig;

