import { createTheme } from '@mui/material/styles';

/**
 * Create the MUI theme used across the application. Older parts of the code
 * expect a `buildTheme` export, so we expose both `getTheme` and
 * `buildTheme` as aliases to maintain backwards compatibility.
 */
export const getTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0B6B3A',
        light: '#a7d7c5',
      },
      secondary: {
        main: '#D4AF37',
      },
      background: {
        default: darkMode ? '#121212' : '#F9F9F6',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#1A1A1A',
        secondary: darkMode ? '#cccccc' : '#4D4D4D',
      },
    },
    shape: {
      borderRadius: 0,
    },
    typography: {
      fontFamily: [
        'Poppins',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 24,
            textTransform: 'none',
            fontWeight: 500,
            paddingLeft: 20,
            paddingRight: 20,
            transition: 'background-color .3s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 0,
          },
        },
      },
    },
  });

export const buildTheme = getTheme;
