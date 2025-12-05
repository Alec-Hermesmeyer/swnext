import NavTailwind from "./NavTailwind";
import FooterTailwind from "./FooterTailwind";

export default function TWLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      {/* Fixed Header with full-width navigation */}
      <header className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2">
        <NavTailwind />
      </header>

      {/* Main content area with top padding to account for fixed nav */}
      <main className="flex-1 flex flex-col pt-[15vh] max-md:pt-[12vh] pb-16 px-8 justify-center items-center mb-[-5%] min-h-screen">
        {children}
      </main>

      {/* Footer with full-width layout */}
      <FooterTailwind />
    </div>
  );
}

 