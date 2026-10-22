# Conectar Claude Sonnet 5.5 em esforço alto

A interface de configuração está em `/studio/ia`. A restauração continua no motor local; Claude orienta a escolha de ferramentas e presets por texto e medições. Não recebe o arquivo de áudio, não altera o áudio automaticamente e não executa instruções arbitrárias de processamento.

1. No [Console Anthropic](https://console.anthropic.com/settings/keys), crie uma chave de API e habilite créditos na conta. Confirme que essa conta tem acesso ao Sonnet 5.5. A assinatura do aplicativo Claude não inclui automaticamente créditos da API.
2. No projeto NOSSOM da Vercel, em **Settings → Environment Variables → Production**, defina `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL=claude-sonnet-5-5` e `NOSSOM_AI_ACCESS_CODE`. O último é um código privado aleatório com pelo menos 16 caracteres; não use a chave Anthropic como código. Não prefixe essas variáveis com `NEXT_PUBLIC_` e não as envie no chat.
3. Faça um novo deploy. Na página de IA, digite o código da NOSSOM e conecte. O servidor consulta a Models API para conferir acesso e capacidades antes de liberar a sessão.

O pedido de geração usa `thinking: { type: 'adaptive' }` e `output_config: { effort: 'high' }`, com saída estruturada e limite de resposta. Esses campos e o ID foram conferidos no [SDK oficial](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/messages/messages.ts); as capacidades são consultadas pela [Models API](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/models.ts). Não se troca silenciosamente de modelo nem se reduz o esforço em caso de incompatibilidade.

A chave fica no servidor. A sessão de uma hora usa cookie HttpOnly, SameSite Strict e assinatura HMAC. O endpoint exige a mesma origem e limita pedidos por sessão em memória. Para uso público multiusuário, adicione autenticação de conta e limites distribuídos por usuário, além dos limites da conta Anthropic. O fluxo atual é uma conexão pessoal protegida por código.

Sem as credenciais, a página mostra as variáveis pendentes e o assistente permanece no modo local, identificado como tal. Os testes do contrato de API usam um provedor simulado; não foi feita uma chamada paga ou verificação de acesso em uma conta real.

## Usar um agente existente no Console

A integração entregue acima usa a Messages API, com instruções da NOSSOM. Ela ainda não recupera um agente salvo no Console. Primeiro identifique o recurso:

- **Managed Agents:** forneça somente o Agent ID (`agent_…`) e o Environment ID (`env_…`). A chave precisa ter acesso ao workspace desses recursos e deve ser configurada privadamente no servidor. O backend deve criar uma sessão para esse agente e ambiente, enviar eventos `user.message` e acompanhar os eventos `agent.message`. Conversas de usuários diferentes precisam ter sessões distintas; o ID da sessão deve ficar associado ao usuário no servidor.
- **Workbench:** exporte o código ou as instruções do prompt, sem a chave. O backend deve reproduzir o system prompt, modelo e ferramentas usando a Messages API. Um prompt salvo não se conecta usando o endpoint de Managed Agents.

Exemplo de criação da primeira sessão, baseado no SDK oficial atual; é uma referência para o adaptador de Managed Agents, **não um endpoint já conectado nesta versão**:

```ts
const session = await client.beta.sessions.create({
  agent: agentId,
  environment_id: environmentId,
  initial_events: [
    {
      type: 'user.message',
      content: [{ type: 'text', text: pedido }],
    },
  ],
});

// Nas mensagens seguintes, reutilize a sessão da mesma conversa.
await client.beta.sessions.events.send(session.id, {
  events: [{ type: 'user.message', content: [{ type: 'text', text: proximoPedido }] }],
});
```

O SDK envia o cabeçalho beta `managed-agents-2026-04-01`. Na API REST, as rotas são `POST /v1/sessions?beta=true` e `POST /v1/sessions/{id}/events?beta=true`; respostas podem ser acompanhadas pelo stream de eventos da sessão. O modelo e o esforço de um Managed Agent fazem parte da configuração do próprio agente: o SDK aceita `model: { id: 'claude-sonnet-5-5', effort: 'high' }`. Alterar `ANTHROPIC_MODEL` da integração Messages atual não altera um agente salvo.

As ferramentas de áudio precisam ser registradas e implementadas pela NOSSOM: por exemplo, recomendar EQ, sugerir intensidade e selecionar um preset. Ter um agente no Console não dá acesso automático aos arquivos e controles do navegador. A integração deve validar cada ação e manter a revisão antes de aplicar efeitos, assim como o assistente atual.

Contratos consultados: [Agents](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/agents/agents.ts), [Sessions](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/sessions/sessions.ts) e [Events](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/beta/sessions/events.ts). O adaptador final depende do tipo e da configuração do agente do usuário; não foi validado com uma conta Managed Agents real.
