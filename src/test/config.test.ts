import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('vercel.json — SPA routing config', () => {
  const raw = readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8');
  const config = JSON.parse(raw);

  it('exists and is valid JSON', () => {
    expect(config).toBeDefined();
  });

  it('has rewrites array', () => {
    expect(Array.isArray(config.rewrites)).toBe(true);
    expect(config.rewrites.length).toBeGreaterThan(0);
  });

  it('rewrites all routes to /index.html (SPA fix)', () => {
    const rewrite = config.rewrites[0];
    expect(rewrite.source).toBe('/(.*)');
    expect(rewrite.destination).toBe('/index.html');
  });
});

describe('QR Code URL', () => {
  it('AdminDashboard points to Vercel URL not Lovable', () => {
    const source = readFileSync(
      resolve(__dirname, '../pages/AdminDashboard.tsx'),
      'utf-8'
    );
    expect(source).toContain('warraty-system-railwayhost.vercel.app');
    expect(source).not.toContain('warrantystem.lovable.app');
  });
});

describe('Environment config', () => {
  it('.env has required Supabase keys', () => {
    const env = readFileSync(resolve(__dirname, '../../.env'), 'utf-8');
    expect(env).toContain('VITE_SUPABASE_URL');
    expect(env).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    expect(env).toContain('https://');
  });
});
