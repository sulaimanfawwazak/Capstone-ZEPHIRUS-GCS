/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-flight-indicators'],
  webpack: (config) => {
    // Remove existing SVG rules
    config.module.rules = config.module.rules.map(rule => {
      if (rule.test && rule.test.toString().includes('svg')) {
        return {
          ...rule,
          test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
        };
      }
      return rule;
    });

    // Handle SVGs as static assets
    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 8192, // 8kb
        },
      },
      generator: {
        filename: 'static/images/[hash][ext][query]'
      }
    });

    return config;
  },
};

export default nextConfig;