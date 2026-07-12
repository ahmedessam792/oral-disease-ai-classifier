import { Classifier } from "@/components/classifier/Classifier";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Limitations } from "@/components/sections/Limitations";
import { ModelInfo } from "@/components/sections/ModelInfo";
import { PrivacyNotice } from "@/components/sections/PrivacyNotice";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Classifier />
        <HowItWorks />
        <ModelInfo />
        <Limitations />
        <PrivacyNotice />
      </main>
      <Footer />
    </>
  );
}
