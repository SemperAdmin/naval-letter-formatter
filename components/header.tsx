import Image from 'next/image';

export function Header() {
  return (
    <header className="bg-secondary/80 backdrop-blur-sm text-primary-foreground shadow-lg sticky top-0 z-40 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 flex flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center gap-2">
          <Image src="https://placehold.co/64x64.png" alt="USMC Seal" width={56} height={56} data-ai-hint="USMC seal" className="h-14 w-14" />
          <h1 className="text-5xl font-headline text-primary tracking-wider">Semper Scribe</h1>
          <p className="text-sm text-primary/80">by Semper Admin</p>
          <p className="text-sm text-primary/80">Last Updated: 20250721</p>

        </div>
      </div>
    </header>
  );
}
