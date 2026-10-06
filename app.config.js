// Meta App IDs are public identifiers. Pin the customer app to its own data
// source so a stale EAS/local environment variable cannot redirect events.
const META_APP_ID = '1418140699648008';
const META_CLIENT_TOKEN = process.env.SCOOBYZ_CUSTOMER_META_CLIENT_TOKEN;
const META_CONFIGURED = Boolean(META_APP_ID && META_CLIENT_TOKEN);
const LEGACY_GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ANDROID_API_KEY =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY || LEGACY_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_IOS_API_KEY =
  process.env.GOOGLE_MAPS_IOS_API_KEY || LEGACY_GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android?.config || {}),
      ...(GOOGLE_MAPS_ANDROID_API_KEY
        ? { googleMaps: { apiKey: GOOGLE_MAPS_ANDROID_API_KEY } }
        : {}),
    },
  },
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config || {}),
      ...(GOOGLE_MAPS_IOS_API_KEY
        ? { googleMapsApiKey: GOOGLE_MAPS_IOS_API_KEY }
        : {}),
    },
  },
  plugins: [
    ...(config.plugins || []),
    ...(META_CONFIGURED
      ? [[
          'react-native-fbsdk-next',
          {
            appID: META_APP_ID,
            clientToken: META_CLIENT_TOKEN,
            displayName: 'Scoobyz',
            scheme: `fb${META_APP_ID}`,
            autoLogAppEventsEnabled: true,
            advertiserIDCollectionEnabled: true,
            isAutoInitEnabled: true,
            iosUserTrackingPermission:
              'Allow Scoobyz to measure advertising performance and show relevant advertisements.',
          },
        ]]
      : []),
  ],
  extra: {
    ...(config.extra || {}),
    metaSdkConfigured: META_CONFIGURED,
  },
});
