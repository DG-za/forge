// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RunForm } from '@/features/runs/new/run-form.component';

function renderForm(action = vi.fn()) {
  return render(<RunForm action={action} />);
}

describe('RunForm', () => {
  it('should render repo, epic number, and budget fields', () => {
    renderForm();

    expect(screen.getByLabelText('Repository')).toBeDefined();
    expect(screen.getByLabelText('Epic number')).toBeDefined();
    expect(screen.getByLabelText('Budget (USD)')).toBeDefined();
  });

  it('should render platform and model selects for each role', () => {
    renderForm();

    expect(screen.getByLabelText('Planner platform')).toBeDefined();
    expect(screen.getByLabelText('Planner model')).toBeDefined();
    expect(screen.getByLabelText('Coder platform')).toBeDefined();
    expect(screen.getByLabelText('Coder model')).toBeDefined();
    expect(screen.getByLabelText('Reviewer platform')).toBeDefined();
    expect(screen.getByLabelText('Reviewer model')).toBeDefined();
  });

  it('should have sensible defaults', () => {
    renderForm();

    expect(screen.getByLabelText<HTMLInputElement>('Budget (USD)').value).toBe('10');
    expect(screen.getByLabelText('Planner platform').textContent?.toLowerCase()).toContain('claude');
    expect(screen.getByLabelText('Coder platform').textContent?.toLowerCase()).toContain('openai');
    expect(screen.getByLabelText('Reviewer platform').textContent?.toLowerCase()).toContain('claude');
  });

  it('should update model options when platform changes', async () => {
    renderForm();
    const user = userEvent.setup();

    // Open the coder platform select and pick Claude
    const coderPlatform = screen.getByLabelText('Coder platform');
    await user.click(coderPlatform);
    await user.click(await screen.findByRole('option', { name: 'Claude' }));

    // The coder model trigger should now show a Claude model
    expect(screen.getByLabelText('Coder model').textContent).toContain('claude-');
  });

  it('should render a submit button', () => {
    renderForm();

    expect(screen.getByRole('button', { name: /start run/i })).toBeDefined();
  });

  it('should show error message when action returns error', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'Something went wrong' });
    renderForm(action);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Repository'), 'owner/repo');
    await user.clear(screen.getByLabelText('Epic number'));
    await user.type(screen.getByLabelText('Epic number'), '5');
    await user.click(screen.getByRole('button', { name: /start run/i }));

    expect(await screen.findByText('Something went wrong')).toBeDefined();
  });

  it('should have repo placeholder with owner/name format', () => {
    renderForm();

    expect(screen.getByLabelText<HTMLInputElement>('Repository').placeholder).toBe('owner/repo');
  });
});
