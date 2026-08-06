import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.horsemanago2',
  appName: 'horsemanago.net',
  webDir: 'dist',
  // Add iOS-specific settings
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    // Add WKWebView configuration
    backgroundColor: '#000000'
  },
  // Add plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#ffffff'
    },
    // Add Capacitor HTTP plugin for better network handling
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
