# Validação — motor, presets e ferramentas NOSSOM

Ambiente: Node.js 24, Next.js 16, Chromium Linux. FFmpeg/WASM, RNNoise e DeepFilterNet3 servidos pelo próprio domínio. Validação de navegador em build local de produção.

- Build e TypeScript aprovados, com rotas próprias do estúdio e endpoints de IA.
- 19 testes unitários aprovados: medições, intenções, parâmetros, piso de ruído, histórico com ramificações, sessão assinada, contrato Anthropic, Managed Agents e reconstrução espectral com preservação de estéreo/bordas.
- 13 cenários E2E verificados entre a suíte geral e a reexecução dos 4 cenários afetados pelos ajustes do motor. O teste real recebeu os arquivos privados por variáveis de ambiente; não houve skip nessa execução. Sem esses arquivos, esse cenário é explicitamente pulado.
- O fixture de ruído verifica bypass de 0%, render neural, duração e alinhamento. O melhor alinhamento por correlação foi zero na grade de 16 amostras.
- Na limpeza manual do fixture, a redução no intervalo sem fala foi 24,15 dB e a energia RMS na janela de fala correspondeu a 68,6% da referência sintetizada limpa. Isso não é uma medição de qualidade perceptual.
- No novo padrão automático, SI-SDR do fixture com referência limpa passou de 20,36 para 27,99 dB. A correlação entre canais proporcionais ficou em 0,99999999. A métrica verifica erro de sinal conhecido, não certifica inteligibilidade ou naturalidade em qualquer gravação.
- No áudio real fornecido, o v1 anterior tinha −17,42 LUFS e correlação L/R 0,97927, enquanto o v0 tinha −15,01 LUFS e correlação L/R 0,99963, medidos nos MP3 enviados. A nova limpeza gerou WAV de −14,91 LUFS / −1,20 dBTP, correlação com o original de 0,99250 e L/R 0,99962. Repetir a análise a partir do original produziu PCM idêntico (erro máximo zero).
- Tratamento completo no bruto real: −10,80 LUFS, −2,16 dBTP, pico amostral −3,00 dBFS e LRA 6,0 LU. Referência Adobe Podcast v2 + Premiere fornecida: −10,99 LUFS, −2,21 dBTP e LRA 5,9 LU. São formatos distintos (WAV renderizado e MP3 de referência); a proximidade dessas medidas não comprova equivalência perceptual. Os previews reais ficam em `artifacts/`, ignorados pelo Git.
- EQ: preset aplicado, ganho de banda editado, preset pessoal salvo e recarregado, áudio renderizado.
- Transmissão: crossovers 137/1.147/6.910 Hz, parâmetros por banda e limitadores conferidos no relatório. Render válido, loudness mensurado e pico amostral abaixo do teto de −3 dBFS do teste. Implementação/limites em `docs/audio-engine.md`.
- Histórico: desfazer/refazer e restaurar original sem apagar snapshots, inclusive após reload. Ramificação mais antiga pode ser refeita mesmo quando existe outra mais recente.
- Importação mono/estéreo, rejeição de arquivo inválido, cancelamento/repetição, tratamento regional, gravação sintética de microfone, voz/de-esser, nivelamento, mixagem e ducking executados.
- Exportação WAV, MP3 320 kb/s e relatório JSON com controles, análise automática, motor e origem das versões verificados.
- Masterização de referência: −16,47 LUFS e −0,99 dBTP no sinal de teste; o limite de pico pode impedir a meta exata de LUFS. A cadeia de Transmissão não recebe normalização LUFS posterior.
- Responsividade: 1440/1000/390 px, editor móvel e tema claro/escuro; sem overflow nos fluxos conferidos. Reduzir movimento validado.
- Acessibilidade automatizada: axe WCAG 2 A/AA e 2.1 AA nas superfícies verificadas. Não é certificação completa.
- Anthropic: payload Sonnet 5.5, pensamento adaptativo e esforço high verificados com HTTP simulado. Sessão, origem e operações permitidas testadas. Sem chave real, sem chamada paga.
- Managed Agents: validação inicial somente por GET, dois cookies HttpOnly, preservação de instruções e versão, modelo/high por override, limite de consumo, continuidade de duas mensagens, paginação sem reaproveitar respostas antigas, isolamento entre logins/agentes e exclusão remota ao cancelar verificados com HTTP simulado. O formulário e o assistente são verificados com endpoints simulados no navegador; não se declara uma conexão real com um agente do usuário.
- Sem credenciais no ambiente local de teste: página de IA informa configuração pendente. A produção detecta as credenciais configuradas pelo usuário; endpoints continuam exigindo a sessão privada. Não se inspecionou a conversa privada do usuário com o agente.
- Dependências: nenhuma vulnerabilidade conhecida na última consulta `npm audit --omit=dev`.

Foi feita comparação de sinal e níveis com o bruto real e a saída Adobe Podcast v2 + Premiere enviada pelo usuário. Não foi concluída uma avaliação auditiva que aprove equivalência perceptual; a referência é o benchmark de escuta. Não há base para afirmar superioridade ou equivalência a Adobe, Resolve ou iZotope. Também não foram homologados Safari/Firefox, dispositivos móveis físicos, arquivos próximos dos limites de memória ou uma conta Anthropic real nesta execução.

A integração GitHub–Vercel publica `main`. Não é necessário token Vercel para essa publicação. O GitHub Actions permanece sujeito à restrição de cobrança da conta observada anteriormente; os testes e builds acima foram executados localmente. Testes automatizados contra o domínio público seguem limitados pela confiança do proxy no Chromium; TLS não foi desativado. Requisições HTTPS públicas são verificadas pela cadeia de confiança disponível.
