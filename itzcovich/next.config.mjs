/** Static export: the site is plain HTML/JS/CSS, deployable on any host (Netlify, Vercel, S3…). */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
