import Header from '@/components/Header';
import Experience from '@/components/Experience';
import ScrollDirector from '@/components/ScrollDirector';
import Hero from '@/components/sections/Hero';
import Discover from '@/components/sections/Discover';
import Featured from '@/components/sections/Featured';
import Services from '@/components/sections/Services';
import Areas from '@/components/sections/Areas';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Sell from '@/components/sections/Sell';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <>
      <Experience />
      <ScrollDirector />
      <Header />
      <main id="main">
        <Hero />
        <Discover />
        <Featured />
        <Services />
        <Areas />
        <About />
        <Testimonials />
        <Sell />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
