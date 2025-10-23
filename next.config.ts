/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // força o Next a servir imagens locais diretamente
  },
  experimental: {
    turbo: {
      rules: {
        "*.png": ["asset/resource"], // corrige o bug do Turbopack com PNGs locais
      },
    },
  },
};

export default nextConfig;
