import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.horsemanago2',
  appName: 'HORSEmanago',
  webDir: 'public',
  server: {
    url: 'https://horsemanago.net/welcome',
    allowNavigation: ['*'],
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
  },
  android: {
    backgroundColor: '#000000',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
    },
  },
};

export default config;
