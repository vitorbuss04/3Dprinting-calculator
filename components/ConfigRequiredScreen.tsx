import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, Sun, Moon, Database } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const ConfigRequiredScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-muted text-muted hover:text-ink transition-colors border border-hairline"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-xl bg-surface border border-hairline rounded-2xl p-6 sm:p-8 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-full bg-red/10 text-red">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-ink">
              Configuração Necessária
            </h1>
            <p className="text-muted text-xs sm:text-sm mt-0.5">
              Falta de variáveis de ambiente do Supabase
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          <p className="text-muted leading-relaxed">
            A aplicação não pôde ser inicializada porque as credenciais de acesso ao banco de dados 
            <strong> Supabase</strong> não foram fornecidas. Siga as instruções abaixo para resolver este problema.
          </p>

          {/* Local Development Section */}
          <div className="border-t border-hairline pt-5">
            <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-3">
              <Database size={18} className="text-primary" />
              Desenvolvimento Local
            </h2>
            <p className="text-muted text-xs mb-3 leading-relaxed">
              Crie um arquivo chamado <code className="bg-muted px-1.5 py-0.5 rounded select-all font-mono text-ink">.env</code> na raiz do projeto e configure as seguintes variáveis:
            </p>
            
            <div className="bg-canvas border border-hairline rounded-xl p-4 font-mono text-xs space-y-3 relative group">
              <div className="flex justify-between items-center text-muted border-b border-hairline pb-2 mb-2 font-sans">
                <span>Exemplo de .env</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-ink truncate font-mono select-all">VITE_SUPABASE_URL=https://seu-projeto.supabase.co</span>
                <button
                  onClick={() => copyToClipboard('VITE_SUPABASE_URL=https://seu-projeto.supabase.co', setCopiedUrl)}
                  className="p-1 hover:bg-muted text-muted hover:text-ink rounded transition-colors"
                  title="Copiar linha"
                >
                  {copiedUrl ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-ink truncate font-mono select-all">VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui</span>
                <button
                  onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui', setCopiedKey)}
                  className="p-1 hover:bg-muted text-muted hover:text-ink rounded transition-colors"
                  title="Copiar linha"
                >
                  {copiedKey ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Production Deployment Section */}
          <div className="border-t border-hairline pt-5">
            <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-3 font-sans">
              <svg className="w-[18px] h-[18px] text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Ambiente de Produção (Hospedagem)
            </h2>
            <p className="text-muted text-xs mb-3 leading-relaxed">
              Se você está rodando o app em produção (como Vercel, Netlify ou Cloudflare Pages), siga estes passos:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted text-xs leading-relaxed pl-1 font-sans">
              <li>
                Acesse o painel do seu provedor de hospedagem e abra as configurações do projeto.
              </li>
              <li>
                Procure a seção de <strong>Environment Variables</strong> (Variáveis de Ambiente).
              </li>
              <li>
                Adicione duas novas variáveis de ambiente:<br />
                <span className="inline-block mt-1 font-mono text-ink bg-muted px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</span> e <span className="inline-block mt-1 font-mono text-ink bg-muted px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</span>.
              </li>
              <li>
                Cole os valores obtidos na aba <strong>Project Settings &gt; API</strong> do painel do seu Supabase.
              </li>
              <li>
                Inicie um novo deploy (Redeploy) na plataforma de hospedagem para aplicar as novas variáveis.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
