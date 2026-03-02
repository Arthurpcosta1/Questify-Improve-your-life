import { Search, RefreshCw, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

interface HistoryLog {
  id: string;
  created_at: string;
  action_type: string;
  task_name: string;
  impact_value: string;
}

interface SystemHistoryProps {
  userId: string;
}

export function SystemHistory({ userId }: SystemHistoryProps) {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch logs from Supabase
  const fetchLogs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch directly from the history_logs table
      const { data, error } = await supabase
        .from('history_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Map to our HistoryLog format
        const formattedLogs: HistoryLog[] = data.map((item: any) => {
          return {
            id: item.id,
            created_at: new Date(item.created_at).toLocaleString('pt-BR'),
            action_type: item.action_type,
            task_name: item.task_name || '-',
            impact_value: item.impact_value || '-'
          };
        });

        setLogs(formattedLogs);
      }
    } catch (error: any) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      toast.error('Erro ao sincronizar histórico.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLogs();
    }
  }, [userId, fetchLogs]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const filteredLogs = logs.filter(log => 
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.task_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to determine impact color dynamically
  const getImpactColor = (actionType: string) => {
    if (actionType.includes('Punição')) return 'text-red-500';
    if (actionType.includes('Compra')) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border/50 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="text-blue-500" size={24} />
            Base de Dados / Histórico
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Registro completo de atividades do sistema.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Filtrar histórico..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#1a1a1a] border-border/50 h-9 text-sm"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="border-border/50 bg-[#1a1a1a] hover:bg-accent/20 gap-2 h-9"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>

      {/* Notion-style Data Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-[#1a1a1a]/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1a1a1a] text-xs uppercase text-muted-foreground font-semibold tracking-wider border-b border-border/50">
              <tr>
                <th className="px-6 py-4 w-48">Data/Hora</th>
                <th className="px-6 py-4 w-64">Ação</th>
                <th className="px-6 py-4">Missão/Detalhe</th>
                <th className="px-6 py-4 w-64 text-right">Impacto no Sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      Carregando dados...
                    </td>
                  </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/5 transition-colors group">
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {/* Supabase Key Binding */}
                      <span data-key="created_at">{log.created_at}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${
                             log.action_type.includes('Punição') ? 'bg-red-500' : 
                             log.action_type.includes('Compra') ? 'bg-yellow-500' : 'bg-green-500'
                         }`}></div>
                         {/* Supabase Key Binding */}
                         <span data-key="action_type" className="font-medium text-foreground">
                            {log.action_type}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {/* Supabase Key Binding */}
                      <span data-key="task_name">{log.task_name}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {/* Supabase Key Binding */}
                      <span data-key="impact_value" className={getImpactColor(log.action_type)}>
                        {log.impact_value}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer / Summary */}
        <div className="bg-[#1a1a1a] px-6 py-3 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center">
            <span>Mostrando {filteredLogs.length} registros</span>
            <div className="flex gap-2">
                <span className="px-2 py-1 bg-accent/10 rounded border border-border/30 cursor-pointer hover:bg-accent/20">Anterior</span>
                <span className="px-2 py-1 bg-accent/10 rounded border border-border/30 cursor-pointer hover:bg-accent/20">Próximo</span>
            </div>
        </div>
      </div>
    </div>
  );
}