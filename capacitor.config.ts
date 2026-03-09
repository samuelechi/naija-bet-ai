import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.naijabetai.app',
  appName: 'NaijaBetAI',
  webDir: 'out',
  server: {
    url: 'https://naija-bet-ai.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
