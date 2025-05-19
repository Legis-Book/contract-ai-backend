import { test, expect } from '@playwright/test';

// Simple check that /templates endpoint is reachable

test('should get templates list', async ({ request }) => {
  const response = await request.get('/api/v1/templates');
  expect(response.ok()).toBeTruthy();
});
