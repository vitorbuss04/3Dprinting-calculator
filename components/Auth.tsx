import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Mail, ShieldCheck, Database } from 'lucide-react';
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
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4 relative overflow-hidden">
      <Card variant="default" className="w-full max-w-md relative z-10 p-0 overflow-hidden border border-hairline shadow-md">
        <div className="p-8 border-b border-hairline bg-surface-soft text-center">
          <div className="w-12 h-12 bg-primary rounded-2xl mx-auto flex items-center justify-center mb-4 text-white font-sans font-bold text-lg shadow-sm">
            3D
          </div>

          <h1 className="text-xl font-sans font-medium text-ink tracking-tight">{t('login_area')}</h1>
          <p className="text-xs font-sans text-muted mt-2">{t('system_desc')}</p>
        </div>

        <div className="p-8 space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              label={t('your_email_label')}
              type="email"
              placeholder={t('email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} className="text-muted" />}
              required
            />
            <Input
              label={t('your_password_label')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<ShieldCheck size={16} className="text-muted" />}
              required
            />

            <Button
              type="submit"
              className="w-full h-11 text-sm font-sans font-medium mt-6"
              isLoading={loading}
            >
              {isLogin ? t('login_action') : t('register_action')}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-hairline" />
              <span className="text-xs font-sans font-medium text-muted uppercase tracking-wider">{t('or_divider')}</span>
              <div className="h-[1px] flex-1 bg-hairline" />
            </div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-sans text-muted hover:text-ink transition-colors flex items-center justify-center w-full gap-1"
            >
              {isLogin ? (
                <>{t('dont_have_account')} <span className="text-primary hover:underline font-medium">{t('register')}</span></>
              ) : (
                <>{t('already_have_account')} <span className="text-primary hover:underline font-medium">{t('do_login')}</span></>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-hairline bg-surface-soft flex justify-between items-center px-8 text-[11px] font-sans text-muted">
            <div className="flex items-center gap-2">
                <Database size={12} />
                <span>{t('sync_active_caps')}</span>
            </div>
            <span>{t('system_ref_code')}</span>
        </div>
      </Card >
    </div>
  );
};