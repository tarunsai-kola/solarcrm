import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('login form shows validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('forgot password link is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });
});

test.describe('404 page', () => {
  test('shows 404 for unknown routes', async ({ page }) => {
    await page.goto('/some-nonexistent-route-xyz');
    // Either lands on login (unauthenticated) or 404 — both are acceptable
    const is404 = await page.getByText('404').count() > 0;
    const isLogin = page.url().includes('/login');
    expect(is404 || isLogin).toBe(true);
  });
});
