import { ReactNode } from "react";

interface CockpitLayoutProps {
  children: ReactNode;
}

export const CockpitLayout = ({ children }: CockpitLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-[hsl(0_0%_97%)] dark:bg-[hsl(0_0%_5%)]">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Minimal grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(0 0% 50% / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(0 0% 50% / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Top magenta ambient glow */}
        <div 
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, hsl(330 100% 62% / 0.04) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </div>
    </div>
  );
};