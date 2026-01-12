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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-400/50 transform hover:scale-110 transition-transform">
             <span className="text-4xl font-black text-white drop-shadow-lg">3D</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">PrintCalc Manager</h1>
          <p className="text-gray-400 font-medium mt-2">Gestão inteligente para sua farm 3D.</p>
        </div>

        <Card className="bg-white shadow-2xl shadow-gray-300/60 p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 mb-2 text-center tracking-tight">
              {isSignUp ? 'Criar Conta' : 'Boas-vindas!'}
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Input 
                label="Email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                icon={<Mail size={18} className="drop-shadow-sm" />}
                placeholder="seu@email.com"
                required
              />
              
              <Input 
                label="Senha" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                icon={<Lock size={18} className="drop-shadow-sm" />}
                placeholder="Sua senha secreta"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full mt-2 py-4 shadow-2xl shadow-blue-500/30" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <UserPlus size={20} className="drop-shadow-sm" /> : <LogIn size={20} className="drop-shadow-sm" />)}
              {isSignUp ? 'Criar minha conta' : 'Entrar no Dashboard'}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-gray-50 pt-6">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              {isSignUp ? 'Já possui acesso? Clique aqui' : 'Novo por aqui? Cadastre-se'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};