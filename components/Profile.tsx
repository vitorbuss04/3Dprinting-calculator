import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { User, Lock, Mail, Fingerprint, Calendar, Loader2, Shield, Activity, Database, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
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
            toast.error('Por favor, digite uma nova senha.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            toast.success('Senha atualizada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao atualizar senha: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="font-technical text-[10px] text-slate-500 uppercase tracking-widest">CARREGANDO PERFIL...</span>
        </div>
    );
    
    if (!user) return (
        <div className="p-20 text-center">
            <div className="w-12 h-12 border border-red-900 mx-auto flex items-center justify-center mb-4 text-red-500">
                <Shield size={24} />
            </div>
            <h2 className="font-technical font-black text-white uppercase tracking-[0.2em]">ACESSO NEGADO</h2>
            <p className="font-technical text-[10px] text-slate-500 uppercase mt-2">NENHUMA SESSÃO ATIVA</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header: User Identification Unit */}
            <div className="bg-slate-950 border border-slate-900 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-700 group-hover:text-primary transition-colors">
                    <Fingerprint size={120} strokeWidth={1} />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-24 h-24 bg-slate-900 border border-slate-800 flex items-center justify-center text-white text-3xl font-black font-technical relative overflow-hidden">
                        {user.email?.charAt(0).toUpperCase()}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700" />
                    </div>
                    
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                             <h2 className="text-2xl font-technical font-black text-white uppercase tracking-[0.2em]">MEU PERFIL</h2>
                             <span className="px-2 py-0.5 border border-emerald-900/30 text-emerald-500 text-[10px] font-technical font-black uppercase tracking-widest bg-emerald-500/5">
                                SESSÃO ATIVA
                             </span>
                        </div>
                        <p className="font-technical text-slate-400 text-sm tracking-wide mb-4">{user.email}</p>
                        
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-[9px] font-technical text-slate-600 uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                                <Activity size={10} className="text-primary" /> FUNÇÃO: OPERADOR
                            </span>
                            <span className="flex items-center gap-2">
                                <Database size={10} className="text-secondary" /> DADOS: SINCRONIZADOS
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Section: System Metadata */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                         <span className="w-1.5 h-1.5 bg-secondary" />
                         <h3 className="font-technical font-black text-[11px] text-white uppercase tracking-[0.25em]">DADOS DA CONTA</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 border border-slate-900 bg-slate-900/10 flex gap-4">
                            <div className="w-10 h-10 border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600">
                                <Mail size={16} />
                            </div>
                            <div>
                                <p className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest mb-1.5">E-MAIL</p>
                                <p className="text-xs font-technical font-bold text-white uppercase tracking-wider">{user.email}</p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-900 bg-slate-900/10 flex gap-4">
                            <div className="w-10 h-10 border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600">
                                <Fingerprint size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest mb-1.5">ID DA CONTA</p>
                                <p className="text-[10px] font-technical font-bold text-slate-500 bg-slate-950 border border-slate-900 px-2 py-1.5 truncate">
                                    {user.id}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-900 bg-slate-900/10 flex gap-4">
                            <div className="w-10 h-10 border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest mb-1.5">DATA DE CADASTRO</p>
                                <p className="text-xs font-technical font-bold text-white uppercase tracking-wider">
                                    {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Security Purge / Update */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                         <span className="w-1.5 h-1.5 bg-primary" />
                         <h3 className="font-technical font-black text-[11px] text-white uppercase tracking-[0.25em]">ALTERAR SENHA</h3>
                    </div>

                    <Card variant="industrial" className="border-primary/20 p-8 space-y-8 bg-slate-950">
                        <div className="p-4 border border-primary/20 bg-primary/5 flex gap-4">
                            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] font-technical font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                PREENCHA OS CAMPOS ABAIXO PARA DEFINIR UMA NOVA SENHA.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="NOVA SENHA"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="font-technical"
                            />
                            <Input
                                label="CONFIRMAR SENHA"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="font-technical"
                            />

                            <div className="pt-4">
                                <Button 
                                    onClick={handleUpdatePassword} 
                                    disabled={isUpdating} 
                                    className="w-full font-technical font-black text-[11px] tracking-[0.2em]" 
                                    variant="primary"
                                >
                                    {isUpdating ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={14} /> SINCRONIZANDO...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 justify-center">
                                            <Key size={14} /> SALVAR NOVA SENHA
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
