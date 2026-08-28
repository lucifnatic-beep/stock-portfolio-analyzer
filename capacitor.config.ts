import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stockpulse.app',
  appName: 'StockPulse AI',
  webDir: 'out',
  server: {
    url: 'https://stock-portfolio-analyzer-djgd.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
