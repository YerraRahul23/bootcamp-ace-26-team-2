import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardStatCard from './DashboardStatCard';

function TestIcon() {
  return <svg data-testid="icon" />;
}

describe('DashboardStatCard', () => {
  it('renders the label and value when a value is provided', () => {
    render(
      <DashboardStatCard
        icon={TestIcon}
        label="Active Cases"
        value={12}
        gradient="from-blue-500 to-cyan-500"
      />,
    );

    expect(screen.getByText('Active Cases')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders a placeholder when the value is missing', () => {
    render(
      <DashboardStatCard
        icon={TestIcon}
        label="Pending Review"
        value={null}
        gradient="from-amber-500 to-orange-500"
      />,
    );

    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });
});
