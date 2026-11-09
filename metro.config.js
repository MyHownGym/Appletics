const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// See scripts/metro-asset-vendor-plugin.js (icon fonts on Cloudflare Pages).
config.transformer.assetPlugins = [...(config.transformer.assetPlugins ?? []), require.resolve('./scripts/metro-asset-vendor-plugin.js')];

module.exports = config;
