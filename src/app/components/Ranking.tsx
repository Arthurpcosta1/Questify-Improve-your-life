import { useState, useEffect } from 'react';
import { Trophy, Award, Flame } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

import avatar1 from '../../assets/images/avatar-1.png';
import avatar2 from '../../assets/images/avatar-2.png';
import avatar3 from '../../assets/images/avatar-3.png';
import avatar4 from '../../assets/images/avatar-4.png';

const avatarMap: { [key: string]: string } = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  default: avatar1,
};

interface HunterProfile {
  id: string;
  display_name: string;
  level: number;
  xp: number;
  avatar_url: string;
}

export function Ranking({ userId }: { userId: string }) {
  const [hunters, setHunters] = useState<HunterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, level, xp, avatar_url')
          .order('level', { ascending: false })
          .order('xp', { ascending: false })
          .limit(50);

        if (error) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
          toast.error('Falha ao carregar ranking');
          return;
        }

        setHunters(data || []);
      } catch (e) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
        toast.error('Erro ao buscar dados do ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  const getPodiumStyle = (position: number) => {
    if (position === 1) {
      return {
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-900/30',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
        text: 'text-yellow-400',
      };
    } else if (position === 2) {
      return {
        border: 'border-gray-400/50',
        bg: 'bg-gray-700/20',
        glow: 'shadow-[0_0_15px_rgba(156,163,175,0.3)]',
        text: 'text-gray-400',
      };
    } else if (position === 3) {
      return {
        border: 'border-orange-500/50',
        bg: 'bg-orange-900/30',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
        text: 'text-orange-400',
      };
    }
    return {
      border: 'border-border/50',
      bg: 'bg-transparent',
      glow: '',
      text: 'text-foreground',
    };
  };

  const getAvatarUrl = (avatarKey?: string) => {
    return avatarMap[avatarKey || 'default'] || avatarMap.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Trophy size={48} className="mx-auto text-yellow-500" />
          <p className="text-muted-foreground">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Trophy size={32} className="text-yellow-500" />
          <h1 className="text-3xl font-bold text-foreground">Ranking Nacional de Caçadores</h1>
          <Trophy size={32} className="text-yellow-500" />
        </div>
        <p className="text-sm text-muted-foreground">Top 50 Caçadores Classificados</p>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {hunters.map((hunter, idx) => {
          const position = idx + 1;
          const podium = getPodiumStyle(position);
          const isCurrentUser = hunter.id === userId;
          const avatarUrl = getAvatarUrl(hunter.avatar_url);

          return (
            <div
              key={hunter.id}
              className={`
                flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                ${podium.border} ${podium.bg} ${podium.glow}
                ${isCurrentUser ? 'ring-2 ring-indigo-500/50 bg-indigo-900/40' : ''}
              `}
            >
              {/* Position */}
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg bg-black/40">
                {position === 1 ? (
                  <div className="flex flex-col items-center">
                    <Trophy size={20} className="text-yellow-400" />
                  </div>
                ) : position === 2 ? (
                  <Award size={20} className="text-gray-400" />
                ) : position === 3 ? (
                  <Award size={20} className="text-orange-400" />
                ) : (
                  <span className={`font-bold text-lg ${podium.text}`}>{position}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-border/50">
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold truncate ${podium.text}`}>{hunter.display_name}</h3>
                  {isCurrentUser && (
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded whitespace-nowrap">
                      (Você)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Nível {hunter.level}</p>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-2 text-blue-400 font-mono text-sm">
                  <Flame size={14} className="text-orange-400" />
                  <span>{hunter.xp} XP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hunters.length === 0 && (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum caçador registrado ainda.</p>
        </div>
      )}
    </div>
  );
}
