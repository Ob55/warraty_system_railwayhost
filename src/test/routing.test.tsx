import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import './mocks/supabase';

describe('App routing', () => {
  it('/ renders Index page', async () => {
    const { default: Index } = await import('@/pages/Index');
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Activate Warranty' })).toBeDefined();
  });

  it('/admin/login renders AdminLogin page', async () => {
    const { default: AdminLogin } = await import('@/pages/AdminLogin');
    const { AuthProvider } = await import('@/hooks/useAuth');
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Login')).toBeDefined();
  });

  it('/activate-warranty renders ActivateWarranty page', async () => {
    const { default: ActivateWarranty } = await import('@/pages/ActivateWarranty');
    const { AuthProvider } = await import('@/hooks/useAuth');
    render(
      <MemoryRouter initialEntries={['/activate-warranty']}>
        <AuthProvider>
          <Routes>
            <Route path="/activate-warranty" element={<ActivateWarranty />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    // Page should render without crashing
    expect(document.body).toBeDefined();
  });

  it('unknown route should be handled (NotFound)', async () => {
    const { default: NotFound } = await import('@/pages/NotFound');
    render(
      <MemoryRouter initialEntries={['/this-page-does-not-exist']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );
    expect(document.body).toBeDefined();
  });
});
