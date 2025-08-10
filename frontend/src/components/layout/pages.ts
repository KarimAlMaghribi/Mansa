import { ROUTES } from "../../routing/routes";

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchoolIcon from '@mui/icons-material/School';


export interface Page {
    name: string;
    route: string;
    icon?: any;
    action?: () => void;
    authenticated?: boolean;
}

export const pages: Page[] = [
    { name: 'Dashboard', route: ROUTES.DASHBOARD, icon: DashboardIcon, authenticated: true },
    { name: 'Jamiahs', route: ROUTES.GROUPS, icon: GroupIcon, authenticated: true },
    { name: 'Mitglieder', route: ROUTES.MEMBERS, icon: PeopleIcon, authenticated: true },
    { name: 'Beiträge', route: ROUTES.PAYMENTS, icon: PaymentIcon, authenticated: true },
    { name: 'Dokumente', route: ROUTES.DOCUMENTS, icon: DescriptionIcon, authenticated: true },
    { name: 'Berichte', route: ROUTES.REPORTS, icon: AssessmentIcon, authenticated: true },
    { name: 'Über uns', route: ROUTES.ABOUT },
    { name: 'Erste Schritte', route: ROUTES.ONBOARDING, icon: SchoolIcon, authenticated: true },
];

export const settings: Page[] = [
    { name: 'Profil', route: ROUTES.PROFILE, icon: AccountCircleIcon },
    { name: 'Konto', route: ROUTES.ACCOUNT, icon: AccountCircleIcon },
    { name: 'Einstellungen', route: ROUTES.SETTINGS, icon: SettingsIcon }
];
