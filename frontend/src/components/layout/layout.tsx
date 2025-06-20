import React from "react";
import {Footer} from "./footer";
import {Header} from "./header";

export interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
    return (
        <div className="layout">
            <Header/>
            <main className="main-content">
                {props.children}
            </main>
            <Footer />
        </div>
    )
}
