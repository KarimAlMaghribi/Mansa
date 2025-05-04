import React from 'react';

import {Navigate, Route, Routes} from "react-router-dom";
import {Landing} from "./pages/landing/landing";
import {SignIn} from "./pages/authentication/sign-in";
import {SignUp} from "./pages/authentication/sign-up";
import {ForgotPassword} from "./pages/authentication/forgot-password";
import {RiskOverview} from "./pages/risk-overview/risk-overview";
import {Layout} from "./components/layout/layout";
import {Legal} from "./pages/formalities/legal";
import {Privacy} from "./pages/formalities/privacy";
import {Imprint} from "./pages/formalities/imprint";
import {About} from "./pages/about/about";
import {Catalog} from "./pages/catalog/catalog";
import {Account} from "./pages/account/account";
import {Investors} from "./pages/investors/investors";
import {Chat} from "./pages/chat/chat";
import {Profile} from "./pages/profile/profile";
import {Settings} from "@mui/icons-material";
import {ROUTES} from "./routing/routes";
import {PrivateRoute} from "./routing/private-route";
import {MyRisks} from "./pages/my-risks/my-risks";
import {MyBids} from "./pages/my-bids/my-bids";

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Landing/>}/>
                <Route path={`/${ROUTES.SIGN_IN}`} element={<SignIn/>}/>
                <Route path={`/${ROUTES.SIGN_UP}`} element={<SignUp/>}/>
                <Route path={`/${ROUTES.FORGOT_PASSWORD}`} element={<ForgotPassword/>}/>
                <Route path={`/${ROUTES.ABOUT}`} element={<About />}/>
                <Route path={`/${ROUTES.CHAT}`} element={<PrivateRoute><Chat /></PrivateRoute>}/>
                <Route path={`/${ROUTES.CATALOG}`} element={<Catalog />}/>
                <Route path={`/${ROUTES.PROFILE}`} element={<PrivateRoute><Profile /></PrivateRoute>}/>
                <Route path={`/${ROUTES.ACCOUNT}`} element={<PrivateRoute><Account /></PrivateRoute>}/>
                <Route path={`/${ROUTES.SETTINGS}`} element={<PrivateRoute><Settings /></PrivateRoute>}/>
                <Route path={`/${ROUTES.INVESTORS}`} element={<Investors />}/>
                <Route path={`/${ROUTES.RISK_OVERVIEW}`} element={<PrivateRoute><RiskOverview /></PrivateRoute>}/>
                <Route path={`/${ROUTES.LEGAL}`} element={<Legal />}/>
                <Route path={`/${ROUTES.PRIVACY}`} element={<Privacy />}/>
                <Route path={`/${ROUTES.IMPRINT}`} element={<Imprint />}/>
                <Route path={`/${ROUTES.MY_RISKS}`} element={<PrivateRoute><MyRisks /></PrivateRoute>}/>
                <Route path={`/${ROUTES.MY_BIDS}`} element={<PrivateRoute><MyBids /></PrivateRoute>}/>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
}

export default App;
