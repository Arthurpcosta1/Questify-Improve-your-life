import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { CalendarIcon, Plus, X, Repeat, CheckCircle, Flame } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Attribute, Rank, Subtask, MissionCardProps } from './MissionCard';
import { Habit } from './DailyHabits';

interface NewMissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: NewTaskData) => void;
  onUpdateTask?: (id: string, task: NewTaskData) => void;
  initialData?: any; // Accepting a loose shape for flexible updates
}

export type MissionType = 'habit' | 'recurring' | 'onetime';

// Data shapes
export interface NewTaskData {
  title: string;
  type: MissionType;
  attribute: Attribute;
  rank: Rank;
  description?: string;
  
  // Type specific
  habitDirection?: 'positive' | 'negative' | 'both';
  
  recurringStart?: Date;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatDays?: number[]; // 0-6
  
  deadline?: Date;
  
  subtasks?: Subtask[];
}

const rankColors: Record<Rank, string> = {
  E: 'border-gray-500 text-gray-400 hover:border-gray-400',
  D: 'border-green-500 text-green-400 hover:border-green-400',
  C: 'border-blue-500 text-blue-400 hover:border-blue-400',
  B: 'border-purple-500 text-purple-400 hover:border-purple-400',
  A: 'border-orange-500 text-orange-400 hover:border-orange-400',
  S: 'border-red-500 text-red-400 hover:border-red-400',
};

const DAYS = [
    { label: 'Dom', value: 0 },
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
];

export const NewMissionModal = React.forwardRef<HTMLDivElement, NewMissionModalProps>(function NewMissionModal({ 
  open, 
  onOpenChange, 
  onCreateTask, 
  onUpdateTask,
  initialData 
}: NewMissionModalProps, ref) {
  // Common Fields
  const [title, setTitle] = useState('');
  const [missionType, setMissionType] = useState<MissionType>('onetime');
  const [attribute, setAttribute] = useState<Attribute>('STR');
  const [rank, setRank] = useState<Rank>('C');
  const [description, setDescription] = useState('');

  // Habit Fields
  const [isPositive, setIsPositive] = useState(true);
  const [isNegative, setIsNegative] = useState(false);

  // Recurring Fields
  const [recurringStart, setRecurringStart] = useState<Date | undefined>(new Date());
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // One-Time Fields
  const [deadline, setDeadline] = useState<Date>();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const ranks: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

  // Populate form logic
  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title);
      setAttribute(initialData.attribute || 'STR');
      setRank(initialData.rank || 'C');
      setDescription(initialData.description || '');

      // Determine Type from Initial Data Props
      if (initialData.type === 'habit' || initialData.direction) {
          setMissionType('habit');
          setIsPositive(initialData.direction === 'positive' || initialData.direction === 'both');
          setIsNegative(initialData.direction === 'negative' || initialData.direction === 'both');
      } else if (initialData.repeatDays || initialData.type === 'recurring') {
          setMissionType('recurring');
          setRepeatDays(initialData.repeatDays || [0, 1, 2, 3, 4, 5, 6]);
          // If we had start date logic in previous structure, map it here. Otherwise default today.
          setRecurringStart(new Date()); 
      } else {
          setMissionType('onetime');
          setSubtasks(initialData.subtasks || []);
          if (initialData.deadline) {
             try {
                // If it's a string, parse it. If it's a date object, use it.
                const d = typeof initialData.deadline === 'string' 
                    ? parse(initialData.deadline, "dd MMM, yyyy", new Date(), { locale: ptBR })
                    : initialData.deadline;
                if (d && !isNaN(d.getTime())) setDeadline(d);
             } catch (e) {}
          }
      }
    } else if (open && !initialData) {
      // Reset
      setTitle('');
      setMissionType('onetime');
      setAttribute('STR');
      setRank('C');
      setDescription('');
      setIsPositive(true);
      setIsNegative(false);
      setRecurringStart(new Date());
      setRecurringFrequency('weekly');
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
      setDeadline(undefined);
      setSubtasks([]);
    }
  }, [open, initialData]);

  const toggleDay = (dayValue: number) => {
    setRepeatDays(prev => 
      prev.includes(dayValue) 
          ? prev.filter(d => d !== dayValue)
          : [...prev, dayValue]
    );
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtaskTitle, completed: false }]);
      setNewSubtaskTitle('');
      setShowSubtaskInput(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    let habitDirection: 'positive' | 'negative' | 'both' | undefined;
    if (missionType === 'habit') {
        if (isPositive && isNegative) habitDirection = 'both';
        else if (isPositive) habitDirection = 'positive';
        else habitDirection = 'negative'; // Default if none selected? Or force one? Let's assume at least one.
        if (!isPositive && !isNegative) habitDirection = 'positive'; // Fallback
    }

    const taskData: NewTaskData = {
      title,
      type: missionType,
      attribute,
      rank,
      description,
      habitDirection,
      recurringStart: missionType === 'recurring' ? recurringStart : undefined,
      recurringFrequency: missionType === 'recurring' ? recurringFrequency : undefined,
      repeatDays: missionType === 'recurring' ? repeatDays : undefined,
      deadline: missionType === 'onetime' ? deadline : undefined,
      subtasks: missionType === 'onetime' ? subtasks : undefined,
    };

    if (initialData && onUpdateTask) {
      onUpdateTask(initialData.id, taskData);
    } else {
      onCreateTask(taskData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border border-border/50 max-w-2xl w-[95vw] md:w-full p-0 gap-0 text-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">Nova Tarefa</DialogTitle>
        <DialogDescription className="sr-only">Crie uma nova tarefa.</DialogDescription>
        
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Title Input */}
          <div className="relative group">
            <input
              type="text"
              placeholder="Título da Tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-xl md:text-2xl font-medium text-white placeholder:text-gray-500 outline-none border-b border-transparent focus:border-blue-500/50 pb-1 transition-all"
              autoFocus
            />
          </div>

          {/* Type Selector (3 Tabs) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Tipo de Tarefa</label>
            <div className="flex bg-black/20 p-1 rounded-lg">
               <button
                  onClick={() => setMissionType('habit')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      missionType === 'habit' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
               >
                  <Plus size={16} /> Hábito
               </button>
               <button
                  onClick={() => setMissionType('recurring')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      missionType === 'recurring' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
               >
                  <Repeat size={16} /> Recorrente
               </button>
               <button
                  onClick={() => setMissionType('onetime')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      missionType === 'onetime' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
               >
                  <CheckCircle size={16} /> Única
               </button>
            </div>
          </div>

          {/* Rank Selector (Universal) */}
          <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-xs font-medium text-gray-400">Dificuldade & Recompensa</label>
                <span className="text-xs text-blue-400/80 font-mono">
                    {/* Dynamic Reward Preview */}
                    {rank === 'E' && '10 XP | 5 🪙'}
                    {rank === 'D' && '20 XP | 10 🪙'}
                    {rank === 'C' && '40 XP | 20 🪙'}
                    {rank === 'B' && '80 XP | 40 🪙'}
                    {rank === 'A' && '150 XP | 80 🪙'}
                    {rank === 'S' && '300 XP | 150 🪙'}
                </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {ranks.map((r) => (
                <button
                    key={r}
                    onClick={() => setRank(r)}
                    className={`flex-1 min-w-[3rem] px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    rank === r
                        ? `${rankColors[r]} bg-white/5 border-current shadow-[0_0_10px_rgba(0,0,0,0.5)]`
                        : `border-border/50 text-gray-500 hover:border-gray-400 hover:text-gray-300`
                    }`}
                >
                    {r}
                </button>
                ))}
            </div>
          </div>

          {/* Attribute Selector (Universal) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Atributo Principal</label>
            <Select value={attribute} onValueChange={(v) => setAttribute(v as Attribute)}>
                <SelectTrigger className="bg-accent/30 border-border/50 text-gray-200">
                <SelectValue placeholder="Selecione um atributo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-border/50 text-gray-200">
                <SelectItem value="STR">STR - Força (Físico/Trabalho Pesado)</SelectItem>
                <SelectItem value="INT">INT - Inteligência (Estudos/Mental)</SelectItem>
                <SelectItem value="DEX">DEX - Destreza (Agilidade/Criatividade)</SelectItem>
                <SelectItem value="WIS">WIS - Sabedoria (Planejamento/Social)</SelectItem>
                <SelectItem value="VIT">VIT - Vitalidade (Saúde/Bem-estar)</SelectItem>
                </SelectContent>
            </Select>
          </div>

          {/* Type Specific Fields */}
          
          {/* HABIT SPECIFIC */}
          {missionType === 'habit' && (
              <div className="bg-accent/10 p-4 rounded-lg border border-border/30 space-y-4">
                  <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                      <Flame size={16} className="text-orange-500" />
                      Comportamento
                  </h3>
                  <div className="flex gap-4">
                      <button 
                        onClick={() => setIsPositive(!isPositive)}
                        className={`flex-1 p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                            isPositive 
                            ? 'bg-green-950/30 border-green-500 text-green-400' 
                            : 'bg-transparent border-border/50 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                          <Plus size={24} />
                          <span className="text-xs font-bold">Positivo (+)</span>
                      </button>
                      <button 
                        onClick={() => setIsNegative(!isNegative)}
                        className={`flex-1 p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                            isNegative 
                            ? 'bg-red-950/30 border-red-500 text-red-400' 
                            : 'bg-transparent border-border/50 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                          <X size={24} /> {/* X icon works well for negative/bad */}
                          <span className="text-xs font-bold">Negativo (-)</span>
                      </button>
                  </div>
              </div>
          )}

          {/* RECURRING SPECIFIC */}
          {missionType === 'recurring' && (
              <div className="space-y-4 bg-accent/10 p-4 rounded-lg border border-border/30">
                   <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                      <Repeat size={16} className="text-purple-500" />
                      Configuração da Rotina
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Início</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-full flex items-center gap-2 px-3 py-2 bg-black/40 border border-border/50 rounded-lg text-sm text-gray-200 hover:border-gray-500 transition-all">
                                <CalendarIcon size={14} className="text-gray-400" />
                                {recurringStart ? format(recurringStart, "dd/MM/yyyy") : "Selecione"}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-border/50" align="start">
                                <Calendar mode="single" selected={recurringStart} onSelect={setRecurringStart} className="bg-[#1a1a1a] text-gray-200" />
                            </PopoverContent>
                        </Popover>
                      </div>

                      {/* Frequency */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Frequência</label>
                        <Select value={recurringFrequency} onValueChange={(v: any) => setRecurringFrequency(v)}>
                            <SelectTrigger className="bg-black/40 border-border/50 text-gray-200 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-border/50 text-gray-200">
                                <SelectItem value="daily">Diária</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                  </div>

                  {/* Day Selector */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">Repetir nos dias</label>
                    <div className="flex justify-between gap-1">
                        {DAYS.map((day) => {
                            const isSelected = repeatDays.includes(day.value);
                            return (
                                <button
                                    key={day.value}
                                    onClick={() => toggleDay(day.value)}
                                    className={`
                                        w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center
                                        ${isSelected 
                                            ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)] transform scale-105' 
                                            : 'bg-black/40 text-gray-600 hover:bg-black/60'}
                                    `}
                                >
                                    {day.label.slice(0, 1)}
                                </button>
                            );
                        })}
                    </div>
                  </div>
              </div>
          )}

          {/* ONETIME SPECIFIC */}
          {missionType === 'onetime' && (
              <div className="space-y-4">
                  {/* Deadline */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">Prazo Final</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-accent/30 border border-border/50 rounded-lg text-sm text-gray-200 hover:border-gray-500 transition-all">
                          <CalendarIcon size={16} className="text-gray-400" />
                          {deadline ? (
                            format(deadline, "dd 'de' MMMM, yyyy", { locale: ptBR })
                          ) : (
                            <span className="text-gray-500">Sem prazo definido</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-border/50" align="start">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={setDeadline}
                          initialFocus
                          className="bg-[#1a1a1a] text-gray-200"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Subtasks */}
                  <div className="space-y-2">
                     {/* Simplified Subtask UI for brevity, identical to previous logic but inside this block */}
                     <label className="text-xs font-medium text-gray-400">Subtarefas ({subtasks.length})</label>
                     {subtasks.map((st) => (
                         <div key={st.id} className="text-sm bg-black/20 p-2 rounded text-gray-300">{st.title}</div>
                     ))}
                     <div className="flex gap-2">
                         <input 
                            value={newSubtaskTitle}
                            onChange={e => setNewSubtaskTitle(e.target.value)}
                            className="flex-1 bg-black/20 border border-white/10 rounded px-2 text-sm"
                            placeholder="Adicionar etapa..."
                            onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                         />
                         <Button size="sm" onClick={handleAddSubtask} variant="secondary">Add</Button>
                     </div>
                  </div>
              </div>
          )}

          {/* Description (Universal) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Descrição / Notas</label>
            <Textarea
              placeholder="Adicione detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-accent/30 border-border/50 text-gray-200 placeholder:text-gray-500/50 min-h-[80px] resize-none focus:border-blue-500/50"
            />
          </div>

        </div>

        <DialogFooter className="px-6 md:px-8 py-4 border-t border-border/50 bg-[#151515]">
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={`w-full text-white font-medium py-4 md:py-6 ${
                missionType === 'habit' ? 'bg-blue-600 hover:bg-blue-700' :
                missionType === 'recurring' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {initialData ? 'Salvar Alterações' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
