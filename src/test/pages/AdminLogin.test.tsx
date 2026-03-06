import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../test/mocks/supabase';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import AdminLogin from '@/pages/AdminLogin';
import { AuthProvider } from '@/hooks/useAuth';

function renderAdminLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminLogin />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AdminLogin page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the Admin Login heading', async () => {
    renderAdminLogin();
    await waitFor(() => {
      expect(screen.getByText('Admin Login')).toBeDefined();
    });
  });

  it('renders email and password inputs', async () => {
    renderAdminLogin();
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeDefined();
      expect(screen.getByLabelText(/password/i)).toBeDefined();
    });
  });

  it('renders Sign In button', async () => {
    renderAdminLogin();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
    });
  });

  it('renders Back button linking to home', async () => {
    renderAdminLogin();
    await waitFor(() => {
      const backLink = screen.getAllByRole('link').find(
        (l) => l.getAttribute('href') === '/'
      );
      expect(backLink).toBeDefined();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderAdminLogin();
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeDefined();
    });
  });

  it('shows validation error for short password', async () => {
    renderAdminLogin();
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeDefined();
    });
  });

  it('calls signIn with credentials on valid submit', async () => {
    const { mockSupabase } = await import('../mocks/supabase');
    renderAdminLogin();
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@ignis.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@ignis.com',
        password: 'password123',
      });
    });
  });

  it('shows error message on failed login', async () => {
    const { mockSupabase } = await import('../mocks/supabase');
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: new Error('Invalid credentials'),
    });

    renderAdminLogin();
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@ignis.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeDefined();
    });
  });
});
