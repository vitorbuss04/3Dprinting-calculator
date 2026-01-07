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
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
             <span className="text-3xl font-bold text-white">3D</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PrintCalc Manager</h1>
          <p className="text-gray-500 mt-2">Gerencie sua farm de impressão com inteligência.</p>
        </div>

        <Card className="bg-white border-gray-200 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleAuth} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              {isSignUp ? 'Criar Conta' : 'Acessar Conta'}
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-9 text-gray-400" size={18} />
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
                <Lock className="absolute left-3 top-9 text-gray-400" size={18} />
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

            <Button type="submit" className="w-full mt-6 py-3 shadow-md" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
              {isSignUp ? 'Cadastrar' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-sm text-gray-500 hover:text-blue-600 hover:underline transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};