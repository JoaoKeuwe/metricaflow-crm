import { useEffect } from "react";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { HeroSection } from "@/components/sales/HeroSection";
import { LogoBar } from "@/components/sales/LogoBar";
import { FeaturesShowcase } from "@/components/sales/FeaturesShowcase";
import { HowItWorks } from "@/components/sales/HowItWorks";
import { Testimonials } from "@/components/sales/Testimonials";
import { ComparisonTable } from "@/components/sales/ComparisonTable";
import { PricingSection } from "@/components/sales/PricingSection";
import { ExpandedFAQ } from "@/components/sales/ExpandedFAQ";
import { FinalCTA } from "@/components/sales/FinalCTA";
import { SalesFooter } from "@/components/sales/SalesFooter";

const Sales = () => {
  useEffect(() => {
    document.title = "WorkFlow360 - CRM de Vendas Inteligente | Aumente suas Vendas";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SalesHeader />
      <main>
        <HeroSection />
        <LogoBar />
        <FeaturesShowcase />
        <HowItWorks />
        <Testimonials />
        <ComparisonTable />
        <PricingSection />
        <ExpandedFAQ />
        <FinalCTA />
      </main>
      <SalesFooter />
    </div>
  );
};

export default Sales;
