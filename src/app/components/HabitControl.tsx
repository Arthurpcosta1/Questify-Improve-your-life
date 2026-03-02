import { Plus, Minus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Attribute, Rank } from './MissionCard';

export type HabitDirection = 'positive' | 'negative' | 'both';

export interface HabitData {
  id: string;
  title: string;
  attribute: Attribute;
  rank: Rank;
  direction: HabitDirection;
}

interface HabitControlProps {
  habits: HabitData[];
  onScore: (id: string, direction: 'positive' | 'negative') => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HabitControl({ habits, onScore, onEdit, onDelete }: HabitControlProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-border/50 p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-xl font-bold text-foreground">Hábitos</h2>
           <p className="text-xs text-muted-foreground mt-1">
             Bons hábitos fortalecem, maus hábitos punem.
           </p>
        </div>
      </div>

      <div className="space-y-3">
        {habits.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground text-sm italic border border-dashed border-border/30 rounded-lg">
                Nenhum hábito configurado.
            </div>
        ) : (
            habits.map((habit) => (
            <div 
                key={habit.id}
                className="flex items-center justify-between bg-accent/5 p-3 rounded-lg border border-transparent hover:border-border/50 transition-all group"
            >
                <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-200">{habit.title}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground border border-white/10 px-1 rounded bg-black/20">
                            {habit.attribute}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 rounded ${
                            habit.rank === 'S' ? 'text-red-400 bg-red-950/30' : 
                            habit.rank === 'A' ? 'text-orange-400 bg-orange-950/30' :
                            'text-gray-400 bg-gray-800/50'
                        }`}>
                            Rank {habit.rank}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Positive Button */}
                    {(habit.direction === 'positive' || habit.direction === 'both') && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onScore(habit.id, 'positive')}
                            className="h-9 w-9 bg-green-950/20 border-green-900/50 hover:bg-green-500 hover:text-white hover:border-green-500 text-green-500 transition-all"
                            title="Bom Hábito (+XP/Gold)"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </Button>
                    )}

                    {/* Negative Button */}
                    {(habit.direction === 'negative' || habit.direction === 'both') && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onScore(habit.id, 'negative')}
                            className="h-9 w-9 bg-red-950/20 border-red-900/50 hover:bg-red-500 hover:text-white hover:border-red-500 text-red-500 transition-all"
                            title="Mau Hábito (-HP)"
                        >
                            <Minus size={16} strokeWidth={3} />
                        </Button>
                    )}

                    {/* Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-border/50 text-gray-200">
                            <DropdownMenuItem onClick={() => onEdit(habit.id)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(habit.id)} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/20">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
