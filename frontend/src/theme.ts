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
        main: '#0B6B3A', // tiefes, elegantes Islamgrün
        light: '#a7d7c5', // sanftes Minzgrün
      },
      secondary: {
        main: '#D4AF37', // edles Gold für Akzente
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
      borderRadius: 16,
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
            borderRadius: 16,
          },
        },
      },
    },
  });

// Temporary alias for compatibility with older imports. Can be removed once all
// usages have been migrated to `getTheme`.
export const buildTheme = getTheme;
