import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { User, Lock, Mail, Fingerprint, Calendar, Loader2 } from 'lucide-react';
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

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Info */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-xl shadow-blue-500/10 border border-white/20 flex flex-col md:flex-row items-center gap-6 text-center md:text-left dark:bg-dark-surface/50 dark:border-white/10 dark:shadow-none">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-blue-500/30 transform rotate-3">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight dark:text-gray-100">Meu Perfil</h2>
                    <p className="text-gray-500 font-medium text-lg dark:text-gray-400">{user.email}</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Conta Ativa
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Details */}
                <Card title="Detalhes da Conta" variant="glass" className="h-full">
                    <div className="space-y-6">
                        <div className="flex gap-4 items-center">
                            <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600 shadow-sm dark:bg-blue-500/20 dark:text-blue-400"><Mail size={22} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 dark:text-gray-500">Email</p>
                                <p className="text-gray-800 font-bold text-sm truncate dark:text-gray-200" title={user.email}>{user.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="p-3.5 bg-purple-50 rounded-2xl text-purple-600 shadow-sm dark:bg-purple-500/20 dark:text-purple-400"><Fingerprint size={22} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 dark:text-gray-500">ID do Usuário</p>
                                <p className="font-mono text-gray-600 text-xs bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 truncate block dark:bg-white/5 dark:text-gray-400 dark:border-white/10">
                                    {user.id}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="p-3.5 bg-orange-50 rounded-2xl text-orange-600 shadow-sm dark:bg-orange-500/20 dark:text-orange-400"><Calendar size={22} /></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 dark:text-gray-500">Membro Desde</p>
                                <p className="text-gray-800 font-bold text-sm dark:text-gray-200">
                                    {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Security / Password */}
                <Card title="Segurança" variant="glass" className="h-full">
                    <div className="bg-amber-50/80 rounded-2xl p-4 mb-6 border border-amber-100/50 flex gap-3 items-start dark:bg-amber-900/10 dark:border-amber-500/10">
                        <Lock size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium dark:text-amber-500">
                            Para maior segurança, escolha uma senha forte. Logins em outros dispositivos poderão ser encerrados.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Nova Senha"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <Input
                            label="Confirmar Senha"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />

                        <div className="pt-2">
                            <Button onClick={handleUpdatePassword} disabled={isUpdating} className="w-full" variant="primary">
                                {isUpdating ? 'Atualizando...' : 'Atualizar Senha'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
