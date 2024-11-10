import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="text-5xl flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-7xl font-bold text-center shadow-lg">PawTox</h1>
        <h2 className="text-muted-foreground">Pet Poison Control Call Center</h2>
        <h2 className="bg-white rounded-lg p-2 shadow-lg text-black">+1 (888) 884 2201</h2>
        <p className="mt-8 text-muted-foreground text-sm text-center">Over the phone, help you determine if your pet has been poisoned and needs emergency care.<br/>Optionally, you can verbally consent to toll-free SMS messages with instructions for at-home care and nearby 24/7 emergency vets.</p>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://pawtox.vercel.app/api/nearby-vets?zipCode=98102"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Nearby Vets API
        </a>
      </footer>
    </div>
  );
}
