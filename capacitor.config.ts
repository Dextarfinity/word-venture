import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'CapyBuddy',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 4000,
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER',
      showSpinner: false,
      splashImmersive: true,
      layoutName: 'splash'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    }
  }
};

export default config;
