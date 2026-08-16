// IMPORTANT — Reanimated 4 (used with SDK 54 in this project) moved its
// worklets transform into a separate `react-native-worklets` package.
// `babel-preset-expo` v54+ auto-detects `react-native-reanimated` and
// injects the correct `react-native-worklets/plugin` for you — so the
// old manual `react-native-reanimated/plugin` line must be REMOVED.
// Leaving it in double-applies the worklets transform and produces
// exactly the "Exception in HostFunction: NativeWorklets" crash.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
