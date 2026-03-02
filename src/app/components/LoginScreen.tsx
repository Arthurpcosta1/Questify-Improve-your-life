import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Loader2, ArrowRight, UserPlus, LogIn } from 'lucide-react';

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
        });
        if (error) throw error;
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-border/50 rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold mx-auto mb-4">
            RPG
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isSignUp 
              ? 'Comece sua jornada de produtividade gamificada.' 
              : 'Faça login para continuar sua evolução.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0f0f0f] border-border/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0f0f0f] border-border/50"
              required
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              isSignUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />
            )}
            {isSignUp ? 'Cadastrar' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar agora'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
