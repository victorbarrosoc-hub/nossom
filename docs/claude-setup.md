# Conectar Claude Sonnet 5.5 em esforço alto

A interface de configuração está em `/studio/ia`. A restauração continua no motor local; Claude orienta a escolha de ferramentas e presets por texto e medições. Não recebe o arquivo de áudio, não altera o áudio automaticamente e não executa instruções arbitrárias de processamento.

1. No [Console Anthropic](https://console.anthropic.com/settings/keys), crie uma chave de API e habilite créditos na conta. Confirme que essa conta tem acesso ao Sonnet 5.5. A assinatura do aplicativo Claude não inclui automaticamente créditos da API.
2. No projeto NOSSOM da Vercel, em **Settings → Environment Variables → Production**, defina `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL=claude-sonnet-5-5` e `NOSSOM_AI_ACCESS_CODE`. O último é um código privado aleatório com pelo menos 16 caracteres; não use a chave Anthropic como código. Não prefixe essas variáveis com `NEXT_PUBLIC_` e não as envie no chat.
3. Faça um novo deploy. Na página de IA, digite o código da NOSSOM e conecte. O servidor consulta a Models API para conferir acesso e capacidades antes de liberar a sessão.

O pedido de geração usa `thinking: { type: 'adaptive' }` e `output_config: { effort: 'high' }`, com saída estruturada e limite de resposta. Esses campos e o ID foram conferidos no [SDK oficial](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/messages/messages.ts); as capacidades são consultadas pela [Models API](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/models.ts). Não se troca silenciosamente de modelo nem se reduz o esforço em caso de incompatibilidade.

A chave fica no servidor. A sessão de uma hora usa cookie HttpOnly, SameSite Strict e assinatura HMAC. O endpoint exige a mesma origem e limita pedidos por sessão em memória. Para uso público multiusuário, adicione autenticação de conta e limites distribuídos por usuário, além dos limites da conta Anthropic. O fluxo atual é uma conexão pessoal protegida por código.

Sem as credenciais, a página mostra as variáveis pendentes e o assistente permanece no modo local, identificado como tal. Os testes do contrato de API usam um provedor simulado; não foi feita uma chamada paga ou verificação de acesso em uma conta real.

## Usar um agente existente no Console

1. Abra `/studio/ia`. Se já estiver conectado ao modelo direto, use **Trocar ou encerrar conexão**.
2. Em **IA da plataforma**, escolha **Meu agente do Console**.
3. Preencha **Agent ID** (`agent_…`), **Environment ID** (`env_…`) e o código privado da NOSSOM. Os IDs vêm do Managed Agents; a chave no servidor precisa ter acesso ao workspace desses recursos.
4. Use **Conectar meu agente**. A validação consulta agente, ambiente e capacidades do modelo, sem criar uma sessão nem executar geração paga. A associação fica em cookie HttpOnly assinado por uma hora neste navegador.
5. Abra o assistente e envie um pedido. O backend cria a sessão na primeira mensagem e a reutiliza nas mensagens seguintes. As sugestões selecionam uma ferramenta e parâmetros somente quando você usa **Revisar tratamento**.

O adaptador usa a API beta `managed-agents-2026-04-01`, com as rotas de Agents, Environments, Sessions e Events. Não depende do SDK instalado. A versão atual do agente é fixada ao criar a conversa; seu system prompt é preservado e recebe as regras de áudio e formato da NOSSOM. Um override da sessão usa `ANTHROPIC_MODEL` (padrão `claude-sonnet-5-5`) com `effort: 'high'`, sem alterar o agente salvo no Console.

Esta conexão é de orientação de áudio: ferramentas e servidores MCP externos são desativados no override, e agentes com orquestração de outros agentes são recusados. Skills continuam sujeitas às capacidades disponíveis nessa sessão. Operação, intensidade e preset de EQ retornados passam pela validação da NOSSOM; não há execução de comandos livres ou aplicação automática de efeitos. A chave e o prompt do agente não vão para o navegador.

O contexto de conversa usa um token assinado vinculado ao cookie da sessão de acesso, ao agente, ao ambiente e ao modelo. Outro login ou outro agente não pode reutilizá-lo. Os eventos são lidos com paginação, delimitando cada resposta pelo último evento anterior ao pedido. A sessão configura um limite de US$ 1 de custo de tabela de modelos; cobranças e retenção seguem as regras da Anthropic. Os limites de uso locais permanecem por sessão e em memória.

Fechar o assistente ou mudar para sugestões locais solicita a exclusão da sessão remota conhecida. Cancelar uma solicitação nova exclui a sessão recém-criada; cancelar uma continuação envia `user.interrupt`. A limpeza depende de conectividade com o provedor e não substitui suas regras de retenção.

Se o recurso for um **prompt salvo no Workbench**, ele não tem os IDs de Managed Agents exigidos neste formulário. Exporte as instruções e configurações, sem credenciais, para adaptar a integração Messages API. O modo “Claude com as instruções NOSSOM” continua disponível e não importa automaticamente um prompt do Workbench.

Contratos consultados: [Agents](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/agents/agents.ts), [Environments](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/environments/environments.ts), [Sessions](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/sessions/sessions.ts), [Events](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/sessions/events.ts) e [paginação](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/core/pagination.ts). Os testes verificam o contrato com HTTP simulado e o fluxo de interface com endpoints simulados; uma conversa real ainda depende de IDs válidos e da autenticação do usuário.
