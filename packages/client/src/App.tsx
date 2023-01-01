import { useRoutes } from 'react-router-dom';
import routes from './router';
import { SnackbarProvider } from 'notistack';
import useScrollTop from 'src/hooks/useScrollTop';

import ThemeProvider from './theme/ThemeProvider';
import { CssBaseline } from '@mui/material';

import { SnackbarUtilsConfigurator } from './utils/snackbarUtils';

const App = () => {

  const content = useRoutes(routes);
  useScrollTop();

  return (
    <ThemeProvider>
        <SnackbarProvider
          maxSnack={6}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <SnackbarUtilsConfigurator/>

          <CssBaseline />
          {content}

        </SnackbarProvider>
    </ThemeProvider>
  );
}
export default App;
