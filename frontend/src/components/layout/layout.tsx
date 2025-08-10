import React from "react";
import {Footer} from "./footer";
import {Header} from "./header";
import Container from '@mui/material/Container';

export interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
    return (
        <div className="layout">
            <Header/>
            <Container
                component="main"
                className="main-content"
                maxWidth="lg"
                sx={{px: {xs: 0, sm: 2}}}
            >
                {props.children}
            </Container>
            <Footer />
        </div>
    )
}
