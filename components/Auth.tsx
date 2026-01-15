import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Toast not needed for login success as standard behavior
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Verifique seu e-mail para confirmar o cadastro!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center p-4 dark:bg-dark-bg">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card variant="glass" className="w-full max-w-md relative z-10 p-8 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-white font-black text-2xl">3D</span>
          </div>

          <h1 className="text-2xl font-black text-gray-800 tracking-tight dark:text-gray-100">Bem-vindo(a)</h1>
          <p className="text-gray-500 mt-2 text-sm dark:text-gray-400">Gerencie seus projetos 3D com precisão profissional.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />

          <Button
            type="submit"
            className="w-full h-12 text-base shadow-xl shadow-blue-500/20"
            isLoading={loading}
          >
            {isLogin ? 'Entrar na Conta' : 'Criar Nova Conta'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/10"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400 text-xs uppercase font-bold tracking-wider dark:bg-transparent dark:text-gray-500">Ou</span></div>
          </div>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-600 hover:text-blue-600 font-bold transition-colors dark:text-gray-400 dark:hover:text-blue-400"
          >
            {isLogin ? (
              <>Não tem uma conta? <span className="text-blue-600">Registre-se</span></>
            ) : (
              <>Já tem uma conta? <span className="text-blue-600">Entrar</span></>
            )}
          </button>
        </div>
      </Card >
    </div >
  );
};