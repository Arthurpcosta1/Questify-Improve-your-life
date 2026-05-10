import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';
import { Loader2, Sword, UserCircle2 } from 'lucide-react';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: 'Caçador'
            }
          }
        });
        if (error) throw error;
        toast.success('Registro concluído! Bem-vindo ao Sistema.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Despertar concluído. Bem-vindo de volta.');
      }
    } catch (error: any) {
      toast.error(error.message === 'Invalid login credentials' 
        ? 'Credenciais inválidas. Tente novamente.' 
        : error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  // --- NOVA FUNÇÃO DE CONVIDADO ---
  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast.success('Acesso de Convidado liberado. Bem-vindo ao Sistema!');
    } catch (error: any) {
      toast.error('Erro ao entrar como convidado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#0f0f0f] overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: 'url(/solo-leveling.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />

      <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.1)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Sword className="text-blue-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wider">QUESTIFY</h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">
            {isSignUp ? 'Inicie sua Jornada' : 'Acesse o Sistema'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-lg bg-[#0f0f0f]/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-[#0f0f0f]/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Criar Perfil' : 'Despertar')}
          </button>
        </form>

        {/* --- BOTÃO DE CONVIDADO --- */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-transparent hover:bg-white/5 border border-white/20 text-gray-300 hover:text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <UserCircle2 className="w-5 h-5" />
            Entrar como Convidado
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
          >
            {isSignUp 
              ? 'Já possui acesso? Retorne ao Sistema.' 
              : 'Novo Caçador? Registre-se aqui.'}
          </button>
        </div>
      </div>
    </div>
  );
}