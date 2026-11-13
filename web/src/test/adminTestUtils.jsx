import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../context/I18nContext.jsx';

/**
 * Render an isolated Admin component with the providers used in the real app.
 * The tested component owns its API/auth mocks; no production code is bypassed.
 */
export function renderAdminComponent(component, route = '/admin') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>{component}</I18nProvider>
    </MemoryRouter>
  );
}
