import { Activity, Zap } from 'lucide-react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-gradient">BLUCO</span>
              <span className="text-foreground/90 ml-1">Analyzer</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4 text-success animate-pulse" />
          <span>CEO Brain Active</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
