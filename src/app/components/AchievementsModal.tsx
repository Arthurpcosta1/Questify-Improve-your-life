import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Lock, Check } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface AchievementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AchievementsModal({ open, onOpenChange }: AchievementsModalProps) {
  const { achievements, userAchievements, equipTitle, playerStats } = useGame();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f0f] border border-border/50 max-w-4xl w-[95vw] text-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-yellow-500">
             🏆 Galeria de Títulos
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
             Desbloqueie conquistas para ganhar títulos exclusivos e exibir no seu perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-2">
            {achievements.map((ach) => {
                const isUnlocked = userAchievements.includes(ach.id);
                const isEquipped = playerStats.equippedTitle === ach.title;

                return (
                    <div 
                        key={ach.id}
                        className={`relative group p-4 rounded-xl border transition-all duration-300 ${
                            isUnlocked 
                                ? 'bg-[#1a1a1a] border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                                : 'bg-[#121212] border-white/5 opacity-60 grayscale'
                        }`}
                    >
                        {/* Status Icon */}
                        <div className="absolute top-3 right-3">
                            {isEquipped ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-950/30 px-2 py-1 rounded border border-green-500/30">
                                    <Check size={10} strokeWidth={4} /> Equipado
                                </span>
                            ) : !isUnlocked ? (
                                <Lock size={16} className="text-gray-600" />
                            ) : null}
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Icon Box */}
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isUnlocked 
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 text-yellow-400 border border-yellow-500/30' 
                                    : 'bg-white/5 text-gray-500 border border-white/5'
                            }`}>
                                <ach.icon size={24} />
                            </div>

                            <div>
                                <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                                    {ach.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {ach.description}
                                </p>
                                
                                {/* Requirement Progress (Mocked for now) */}
                                <div className="mt-2 text-[10px] uppercase font-mono tracking-wider text-gray-600">
                                    Requisito: {ach.reqType === 'total_tasks' ? 'Tarefas' : ach.reqType === 'level' ? 'Nível' : 'Streak'} {ach.reqValue}
                                </div>
                            </div>
                        </div>

                        {/* Equip Button (Only if unlocked and not equipped) */}
                        {isUnlocked && !isEquipped && (
                            <Button 
                                onClick={() => equipTitle(ach.id)}
                                variant="ghost" 
                                size="sm" 
                                className="w-full mt-4 bg-yellow-950/20 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-900/50 hover:border-yellow-500 transition-all"
                            >
                                Equipar Título
                            </Button>
                        )}
                        
                        {/* Unequip Button (If equipped) */}
                         {isEquipped && (
                            <Button 
                                onClick={() => equipTitle('')} // Empty string or null logic in context handles unequip
                                variant="ghost" 
                                size="sm" 
                                className="w-full mt-4 bg-green-950/20 text-green-500 hover:bg-red-500/20 hover:text-red-400 border border-green-900/50 hover:border-red-500/50 transition-all"
                            >
                                Desequipar
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
