const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const defaultConfig = getDefaultConfig(projectRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;

const customConfig = {
  cacheVersion: 'mobile-app',
  projectRoot,
  watchFolders: [workspaceRoot],
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: true,
  },
};

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  debug: false,
  extensions: [],
  watchFolders: [workspaceRoot],
});
