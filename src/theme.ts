import {createTheme} from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: "#F4641E",
            light: "#f5c6ad",
        },
        secondary: {
            main: "#f5874d",
        },
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 25,
                    textTransform: 'none',
                    fontWeight: 'normal',

                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                markLabel: {
                    fontSize: "10px",
                },
            },
        }
    },
    typography: {
        fontFamily: [
            'Roboto',
            'sans-serif'
        ].join(','),
    },
});
