import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function renderWithProviders(
  ui: ReactNode,
  {
    route = '/',
    queryClientOptions,
  }: { route?: string; queryClientOptions?: ConstructorParameters<typeof QueryClient>[0] } = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    ...queryClientOptions,
  });

  // lazy import to avoid circulars in tests
  const { render } = require('@testing-library/react') as typeof import('@testing-library/react');

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}
