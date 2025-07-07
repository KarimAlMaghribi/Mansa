import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {store} from "./store/store";
import {Provider} from "react-redux";
import {ThemeProvider, useMediaQuery} from "@mui/material";
import {getTheme} from "./theme";
import "./index.scss";
import {BrowserRouter} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./i18n";

const AppWrapper = () => {
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = React.useMemo(() => getTheme(prefersDark), [prefersDark]);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <AuthProvider>
                        <App/>
                    </AuthProvider>
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(<AppWrapper />);


