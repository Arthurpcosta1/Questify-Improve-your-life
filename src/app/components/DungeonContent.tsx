import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Timer, Skull, ArrowRight, AlertTriangle, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import dungeonBg from '../../assets/images/dungeon-bg.jpg.png';

// Áudio: links públicos (Google)
const ALARM_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const BG_URL = 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg';

export function DungeonContent() {
  // Estados e refs SEMPRE no topo
  const [viewState, setViewState] = useState<'selection' | 'active' | 'completed'>('selection');
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonType | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [pendingDungeon, setPendingDungeon] = useState<DungeonType | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [ambientSound, setAmbientSound] = useState('/ruidomarrom.mp3.mp3');
  const [bgVolume, setBgVolume] = useState(0.3);
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const alarmAudioRef = useRef<HTMLAudioElement>(null);
  const visibilityWarningRef = useRef(false);
  const antiCheatTriggeredRef = useRef(false);

  // Inicializa refs de áudio apenas uma vez
  useEffect(() => {
    // Não é necessário inicializar nada, refs já apontam para os elementos <audio>
  }, []);

  // Controle de áudio de fundo
  const isActive = viewState === 'active' && timeLeft > 0 && !isPaused;
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;
    audio.volume = bgVolume;
    if (isActive && isAudioEnabled) {
      audio.play().catch(e => console.warn('Bloqueado:', e));
    } else {
      audio.pause();
    }
  }, [isActive, isAudioEnabled, ambientSound, bgVolume]);

  // Reinicia o áudio ao trocar de faixa
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (audio && isAudioEnabled && isActive) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Bloqueado:', e));
    }
  }, [ambientSound]);

  type DungeonState = 'selection' | 'active' | 'completed';

  interface DungeonType {
    id: string;
    name: string;
    rank: 'C' | 'A';
    durationSeconds: number; // 25min = 1500, 50min = 3000
    xpReward: number;
    goldReward: number;
    bgPosition: string; // CSS background position for sprite
    color: string;
    description: string;
  }

  // background image for dungeons
  const dungeonAssets = dungeonBg;

  const DUNGEONS: DungeonType[] = [
    {
      id: 'rank_c',
      name: 'Foco Rápido',
      rank: 'C',
      durationSeconds: 25 * 60,
      xpReward: 100,
      goldReward: 50,
      bgPosition: '0% 0%', // Top-Left (Blue Rune)
      color: 'text-cyan-400',
      description: 'Um teste de concentração curto para tarefas rápidas.',
    },
    {
      id: 'rank_a',
      name: 'Imersão Profunda',
      rank: 'A',
      durationSeconds: 50 * 60,
      xpReward: 250,
      goldReward: 120,
      bgPosition: '100% 0%', // Top-Right (Red Portal)
      color: 'text-red-500',
      description: 'Uma jornada perigosa no abismo do foco absoluto.',
    },
  ];

  const { gainRewards, takeDamage, playerStats } = useGame();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (viewState === 'active' && timeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && viewState === 'active') {
      handleCompleteDungeon();
    }

    return () => clearInterval(interval);
  }, [viewState, timeLeft, isPaused]);

  // Anti-Cheat Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && viewState === 'active' && !antiCheatTriggeredRef.current) {
        antiCheatTriggeredRef.current = true;
        handleCriticalFailure("Distração Detectada (Aba em segundo plano)");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [viewState]);

  const handleDungeonClick = (dungeon: DungeonType) => {
    setPendingDungeon(dungeon);
    setIsWarningOpen(true);
  };

  const confirmStartDungeon = () => {
    if (pendingDungeon) {
      startDungeon(pendingDungeon);
      setIsWarningOpen(false);
      setPendingDungeon(null);
    }
  };

  const startDungeon = (dungeon: DungeonType) => {
    setSelectedDungeon(dungeon);
    setTimeLeft(dungeon.durationSeconds);
    setViewState('active');
    toast.info(`Masmorra ${dungeon.rank} iniciada! Não saia desta tela.`);
  };

  const handleCompleteDungeon = async () => {
    if (!selectedDungeon) return;
    setViewState('completed');

    // Recompensa fixa: +50 XP, +20 Ouro
    const xpReward = 50;
    const goldReward = 20;
    gainRewards(xpReward, goldReward, 'INT');

    // Toca alarme
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch(e => console.warn('Áudio bloqueado:', e));
    }

    // Atualiza profiles no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const finalUserId = user?.id || '50bbc680-ac42-4409-b635-91350966be33';
    await supabase.from('profiles').update({
      xp: playerStats.xp + xpReward,
      gold: playerStats.gold + goldReward,
      updated_at: new Date().toISOString(),
    }).eq('id', finalUserId);

    // Log no history_logs
    await supabase.from('history_logs').insert({
      user_id: finalUserId,
      action_type: 'Masmorra Concluída',
      task_name: selectedDungeon.name,
      impact_value: `Sobreviveu à Masmorra e ganhou ${goldReward} de Ouro e ${xpReward} de XP`,
      created_at: new Date().toISOString(),
    });

    toast.success(`Sobreviveu à Masmorra! +${goldReward} Ouro, +${xpReward} XP.`);
  };

  const handleFlee = async () => {
    if (!selectedDungeon) return;

    const damage = 15;
    // HP não pode descer abaixo de 0
    const newHp = Math.max(playerStats.hp - damage, 0);

    // Atualiza profiles no Supabase primeiro, só depois atualiza contexto
    const { data: { user } } = await supabase.auth.getUser();
    const finalUserId = user?.id || '50bbc680-ac42-4409-b635-91350966be33';
    const { error } = await supabase.from('profiles').update({
      hp: newHp,
      updated_at: new Date().toISOString(),
    }).eq('id', finalUserId);

    if (!error) {
      takeDamage(damage); // Atualiza contexto local
      setViewState('selection');

      // Log no history_logs
      await supabase.from('history_logs').insert({
        user_id: finalUserId,
        action_type: 'Fuga da Masmorra',
        task_name: selectedDungeon.name,
        impact_value: 'Fugiu da Masmorra e perdeu 15 de HP',
        created_at: new Date().toISOString(),
      });

      toast.error('Você fugiu da masmorra! -15 HP.');
    } else {
      toast.error('Erro ao atualizar HP no servidor. Tente novamente.');
    }
  };

  const handleCriticalFailure = async (reason: string) => {
    if (!selectedDungeon) return;

    const damage = 30;
    takeDamage(damage);
    setViewState('selection');
    // Cancela cronômetro e impede novas punições
    antiCheatTriggeredRef.current = true;

    await logDungeonEvent(selectedDungeon.name, `Falha Crítica: ${reason}`, 'red');
    toast.error(`FALHA CRÍTICA! Você perdeu o foco. -${damage} HP.`);
  };

  const logDungeonEvent = async (
    dungeonName: string,
    status: string,
    color: string,
    xpValue?: number,
    goldValue?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalUserId = user?.id || '50bbc680-ac42-4409-b635-91350966be33';

      let impactValue = '';
      if (status.includes('Concluída')) {
        impactValue = `+${xpValue} XP, +${goldValue} Gold`;
      } else if (status.includes('Fuga')) {
        impactValue = '-20 HP';
      } else if (status.includes('Falha Crítica')) {
        impactValue = '-30 HP';
      }

      const { error } = await supabase.from('history_logs').insert({
        user_id: finalUserId,
        action_type: status.includes('Concluída')
          ? 'Masmorra Concluída'
          : 'Falha na Masmorra',
        task_name: dungeonName,
        impact_value: impactValue,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      }
    } catch (e) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (viewState === 'selection') {
    return (
      <>
        <div className="animate-in fade-in duration-500 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Skull className="text-purple-500" size={32} />
                    Masmorras de Foco
                </h1>
                <p className="text-muted-foreground mt-2">
                    Entre em um estado de foco profundo. <span className="text-red-400 font-bold">Aviso:</span> Sair da tela ou trocar de aba causará dano real ao seu HP.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {DUNGEONS.map((dungeon) => (
                    <div 
                        key={dungeon.id}
                        onClick={() => handleDungeonClick(dungeon)}
                        className="group relative h-[400px] rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/20"
                    >
                        {/* Background Image Sprite Logic */}
                        <div 
                            className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 opacity-60"
                            style={{
                                backgroundImage: `url(${dungeonAssets})`,
                                backgroundPosition: dungeon.bgPosition,
                                backgroundSize: '200% 200%', // Since it's a 2x2 grid
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold bg-black/50 border border-white/10 mb-2 ${dungeon.color}`}>
                                        RANK {dungeon.rank}
                                    </span>
                                    <h2 className={`text-3xl font-bold text-white mb-2 group-hover:text-shadow-lg`}>
                                        {dungeon.name}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono font-bold text-white">
                                        {dungeon.durationSeconds / 60} min
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-6 line-clamp-2">
                                {dungeon.description}
                            </p>

                            <div className="flex items-center gap-4 text-xs font-mono text-gray-400 bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/5">
                                <span className="flex items-center gap-1">
                                    <span className="text-blue-400">XP</span> +{dungeon.xpReward}
                                </span>
                                <span className="w-px h-3 bg-gray-600"></span>
                                <span className="flex items-center gap-1">
                                    <span className="text-yellow-400">GOLD</span> +{dungeon.goldReward}
                                </span>
                            </div>
                        </div>

                        {/* Neon Glow Border */}
                        <div className={`absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none ${dungeon.rank === 'C' ? 'border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.5)]' : 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]'}`} />
                    </div>
                ))}
            </div>

            <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
              <AlertDialogContent className="bg-[#1a1a1a] border-red-900/50 text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                     <AlertTriangle className="h-5 w-5" />
                     ⚠️ Aviso do Sistema
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400 mt-2">
                    Ao confirmar, você entrará em foco profundo. Tentar sair desta tela ou mudar de aba no navegador causará dano real imediato ao seu HP.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="bg-transparent border-white/10 text-muted-foreground hover:text-white hover:bg-white/5">
                    Recuar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmStartDungeon}
                    className="bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_0_20px_rgba(220,38,38,0.4)] px-4 py-2 rounded"
                  >
                    Aceitar o Desafio
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {/* Elementos de áudio ocultos */}
          <audio ref={bgAudioRef} src={ambientSound} loop preload="auto" style={{ display: 'none' }} />
          <audio ref={alarmAudioRef} src="/alarme.mp3.mp3" preload="auto" style={{ display: 'none' }} />
          </>
    );
  }

  // Active State (Timer)
  return (
    <>
      <div className="min-h-[80vh] flex flex-col items-center justify-center relative animate-in zoom-in-95 duration-500">
          {/* Background Ambient */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 opacity-20 blur-sm"
              style={{
                backgroundImage: `url(${dungeonAssets})`,
                backgroundPosition: selectedDungeon?.bgPosition,
                backgroundSize: '200% 200%',
                filter: 'grayscale(50%)'
              }}
            />
            <div className="absolute inset-0 bg-[#0f0f0f]/90" />
          </div>

          <div className="relative z-10 text-center space-y-12 max-w-2xl w-full px-4">
            <div className="space-y-4">
              <span className={`inline-block text-xl font-bold tracking-[0.5em] uppercase ${selectedDungeon?.color} animate-pulse`}>
                Masmorra em Progresso
              </span>
              <h2 className="text-5xl font-bold text-white">{selectedDungeon?.name}</h2>
            </div>

            {/* Timer Display */}
            {/* Controles de áudio fixos no topo direito da tela */}
            <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-black/60 rounded-full px-3 py-2 border border-white/10 shadow-lg">
              <button
                onClick={() => setIsAudioEnabled((v) => !v)}
                className="rounded-full p-2 hover:bg-blue-900/40 transition-colors"
                title={isAudioEnabled ? 'Desligar áudio' : 'Ligar áudio'}
              >
                {isAudioEnabled ? <Volume2 size={22} className="text-blue-400" /> : <VolumeX size={22} className="text-muted-foreground" />}
              </button>
              <select
                value={ambientSound}
                onChange={e => setAmbientSound(e.target.value)}
                className="bg-black/70 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none"
                style={{ minWidth: 90 }}
                title="Escolher som ambiente"
              >
                <option value="/ruidomarrom.mp3.mp3">Ruído Marrom</option>
                <option value="/chuva.mp3.mp3">Chuva</option>
              </select>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={bgVolume}
                onChange={e => setBgVolume(Number(e.target.value))}
                className="w-[70px] h-2 bg-neutral-800 rounded appearance-none outline-none"
                style={{ accentColor: '#3b82f6' }}
                title="Volume do ambiente"
              />
            </div>
            <div className="relative py-12">
              <div className={`text-9xl font-mono font-bold tracking-tighter text-white tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)`}>
                {formatTime(timeLeft)}
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full -z-10 animate-pulse" />
            </div>

            {/* Warnings */}
            <div className="flex items-center justify-center gap-3 text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-xl">
              <ShieldAlert size={24} />
              <p className="text-sm font-medium">
                <span className="font-bold">ANTI-TRAPAÇA ATIVO:</span> Não minimize a janela ou troque de aba. Penalidade: -30 HP.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center pt-8">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleFlee}
                className="border-red-500/30 hover:bg-red-950/50 hover:text-red-400 text-muted-foreground min-w-[200px] h-14"
              >
                <AlertTriangle className="mr-2" size={20} />
                Desistir / Fugir (-20 HP)
              </Button>
            </div>
          </div>
        </div>
        {/* Elementos de áudio ocultos */}
        <audio ref={bgAudioRef} src={ambientSound} loop preload="auto" style={{ display: 'none' }} />
        <audio ref={alarmAudioRef} src="/alarme.mp3.mp3" preload="auto" style={{ display: 'none' }} />
    </>
  );
}
