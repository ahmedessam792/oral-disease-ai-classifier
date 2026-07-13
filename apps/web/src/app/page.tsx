import { Classifier } from "@/components/classifier/Classifier";
import { Disclosures } from "@/components/sections/Disclosures";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ModelInfo } from "@/components/sections/ModelInfo";

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        {/* Above the fold: the message and the instrument, side by side. */}
        <div className="mx-auto grid max-w-[1320px] items-center gap-7 px-4 pb-16 pt-8 sm:px-6 lg:gap-8 lg:pb-20 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] xl:gap-14 xl:pt-14">
          <Hero />
          <Classifier />
        </div>

        <HowItWorks />
        <ModelInfo />
        <Disclosures />
      </main>
      <Footer />
    </>
  );
}
