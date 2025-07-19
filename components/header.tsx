import Image from 'next/image';

export function Header() {
  return (
    <header className="bg-secondary/80 backdrop-blur-sm text-primary-foreground shadow-lg sticky top-0 z-40 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <Image src="https://placehold.co/64x64.png" alt="USMC Seal" width={56} height={56} data-ai-hint="USMC seal" className="h-14 w-14" />
          <h1 className="text-5xl font-headline text-primary tracking-wider">Semper Scribe</h1>
        </div>
      </div>
    </header>
  );
}
