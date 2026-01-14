import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Card, Input, Button } from './UIComponents';
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
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header Info */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-100 border border-blue-50 flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Meu Perfil</h2>
                    <p className="text-gray-500 font-medium">{user.email}</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100">
                        Conta Ativa
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Details */}
                <Card title="Detalhes da Conta" className="h-full">
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 h-fit"><Mail size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                                <p className="text-gray-800 font-medium text-sm break-all">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 h-fit"><Fingerprint size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ID do Usuário</p>
                                <p className="font-mono text-gray-800 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">{user.id}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="p-3 bg-orange-50 rounded-xl text-orange-600 h-fit"><Calendar size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Membro Desde</p>
                                <p className="text-gray-800 font-medium text-sm">
                                    {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Security / Password */}
                <Card title="Segurança" className="h-full">
                    <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100 flex gap-3 items-start">
                        <Lock size={24} className="text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Para maior segurança, escolha uma senha forte. Se você alterar sua senha, poderá ser necessário fazer login novamente em outros dispositivos.
                        </p>
                    </div>

                    <div className="space-y-2">
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

                        <div className="pt-4">
                            <Button onClick={handleUpdatePassword} disabled={isUpdating} className="w-full">
                                {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Atualizar Senha'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
