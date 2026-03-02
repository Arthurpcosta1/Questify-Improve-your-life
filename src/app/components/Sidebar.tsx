import { LayoutDashboard, CheckSquare, Target, Settings, ShoppingBag, Database, X, Swords, Trophy, Backpack } from 'lucide-react';
import { cn } from './ui/utils'; 

interface SidebarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentView = 'dashboard', onNavigate, isOpen = false, onClose }: SidebarProps) {
  
  const handleNav = (view: string, e: React.MouseEvent) => {
      e.preventDefault();
      if (onNavigate) {
          onNavigate(view);
      }
      if (onClose) {
          onClose(); // Close drawer on mobile navigation
      }
  };

  const linkClass = (view: string) => `
    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer
    ${currentView === view 
      ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
      : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'}
  `;

  return (
    <>
      {/* Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-64 border-r border-border/50 bg-[#1a1a1a] p-6 flex flex-col h-screen overflow-y-auto transition-transform duration-300 z-50",
        // Desktop: always static and visible
        "md:translate-x-0 md:static md:block",
        // Mobile: fixed and togglable
        "fixed top-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end mb-2">
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">RPG</span>
              Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-10">Gerenciamento de tarefas</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <a
            href="#"
            onClick={(e) => handleNav('dashboard', e)}
            className={linkClass('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span className="text-sm font-medium">Visão Geral</span>
          </a>
          

          <div className="pt-2">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Foco</p>
              <a
              href="#"
              onClick={(e) => handleNav('dungeon', e)}
              className={linkClass('dungeon')}
              >
              <Swords size={18} />
              <span className="text-sm font-medium">Masmorras</span>
              </a>
          </div>

          <div className="pt-2">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dados</p>
              <a
              href="#"
              onClick={(e) => handleNav('history', e)}
              className={linkClass('history')}
              >
              <Database size={18} />
              <span className="text-sm font-medium">Histórico</span>
              </a>
          </div>

          <div className="pt-2">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Comunidade</p>
              <a
              href="#"
              onClick={(e) => handleNav('ranking', e)}
              className={linkClass('ranking')}
              >
              <Trophy size={18} />
              <span className="text-sm font-medium">Ranking Global</span>
              </a>
          </div>

          <div className="pt-2">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Mercado</p>
              <a
              href="#"
              onClick={(e) => handleNav('store', e)}
              className={linkClass('store')}
              >
              <ShoppingBag size={18} />
              <span className="text-sm font-medium">Loja de Recompensas</span>
              </a>
              <a
              href="#"
              onClick={(e) => handleNav('inventory', e)}
              className={linkClass('inventory')}
              >
              <Backpack size={18} />
              <span className="text-sm font-medium">Saco de Itens</span>
              </a>
          </div>
        </nav>

        {/* Settings at bottom */}
        <div className="pt-4 border-t border-border/50">
          <a
            href="#"
            onClick={(e) => handleNav('settings', e)}
            className={linkClass('settings')}
          >
            <Settings size={18} />
            <span className="text-sm">Configurações</span>
          </a>
        </div>
      </aside>
    </>
  );
}