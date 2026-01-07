import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { Button, Input, Card } from './UIComponents';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email ou faça login.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
             <span className="text-3xl font-bold text-white">3D</span>
          </div>
          <h1 className="text-3xl font-bold text-white">PrintCalc Manager</h1>
          <p className="text-slate-400 mt-2">Gerencie sua farm de impressão com inteligência.</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <form onSubmit={handleAuth} className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              {isSignUp ? 'Criar Conta' : 'Acessar Conta'}
            </h2>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-9 text-slate-500" size={18} />
                <Input 
                  label="Email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-10"
                  required
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-9 text-slate-500" size={18} />
                <Input 
                  label="Senha" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 py-3" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
              {isSignUp ? 'Cadastrar' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-slate-700 pt-4">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-sm text-slate-400 hover:text-white hover:underline transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};