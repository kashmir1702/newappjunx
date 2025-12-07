const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reset cache on every start
config.resetCache = true;

module.exports = config;
