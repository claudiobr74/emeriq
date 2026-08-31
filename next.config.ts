import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["openai", "node-appwrite"],
  outputFileTracingIncludes: {
    "/api/clinical/update": ["./src/clinical-knowledge/**/*.md"],
    "/api/clinical/finalize": ["./src/clinical-knowledge/**/*.md"],
  },
};

export default nextConfig;

