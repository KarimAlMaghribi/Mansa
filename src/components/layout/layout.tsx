import React from "react";
import {Footer} from "./footer";
import {Header} from "./header";

export interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
    return (
        <React.Fragment>
            <Header/>
                {props.children}
            <Footer />
        </React.Fragment>
    )
}
