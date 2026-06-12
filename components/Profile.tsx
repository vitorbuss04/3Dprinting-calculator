import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { User, Lock, Mail, Fingerprint, Calendar, Loader2, Shield, Activity, Database, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Password Update State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });
    }, []);

    const handleUpdatePassword = async () => {
        if (!newPassword) {
            toast.error(t('toast_enter_new_password'));
            return;
        }
        if (newPassword.length < 6) {
            toast.error(t('toast_password_too_short'));
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error(t('toast_passwords_do_not_match'));
            return;
        }

        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            toast.success(t('toast_password_updated'));
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error(error);
            toast.error(t('toast_password_update_error') + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const locale = i18n.language === 'en' ? 'en-US' : 'pt-BR';

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="font-sans text-xs text-muted uppercase tracking-wider">{t('loading_profile')}</span>
        </div>
    );
    
    if (!user) return (
        <div className="p-20 text-center">
            <div className="w-12 h-12 border border-red mx-auto flex items-center justify-center mb-4 text-red">
                <Shield size={24} />
            </div>
            <h2 className="font-sans font-semibold text-ink">{t('access_denied')}</h2>
            <p className="font-sans text-xs text-muted mt-2">{t('no_active_session')}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header: User Identification Unit */}
            <div className="bg-canvas border border-hairline rounded-2xl p-8 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-muted group-hover:text-primary transition-colors">
                    <Fingerprint size={120} strokeWidth={1} />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-surface-soft border border-hairline rounded-full flex items-center justify-center text-muted text-3xl font-sans font-semibold relative overflow-hidden">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                             <h2 className="text-2xl font-sans font-semibold text-ink">{t('my_profile')}</h2>
                             <span className="px-3 py-1 border border-green/20 text-green text-[11px] font-sans font-medium rounded-full bg-green/5">
                                {t('active_session')}
                             </span>
                        </div>
                        <p className="font-sans text-muted text-sm mb-4">{user.email}</p>
                        
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs font-sans text-muted">
                            <span className="flex items-center gap-2">
                                <Activity size={12} className="text-primary" /> {t('role_operator')}
                            </span>
                            <span className="flex items-center gap-2">
                                <Database size={12} className="text-green" /> {t('data_synchronized')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section: System Metadata */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-hairline pb-3">
                          <span className="w-1.5 h-1.5 bg-green rounded-full" />
                          <h3 className="font-sans font-medium text-xs text-muted uppercase tracking-wider">{t('account_data')}</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 border border-hairline bg-surface-soft rounded-2xl flex gap-4">
                            <div className="w-10 h-10 border border-hairline bg-canvas rounded-lg flex items-center justify-center text-muted">
                                <Mail size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider mb-1">{t('email')}</p>
                                <p className="text-sm font-sans font-medium text-ink">{user.email}</p>
                            </div>
                        </div>

                        <div className="p-4 border border-hairline bg-surface-soft rounded-2xl flex gap-4">
                            <div className="w-10 h-10 border border-hairline bg-canvas rounded-lg flex items-center justify-center text-muted">
                                <Fingerprint size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider mb-1">{t('account_id')}</p>
                                <p className="text-xs font-sans text-muted bg-canvas border border-hairline px-3 py-1.5 rounded-lg truncate">
                                    {user.id}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-hairline bg-surface-soft rounded-2xl flex gap-4">
                            <div className="w-10 h-10 border border-hairline bg-canvas rounded-lg flex items-center justify-center text-muted">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider mb-1">{t('registration_date')}</p>
                                <p className="text-sm font-sans font-medium text-ink">
                                    {new Date(user.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Security Purge / Update */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-hairline pb-3">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <h3 className="font-sans font-medium text-xs text-muted uppercase tracking-wider">{t('change_password')}</h3>
                    </div>

                    <Card variant="default" className="p-8 space-y-6 border border-hairline">
                        <div className="p-4 border border-primary/20 bg-primary-soft/30 rounded-xl flex gap-4">
                            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
                            <p className="text-xs font-sans text-muted leading-relaxed">
                                {t('fill_fields_new_password')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label={t('new_password')}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            <Input
                                label={t('confirm_password')}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />

                            <div className="pt-2">
                                <Button 
                                    onClick={handleUpdatePassword} 
                                    disabled={isUpdating} 
                                    className="w-full text-sm h-11" 
                                    variant="primary"
                                >
                                    {isUpdating ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={14} /> {t('syncing')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 justify-center">
                                            <Key size={14} /> {t('save_new_password')}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
