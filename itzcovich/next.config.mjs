/** Static export: the site is plain HTML/JS/CSS, deployable on any host (Netlify, Vercel, S3…). */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // ARTIFACT=1 builds a copy with a placeholder prefix that is rewritten to relative paths
  ...(process.env.ARTIFACT ? { assetPrefix: '/__AP__' } : {}),
};
export default nextConfig;
