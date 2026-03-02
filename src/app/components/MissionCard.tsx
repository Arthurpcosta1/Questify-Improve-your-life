import { Clock, MoreHorizontal, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Attribute = 'STR' | 'INT' | 'DEX' | 'WIS' | 'VIT';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface MissionCardProps {
  id: string;
  title: string;
  description: string;
  attribute: Attribute;
  rank: Rank;
  deadline?: string;
  progress?: number;
  subtasks?: Subtask[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const attributeColors: Record<Attribute, string> = {
  STR: 'bg-red-500/20 text-red-400',
  INT: 'bg-blue-500/20 text-blue-400',
  DEX: 'bg-green-500/20 text-green-400',
  WIS: 'bg-purple-500/20 text-purple-400',
  VIT: 'bg-yellow-500/20 text-yellow-400',
};

const rankColors: Record<Rank, string> = {
  E: 'bg-gray-500/20 text-gray-400',
  D: 'bg-green-500/20 text-green-400',
  C: 'bg-blue-500/20 text-blue-400',
  B: 'bg-purple-500/20 text-purple-400',
  A: 'bg-orange-500/20 text-orange-400',
  S: 'bg-red-500/20 text-red-400',
};

export function MissionCard({
  id,
  title,
  description,
  attribute,
  rank,
  deadline,
  progress,
  subtasks,
  onEdit,
  onDelete,
  onComplete
}: MissionCardProps) {
  // Calculate progress from subtasks if provided and progress is not manually set
  const calculatedProgress = subtasks && subtasks.length > 0 
    ? Math.round((subtasks.filter(t => t.completed).length / subtasks.length) * 100)
    : progress;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-border/50 p-5 hover:border-border transition-all group relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${attributeColors[attribute] || attributeColors['STR']}`}>
            {attribute}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${rankColors[rank] || rankColors['C']}`}>
            Rank {rank}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent/50 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-[#1a1a1a] border-border/50 text-gray-200">
            <DropdownMenuItem 
              onClick={() => onEdit?.(id)}
              className="cursor-pointer hover:bg-accent/50 focus:bg-accent/50 focus:text-white"
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(id)}
              className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <h3 className="text-foreground font-medium mb-2 pr-6">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
        {description}
      </p>

      {/* Progress bar (if present or calculated) */}
      {calculatedProgress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso</span>
            <span>{calculatedProgress}%</span>
          </div>
          <div className="bg-accent/30 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${calculatedProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {deadline && (
            <>
              <Clock size={14} />
              <span>{deadline}</span>
            </>
          )}
        </div>
        
        <button 
          onClick={() => onComplete?.(id)}
          className="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-md transition-colors"
        >
          <CheckCircle2 size={14} />
          Concluir
        </button>
      </div>
    </div>
  );
}
