import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';

function renderIndex() {
  return render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>
  );
}

describe('Index page — homepage', () => {
  it('renders the main heading', () => {
    renderIndex();
    expect(screen.getByRole('heading', { name: 'Activate Warranty' })).toBeDefined();
  });

  it('renders IGNIS branding text', () => {
    renderIndex();
    expect(screen.getByText(/IGNIS Warranty Page/i)).toBeDefined();
  });

  it('has Activate Warranty button linking to /activate-warranty', () => {
    renderIndex();
    const link = screen.getAllByRole('link').find(
      (l) => l.getAttribute('href') === '/activate-warranty'
    );
    expect(link).toBeDefined();
  });

  it('has View My Warranties button linking to /my-warranty', () => {
    renderIndex();
    const link = screen.getAllByRole('link').find(
      (l) => l.getAttribute('href') === '/my-warranty'
    );
    expect(link).toBeDefined();
  });

  it('has Admin Login link to /admin/login', () => {
    renderIndex();
    const link = screen.getAllByRole('link').find(
      (l) => l.getAttribute('href') === '/admin/login'
    );
    expect(link).toBeDefined();
    expect(link?.textContent).toContain('Admin Login');
  });

  it('shows Terms & Policies card', () => {
    renderIndex();
    expect(screen.getByText('Terms & Policies')).toBeDefined();
  });

  it('opens policy dialog when Terms & Policies card is clicked', () => {
    renderIndex();
    const card = screen.getByText('Terms & Policies');
    fireEvent.click(card);
    expect(screen.getByText('IGNIS Innovation — Terms & Policies')).toBeDefined();
  });

  it('policy dialog has agree checkbox', () => {
    renderIndex();
    fireEvent.click(screen.getByText('Terms & Policies'));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
  });

  it('checkbox toggles agreement state', () => {
    renderIndex();
    fireEvent.click(screen.getByText('Terms & Policies'));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });

  it('shows Warranty Information card', () => {
    renderIndex();
    expect(screen.getByText('Warranty Information')).toBeDefined();
  });
});
