import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

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

  const neuMain = "bg-[#f0f0f0]";
  const neuShadowOut = "shadow-[10px_10px_30px_#d1d1d1,-10px_-10px_30px_#ffffff]";
  const neuShadowIn = "shadow-[inset_6px_6px_20px_#d1d1d1,inset_-6px_-6px_20px_#ffffff]";
  const neuButton = "shadow-[6px_6px_15px_#d1d1d1,-6px_-6px_15px_#ffffff] active:shadow-[inset_4px_4px_10px_#d1d1d1,inset_-4px_-4px_10px_#ffffff] active:scale-[0.97] transition-all duration-300 ease-in-out cursor-pointer";

  return (
    <div className={`min-h-screen ${neuMain} flex items-center justify-center p-4 font-sans`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className={`${neuMain} ${neuShadowOut} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-500 ease-out`}>
             <span className="text-4xl font-black text-blue-600 drop-shadow-sm">3D</span>
          </div>
          <h1 className="text-3xl font-black text-gray-700 tracking-tighter uppercase">PrintCalc Manager</h1>
          <p className="text-gray-500 font-bold text-xs mt-2 uppercase tracking-widest opacity-80">Sistema de Gestão de Farm</p>
        </div>

        <div className={`${neuMain} ${neuShadowOut} rounded-[40px] p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-150`}>
          <form onSubmit={handleAuth} className="space-y-8">
            <h2 className="text-xl font-black text-gray-600 mb-2 text-center tracking-tight uppercase transition-opacity duration-300">
              {isSignUp ? 'Nova Conta' : 'Bem-vindo de volta'}
            </h2>
            
            {error && (
              <div className="bg-red-50/50 border border-red-100 text-red-600 text-[10px] font-black p-3 rounded-2xl flex items-center gap-2 uppercase tracking-tighter animate-in slide-in-from-top-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">E-mail</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nome@email.com"
                    className={`w-full ${neuMain} ${neuShadowIn} border-none text-gray-700 rounded-2xl py-4 pl-14 pr-6 outline-none transition-all placeholder-gray-400 text-sm font-bold focus:ring-1 focus:ring-blue-500/10`}
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Chave de Acesso</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full ${neuMain} ${neuShadowIn} border-none text-gray-700 rounded-2xl py-4 pl-14 pr-6 outline-none transition-all placeholder-gray-400 text-sm font-bold focus:ring-1 focus:ring-blue-500/10`}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 ${neuMain} ${neuButton}`}
              disabled={loading}
            >
              <div className={`flex items-center gap-3 transition-transform duration-300 ${loading ? 'scale-90' : 'scale-100'}`}>
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    {isSignUp ? <UserPlus size={18} className="transition-all" /> : <LogIn size={18} className="transition-all" />}
                    <span className="animate-in fade-in duration-300">
                      {isSignUp ? 'Criar Conta' : 'Entrar'}
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-10 text-center border-t border-gray-200/50 pt-8">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-[9px] font-black text-gray-400 hover:text-blue-600 active:opacity-60 transition-all uppercase tracking-[0.3em]"
            >
              {isSignUp ? 'Mudar para Login' : 'Criar uma conta'}
            </button>
          </div>
        </div>

        <p className="text-center mt-12 text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-50 animate-pulse">
          Ambiente Seguro &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};