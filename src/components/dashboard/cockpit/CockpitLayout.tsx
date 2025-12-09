import { ReactNode } from "react";

interface CockpitLayoutProps {
  children: ReactNode;
}

export const CockpitLayout = ({ children }: CockpitLayoutProps) => {
  return (
    <div className="relative min-h-screen">
      {/* Cockpit ambient lighting */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(215 25% 60% / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(215 25% 60% / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Top ambient glow */}
        <div 
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, hsl(215 70% 60% / 0.08) 0%, transparent 70%)'
          }}
        />
        
        {/* Side accent lines */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-cockpit-accent/20 to-transparent" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cockpit-accent/20 to-transparent" />
      </div>

      {/* Main content with 12-column grid */}
      <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </div>
    </div>
  );
};
