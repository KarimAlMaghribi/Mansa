import React from "react";
import Grid from "@mui/material/Grid2";
import Logo from "../../assests/imgs/jamiah_logo.png";
import {Chip, Divider, Typography} from "@mui/material";
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';

export const Footer = () => {
    return (
        <React.Fragment>
            <Grid
                container
                id="footer"
                sx={{
                    backgroundColor: "#1F271B",
                    p: {xs: "40px 20px", md: "40px 80px"},
                    mt: "auto",
                    width: "100%"
                }}
            >
                <Grid xs={12} sm={6} md={2} sx={{mb: {xs: 4, md: 0}}}>
                    <img src={Logo} style={{width: "80px", height: "70px"}} alt="logo"/>
                </Grid>
                <Grid xs={12} sm={6} md={2} sx={{mb: {xs: 4, md: 0}}}>
                    <Typography variant="h6" color="white">Product</Typography>
                    <br />
                    <Typography color="white" variant="body2">Pricing</Typography>
                    <br />
                    <Typography color="white" variant="body2">Overview</Typography>
                    <br />
                    <Typography color="white" variant="body2">Browse</Typography>
                    <br />
                    <div style={{display: "flex", alignItems: "center"}}>
                        <Typography color="white" variant="body2">Accessibility</Typography> &nbsp; &nbsp;
                        <Chip label="BETA" color="primary" size="small" style={{borderRadius: "3px", color: "black"}}/>
                    </div>

                </Grid>
                <Grid xs={12} sm={6} md={2} sx={{mb: {xs: 4, md: 0}}}>
                    <Typography variant="h6" color="white">Solutions</Typography>
                    <br />
                    <Typography color="white" variant="body2">Brainstorming</Typography>
                    <br />
                    <Typography color="white" variant="body2">Ideation</Typography>
                    <br />
                    <Typography color="white" variant="body2">Wireframing</Typography>
                    <br />
                    <Typography color="white" variant="body2">Research</Typography>
                </Grid>
                <Grid xs={12} sm={6} md={2} sx={{mb: {xs: 4, md: 0}}}>
                    <Typography variant="h6" color="white">Resources</Typography>
                    <br />
                    <Typography color="white" variant="body2">Help Center</Typography>
                    <br />
                    <Typography color="white" variant="body2">Blog</Typography>
                    <br />
                    <Typography color="white" variant="body2">Tutorials</Typography>
                    <br />
                    <Typography color="white" variant="body2">FAQs</Typography>
                </Grid>
                <Grid xs={12} sm={6} md={2} sx={{mb: {xs: 4, md: 0}}}>
                    <Typography variant="h6" color="white">Support</Typography>
                    <br />
                    <Typography color="white" variant="body2">Contact Us</Typography>
                    <br />
                    <Typography color="white" variant="body2">Developers</Typography>
                    <br />
                    <Typography color="white" variant="body2">Documentation</Typography>
                    <br />
                    <Typography color="white" variant="body2">Integrations</Typography>
                </Grid>
                <Grid xs={12} sm={6} md={2} sx={{mb: {xs: 4, md: 0}}}>
                    <Typography variant="h6" color="white">Company</Typography>
                    <br />
                    <Typography color="white" variant="body2">About</Typography>
                    <br />
                    <Typography color="white" variant="body2">Press</Typography>
                    <br />
                    <Typography color="white" variant="body2">Events</Typography>
                    <br />
                    <Typography color="white" variant="body2">Request Demo</Typography>
                </Grid>
                <Grid xs={12} sx={{mt: "50px"}}>
                    <Divider color="white"/>
                </Grid>
                <Grid xs={12} md={6} sx={{mt: "20px"}}>
                    <Typography color="white">© {new Date().getFullYear()} XRISK AG. All rights reserved</Typography>
                </Grid>
                <Grid
                    xs={12}
                    md={6}
                    display="flex"
                    justifyContent={{xs: "center", md: "flex-end"}}
                    flexWrap="wrap"
                    sx={{mt: "20px", gap: 2}}
                >
                    <Typography color="white" variant="body2">Imprint</Typography>
                    <Typography color="white" variant="body2">Terms</Typography>
                    <Typography color="white" variant="body2">Privacy</Typography>
                    <Typography color="white" variant="body2">Support</Typography>
                    <Typography color="white" variant="body2">About</Typography>
                    <Typography color="white" variant="body2">Contact</Typography>
                    <LinkedInIcon sx={{color: "white"}}/>
                    <XIcon sx={{color: "white"}}/>
                </Grid>
            </Grid>

        </React.Fragment>

    )
}
