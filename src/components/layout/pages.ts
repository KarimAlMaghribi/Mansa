import {ROUTES} from "../../routing/routes";

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';


export interface Page {
    name: string;
    route: string;
    icon?: any;
    action?: () => void;
    authenticated?: boolean;
}

// TODO:: Add icons to elements

export const pages: Page[] = [
    { name: 'Home', route: '/' },
    { name: 'Risiko-Börse', route: ROUTES.RISK_OVERVIEW },
    { name: 'Meine Risiken', route: ROUTES.MY_RISKS, authenticated: true },
    // { name: 'Katalog', route: ROUTES.CATALOG },
    // { name: 'xRisk für Investoren', route: ROUTES.INVESTORS },
    { name: 'Chat', route: ROUTES.CHAT },
    { name: 'Über uns', route: ROUTES.ABOUT }
];

export const settings: Page[] = [
    // { name: 'Meine Risiken', route: ROUTES.MY_RISKS },
    // { name: 'Meine Verhandlungen', route: ROUTES.MY_BIDS },
    { name: 'Profil', route: ROUTES.PROFILE, icon: AccountCircleIcon },
    { name: 'Konto', route: ROUTES.ACCOUNT, icon: AccountCircleIcon },
    { name: 'Einstellungen', route: ROUTES.SETTINGS, icon: SettingsIcon },
];
