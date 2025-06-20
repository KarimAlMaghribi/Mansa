import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: "#0B6B3A",       // tiefes, elegantes Islamgrün
            light: "#a7d7c5",      // sanftes Minzgrün
        },
        secondary: {
            main: "#D4AF37",       // edles Gold für Akzente
        },
        background: {
            default: "#F9F9F6",    // sehr helles Cremeweiß
        },
        text: {
            primary: "#1A1A1A",
            secondary: "#4D4D4D"
        }
    },
    typography: {
        fontFamily: [
            'Poppins', // modern und klar
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
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: 'Poppins, Roboto, "Helvetica Neue", Arial, sans-serif',
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
        MuiSlider: {
            styleOverrides: {
                markLabel: {
                    fontSize: "10px",
                },
            },
        },
    },
});
