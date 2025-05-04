import React from "react";
import {Banner} from "../../components/landing/banner";
import {RiskCarousel} from "../../components/landing/risk-carousel";
import MarketingStats from "../../components/landing/marketing-stats";
import {FAQs} from "../../components/landing/faqs";

export const Landing = () => {


    return (
        <React.Fragment>
            <Banner/>
            <RiskCarousel/>
            <MarketingStats />
            <FAQs />
            <div style={{height: "200px"}}></div>
        </React.Fragment>
    )
}
