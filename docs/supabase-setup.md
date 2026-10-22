# Contas Supabase e limite semanal

O login e cadastro usam e-mail/senha no Supabase Auth. Contas já criadas nesse projeto podem entrar diretamente. A aplicação não guarda contas fictícias ou senhas no localStorage. O nome de exibição pode ser fictício; com confirmação de e-mail habilitada, o endereço precisa receber o link.

## Ativação no projeto NOSSOM

1. Projeto: `https://iaavcsyoybnswtfnrvtu.supabase.co`.
2. Em Supabase → Settings → API Keys, copie a chave **publishable** (ou anon legada). Na Vercel → NOSSOM → Settings → Environment Variables, defina `SUPABASE_URL` com essa URL e `SUPABASE_ANON_KEY` com a chave pública. Os aliases `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` também são aceitos. Não use service_role como chave pública.
3. Preserve o segredo privado `NOSSOM_AUTH_SECRET` (32 caracteres aleatórios recomendados). A instalação existente pode continuar usando `NOSSOM_AI_ACCESS_CODE` como fallback privado; esse valor não é mais solicitado na interface. Alterá-lo invalida sessões, sem apagar contas Supabase.
4. Aplique `supabase/migrations/202610220001_accounts_and_weekly_usage.sql` pelo SQL Editor do projeto ou por `supabase db push` com o projeto vinculado. A migração não modifica usuários existentes e não exige chave service_role na aplicação.
5. Supabase → Authentication → URL Configuration: Site URL `https://nossom-teal.vercel.app`; adicione `https://nossom-teal.vercel.app/auth/confirm` à lista de redirects. Mantenha confirmação de e-mail habilitada. Configure SMTP para convites/cadastros públicos além dos limites do serviço de e-mail padrão do Supabase.
6. Entre com `victorbarrosoc@gmail.com` e confirme o endereço no Supabase. Não provisionamos uma senha nem alteramos uma conta existente. A conta ADM será reconhecida automaticamente pelo e-mail confirmado; `user_metadata`, nome, parâmetros de URL e corpo do pedido não concedem esse papel.
7. Faça novo deploy após configurar as variáveis. O diagnóstico público `GET /api/account?verify=1` verifica as credenciais e a presença da função de quota sem criar usuários, enviar e-mails ou gerar chamadas pagas; retorna apenas indicadores de disponibilidade. A chave Anthropic e o agente são da plataforma, configurados uma vez no servidor conforme `docs/claude-setup.md`. Usuários nunca preenchem IDs, API keys ou código de conexão.

## Cota

Cada autorização para iniciar uma aplicação de tratamento consome um dos **10 tratamentos semanais**. Desfazer, refazer, importar, reproduzir, restaurar o original e exportar versões salvas não consomem tratamentos. Um cancelamento/falha depois da autorização não devolve automaticamente o uso. A interface consulta e mostra o saldo; falha de consulta/autorização bloqueia novos tratamentos, preservando acesso aos projetos.

A semana começa segunda-feira à 0h de `America/Fortaleza` (Brasília). O contador é por `auth.uid()`, no PostgreSQL, e persiste entre dispositivos, novos logins, abas e deploys. A função usa um lock transacional por usuário: requisições concorrentes não ultrapassam 10. A autorização HTTP sempre gera um ID novo no servidor; IDs e papéis enviados pelo cliente são ignorados. A chave primária oferece idempotência interna à função SQL. A função recusa reaproveitamento de IDs de outra semana/operação.

A tabela fica em schema privado com RLS, sem acesso direto de anon/authenticated. A função pública aceita apenas usuários autenticados e deriva usuário/papel de `auth.uid()` e `auth.users`. E-mail ADM precisa estar confirmado. Os clientes não podem editar/apagar o contador ou escolher outro usuário.

O processamento ainda ocorre no navegador: a cota controla as aplicações autorizadas pela NOSSOM, não impede alguém de executar os modelos públicos por conta própria fora do produto. Para medição inviolável de execução/renderização, uma futura versão deve mover o motor para jobs autenticados no servidor. Não há promessa de DRM sobre WASM local.

## Sessões e arquivos

Tokens Supabase ficam criptografados por AES-256-GCM em cookie HttpOnly/SameSite=Lax/Secure em produção. O proxy renova tokens e propaga a sessão atualizada para a mesma renderização. As APIs verificam a identidade no Auth; não confiam apenas em campos enviados pelo navegador. Logout solicita revogação da sessão de refresh e apaga o cookie local.

Contas e contadores estão na nuvem. Áudios, versões e presets continuam no navegador, separados por ID da conta: login em outro aparelho não transfere arquivos. A primeira conta que entrar neste navegador herda o workspace local anterior, sem apagar arquivos. Isso separa espaços na interface, sem criptografar blobs contra acesso físico/DevTools no mesmo perfil do navegador.

## Testes

`npm test` verifica identidade, confirmação/admin, criptografia, renovação, isolamento de conversas e API de autorização com HTTP simulado. `npm run build` seguido de `npm run test:e2e` inicia automaticamente um servidor Supabase simulado apenas local e o build de produção; os fluxos não criam usuários no projeto real ou chamadas Anthropic pagas.

A migração também pode ser validada em PostgreSQL 17 isolado com `npm run test:quota`. Esse comando precisa de Docker e testa 18 conexões concorrentes, renovação semanal, exceção ADM, usuário não confirmado e permissões reais. Uma execução local bem-sucedida não aplica a migração no Supabase de produção.
