import { MissionCard, MissionCardProps } from './MissionCard';
import { Plus } from 'lucide-react';

interface MissionBoardProps {
  missions: MissionCardProps[];
  onOpenCreateModal: () => void;
  onDeleteTask?: (id: string) => void;
  onOpenEditModal?: (task: MissionCardProps) => void;
  onCompleteTask?: (id: string) => void;
}

export function MissionBoard({ 
  missions, 
  onOpenCreateModal, 
  onDeleteTask,
  onOpenEditModal,
  onCompleteTask
}: MissionBoardProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg text-foreground">Quadro de Missões</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {missions.length} missões ativas
          </p>
        </div>
        <button 
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Nova Missão
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.map(mission => (
          <MissionCard 
            key={mission.id} 
            {...mission} 
            onEdit={() => onOpenEditModal?.(mission)}
            onDelete={onDeleteTask}
            onComplete={onCompleteTask}
          />
        ))}
      </div>
    </div>
  );
}
