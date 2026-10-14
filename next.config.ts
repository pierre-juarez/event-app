import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el celular (misma red Wi-Fi).
  allowedDevOrigins: ["192.168.101.10"],
};

export default nextConfig;
