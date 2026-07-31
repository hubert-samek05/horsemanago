import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.horsemanago2',
  appName: 'horsemango.net',
  webDir: 'public',
  server: {
    url: 'https://horsemango.net',
    cleartext: true
  }
};

export default config;
