import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export const Auth: React.FC = () => {
  const { t } = useTranslation();
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
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t('pending_registration'));
      }
    } catch (error: any) {
      toast.error(error.message || t('auth_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Grids */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 0), linear-gradient(90deg, #fff 1px, transparent 0)', backgroundSize: '160px 160px' }} />

      <Card variant="industrial" className="w-full max-w-md relative z-10 p-0 overflow-hidden border-t-2 border-t-primary">
        <div className="p-8 border-b border-slate-900 bg-slate-900/30 text-center">
          <div className="w-14 h-14 border-2 border-primary mx-auto flex items-center justify-center mb-6 relative group shadow-[0_0_15px_rgba(255,92,0,0.1)]">
            <span className="text-white font-technical font-black text-2xl">3D</span>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary" />
          </div>

          <h1 className="text-xl font-technical font-black text-white tracking-[0.2em] uppercase">{t('login_area')}</h1>
          <p className="text-[10px] font-technical text-slate-500 mt-2 uppercase tracking-widest">{t('system_desc')}</p>
        </div>

        <div className="p-8 space-y-8">
          <form onSubmit={handleAuth} className="space-y-6">
            <Input
              label={t('your_email_label')}
              type="email"
              placeholder={t('email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={14} className="text-primary" />}
              className="font-technical uppercase text-[10px]"
              required
            />
            <Input
              label={t('your_password_label')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<ShieldCheck size={14} className="text-secondary" />}
              className="font-technical uppercase text-[10px]"
              required
            />

            <Button
              type="submit"
              className="w-full h-12 text-sm font-technical font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,92,0,0.1)]"
              isLoading={loading}
            >
              {isLogin ? t('login_action') : t('register_action')}
            </Button>
          </form>

          <div className="text-center space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-900" />
              <span className="text-[10px] font-technical font-bold text-slate-700 uppercase tracking-widest">{t('or_divider')}</span>
              <div className="h-[1px] flex-1 bg-slate-900" />
            </div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-technical font-black text-slate-500 hover:text-white uppercase tracking-[0.15em] transition-colors flex items-center justify-center w-full gap-2"
            >
              {isLogin ? (
                <>{t('dont_have_account')} <span className="text-primary underline">{t('register')}</span></>
              ) : (
                <>{t('already_have_account')} <span className="text-primary underline">{t('do_login')}</span></>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-900 bg-slate-900/10 flex justify-between items-center px-8">
            <div className="flex items-center gap-2">
                <Database size={10} className="text-slate-600" />
                <span className="text-[8px] font-technical font-bold text-slate-600 uppercase tracking-widest">{t('sync_active_caps')}</span>
            </div>
            <span className="text-[8px] font-technical font-bold text-slate-700 uppercase tracking-widest leading-none">{t('system_ref_code')}</span>
        </div>
      </Card >
    </div >
  );
};