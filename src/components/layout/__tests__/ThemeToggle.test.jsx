import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeProvider } from '../../../contexts/ThemeProvider';
import { I18nProvider } from '../../../i18n';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders toggle button and switches theme on click', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <I18nProvider>
          <ThemeToggle />
        </I18nProvider>
      </ThemeProvider>,
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle night mode/i });
    expect(toggleBtn).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
