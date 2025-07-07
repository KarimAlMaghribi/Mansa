import * as React from 'react';
import {useEffect} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Logo from "../../assests/imgs/jamiah_logo.png";
import {useLocation, useNavigate} from "react-router-dom";
import {Page, pages} from "./pages";
import {auth} from "../../firebase_config";
import {useTheme} from '@mui/material';
import {QuickMenuButtons} from "./header-elements/quick-menu-buttons";

export function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();

    const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false);
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const [activePage, setActivePage] = React.useState<string | null>(pages[0].name);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setIsLoggedIn(!!user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (location.pathname === "/")
            setActivePage(pages[0].name);
        else {
            const currentPage = pages.find(page => location.pathname === `/${page.route}`);
            setActivePage(currentPage ? currentPage.name : null);
        }
    }, [location]);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = (page: Page) => {
        setActivePage(page.name);
        setAnchorElNav(null);
        navigate(page.route);
    };

    const handleCloseUserMenu = (setting: Page) => {
        setAnchorElUser(null);
        navigate(setting.route)
    };

    return (
        <AppBar position="static" elevation={0} sx={{backgroundColor: "#1F271B"}}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Box
                        onClick={() => navigate('/')}
                        component="img"
                        sx={{maxWidth: '50px', display: {xs: 'none', md: 'flex'}, mr: 6, cursor: 'pointer'}}
                        src={Logo}/>

                    <Box sx={{flexGrow: 1, display: {xs: 'flex', md: 'none'}}}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit">
                            <MenuIcon/>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={() => setAnchorElNav(null)}
                            sx={{display: {xs: 'block', md: 'none'}}}>

                            {pages.map((page) => (
                                page.authenticated && !isLoggedIn ? null :
                                <MenuItem key={page.name} onClick={() => handleCloseNavMenu(page)}>
                                    <Typography sx={{textAlign: 'center'}}>{page.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    <Typography
                        variant="h5"
                        noWrap
                        component="a"
                        href="#app-bar-with-responsive-menu"
                        sx={{
                            mr: 2,
                            display: {xs: 'flex', md: 'none'},
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}>
                    </Typography>

                    <Box sx={{flexGrow: 1, display: {xs: 'none', md: 'flex'}}}>
                        {pages.map((page) => (
                            page.authenticated && !isLoggedIn ? null :
                            <Button
                                key={page.name}
                                onClick={() => handleCloseNavMenu(page)}
                                sx={{
                                    my: 2,
                                    color: activePage === page.name ? theme.palette.primary.main : 'white',
                                    display: 'block',
                                    textDecoration: 'none',
                                    textDecorationColor: 'white',
                                    fontWeight: activePage === page.name ? 'bold' : 'normal'
                                }}>
                                {page.name}
                            </Button>
                        ))}
                    </Box>
                    <QuickMenuButtons
                        isLoggedIn={isLoggedIn}
                        anchorElUser={anchorElUser}
                        handleOpenUserMenu={handleOpenUserMenu}
                        handleCloseUserMenu={handleCloseUserMenu} />
                </Toolbar>
            </Container>
        </AppBar>
    );
}
