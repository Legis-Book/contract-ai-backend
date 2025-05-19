import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.APP_PORT || 3000}`,
  },
});
