import { Checkbox } from './ui/checkbox';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// Exporting types for reuse
export type Attribute = 'STR' | 'INT' | 'DEX' | 'WIS' | 'VIT';

export interface Habit {
  id: string;
  title: string;
  completed: boolean;
  attribute: Attribute;
  xp?: number;
  gold?: number;
  repeatDays?: number[]; // Array of 0-6 (Sun-Sat)
}

interface DailyHabitsProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DailyHabits({ habits, onToggleHabit, onEdit, onDelete }: DailyHabitsProps) {
  // If no habits for today, show empty state message or just empty list
  const completedCount = habits.filter(h => h.completed).length;
  
  // Calculate progress percentage, avoiding division by zero
  const progressPercent = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-border/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-xl font-bold text-foreground">Rotina Diária</h2>
           <p className="text-xs text-muted-foreground mt-1">
             Tarefas recorrentes agendadas para hoje
           </p>
        </div>
        <div className="text-right">
            <span className="text-2xl font-bold text-blue-400">{completedCount}</span>
            <span className="text-sm text-muted-foreground">/{habits.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-accent/10 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Habits list */}
      <div className="space-y-2">
        {habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm italic border border-dashed border-border/30 rounded-lg">
                Nenhuma rotina para hoje.
            </div>
        ) : (
            habits.map(habit => (
            <div
                key={habit.id}
                className="group flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 border border-transparent hover:border-blue-500/20 transition-all duration-200"
            >
                <Checkbox
                checked={habit.completed}
                onCheckedChange={() => onToggleHabit(habit.id)}
                className="w-5 h-5 border-muted-foreground/40 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
                />
                
                <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onToggleHabit(habit.id)}
                >
                    <span
                        className={`text-sm font-medium transition-all ${
                            habit.completed
                            ? 'line-through text-muted-foreground decoration-blue-500/50 decoration-2'
                            : 'text-foreground'
                        }`}
                    >
                        {habit.title}
                    </span>
                    
                    {/* RPG Info Tags */}
                    <div className="flex items-center gap-2 mt-1">
                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-muted-foreground uppercase tracking-wider`}>
                            {habit.attribute}
                         </span>
                         <span className="text-[10px] text-blue-400/80 font-mono">+{habit.xp}XP</span>
                         <span className="text-[10px] text-yellow-500/80 font-mono">+{habit.gold}G</span>
                    </div>
                </div>
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                    <MoreHorizontal size={16} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-[#1a1a1a] border-border/50 text-gray-200 shadow-xl shadow-black/50">
                    <DropdownMenuItem 
                    onClick={() => onEdit?.(habit.id)}
                    className="cursor-pointer gap-2 py-2"
                    >
                    <Pencil className="h-4 w-4 text-blue-400" />
                    <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                    onClick={() => onDelete?.(habit.id)}
                    className="cursor-pointer gap-2 py-2 text-red-400 focus:text-red-300 focus:bg-red-950/20"
                    >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
