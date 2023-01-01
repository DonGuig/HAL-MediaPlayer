import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { themeCreator } from './base';
// import { StylesProvider } from '@mui/core/style';
// import { CacheProvider } from '@emotion/react';
// import createCache from '@emotion/cache';
// import stylisRTLPlugin from 'stylis-plugin-rtl';

// const cacheRtl = createCache({
//   key: 'bloom-ui',
// prepend: true,
//   // @ts-ignore
//   stylisPlugins: [stylisRTLPlugin]
// });

export const ThemeContext = React.createContext(
  (themeName: string): void => { }
);

const ThemeProviderWrapper = (props) => {
  const curThemeName = 'AquaLumTheme';
  const [themeName, _setThemeName] = useState(curThemeName);
  const theme = themeCreator(themeName);
  const setThemeName = (themeName: string): void => {
    // localStorage.setItem('appTheme', themeName);
    _setThemeName(themeName);
  };

  return (
    // <StylesProvider injectFirst>
    //   {/* <CacheProvider value={cacheRtl}> */}
      <ThemeContext.Provider value={setThemeName}>
        <ThemeProvider theme={theme}>{props.children}</ThemeProvider >
      </ThemeContext.Provider>
    //   {/* </CacheProvider>
    // </StylesProvider> */}
  );
};

export default ThemeProviderWrapper;
