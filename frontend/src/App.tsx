import React from 'react';
import {Navigate, Route, Routes} from "react-router-dom";

import {Landing} from "./pages/landing/landing";
import {LoginForm} from "./pages/authentication/sign-in";
import {SignUpForm} from "./pages/authentication/sign-up";
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
import {Settings} from "./pages/settings/settings";
import {ROUTES} from "./routing/routes";
import {PrivateRoute} from "./routing/private-route";
import {MyRisks} from "./pages/my-risks/my-risks";
import {MyBids} from "./pages/my-bids/my-bids";

// Jamiah-spezifische Seiten
import {Dashboard} from "./pages/dashboard/dashboard";
import {Groups} from "./pages/groups/groups";
import {Payments} from "./pages/payments/payments";
import {Votes} from "./pages/votes/votes";
import {Documents} from "./pages/documents/documents";
import {Reports} from "./pages/reports/reports";
import {Members} from "./pages/memebers/members";
import JamiahLayout from "./components/layout/jamiah-layout";
import {Onboarding} from "./pages/onboarding/onboarding";
import SearchPage from "./pages/search/search";
import { JoinJamiahPage } from "./pages/join-jamiah/join-jamiah";
import { GroupDetails } from "./pages/group-details/group-details";
import {VerifyEmail} from "./pages/authentication/verifyEmail";
import {HelloBackend} from "./pages/hello-backend/hello-backend";

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path={`/${ROUTES.SIGN_IN}`} element={<LoginForm />} />
                <Route path={`/${ROUTES.SIGN_UP}`} element={<SignUpForm />} />
                <Route path={`/${ROUTES.FORGOT_PASSWORD}`} element={<ForgotPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Private routes */}
                <Route path="/jamiah/:groupId/*" element={<PrivateRoute><JamiahLayout /></PrivateRoute>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="members" element={<Members />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="votes" element={<Votes />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="reports" element={<Reports />} />
                </Route>
                <Route path={`/${ROUTES.DASHBOARD}`} element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path={`/${ROUTES.GROUPS}`} element={<PrivateRoute><Groups /></PrivateRoute>} />
                <Route path={`/${ROUTES.SEARCH}`} element={<PrivateRoute><SearchPage /></PrivateRoute>} />
                <Route path={`/${ROUTES.MEMBERS}`} element={<PrivateRoute><Members /></PrivateRoute>} />
                <Route path={`/${ROUTES.PAYMENTS}`} element={<PrivateRoute><Payments /></PrivateRoute>} />
                <Route path={`/${ROUTES.DOCUMENTS}`} element={<PrivateRoute><Documents /></PrivateRoute>} />
                <Route path={`/${ROUTES.REPORTS}`} element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path={`/${ROUTES.CHAT}`} element={<PrivateRoute><Chat /></PrivateRoute>} />
                <Route path={`/${ROUTES.PROFILE}`} element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path={`/${ROUTES.ACCOUNT}`} element={<PrivateRoute><Account /></PrivateRoute>} />
                <Route path={`/${ROUTES.SETTINGS}`} element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path={`/${ROUTES.RISK_OVERVIEW}`} element={<PrivateRoute><RiskOverview /></PrivateRoute>} />
                <Route path={`/${ROUTES.MY_RISKS}`} element={<PrivateRoute><MyRisks /></PrivateRoute>} />
                <Route path={`/${ROUTES.MY_BIDS}`} element={<PrivateRoute><MyBids /></PrivateRoute>} />
                <Route path={`/${ROUTES.ONBOARDING}`} element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                <Route path={`/${ROUTES.JOIN_JAMIAH}`} element={<PrivateRoute><JoinJamiahPage /></PrivateRoute>} />
                <Route path={`/${ROUTES.GROUP_DETAILS}/:id`} element={<PrivateRoute><GroupDetails /></PrivateRoute>} />


                {/* Public routes */}
                <Route path={`/${ROUTES.ABOUT}`} element={<About />} />
                <Route path={`/${ROUTES.CATALOG}`} element={<Catalog />} />
                <Route path={`/${ROUTES.INVESTORS}`} element={<Investors />} />
                <Route path={`/${ROUTES.LEGAL}`} element={<Legal />} />
                <Route path={`/${ROUTES.PRIVACY}`} element={<Privacy />} />
                <Route path={`/${ROUTES.IMPRINT}`} element={<Imprint />} />
                <Route path={`/${ROUTES.HELLO_BACKEND}`} element={<HelloBackend />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
}

export default App;
