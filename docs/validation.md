# Validação — motor, presets e ferramentas NOSSOM

Ambiente: Node.js 24, Next.js 16, Chromium Linux. FFmpeg/WASM, RNNoise e DeepFilterNet3 servidos pelo próprio domínio. Validação de navegador em build local de produção.

- Build e TypeScript aprovados, com rotas próprias do estúdio e endpoints de IA.
- 10 testes unitários aprovados: medições, intenções, parâmetros, piso de ruído, histórico com ramificações, sessão assinada e contrato Anthropic.
- 10 cenários E2E verificados entre suíte geral e reexecução dos cenários afetados pelos ajustes finais.
- O fixture de ruído verifica bypass de 0%, render neural, duração e alinhamento. O melhor alinhamento por correlação foi zero na grade de 16 amostras.
- No intervalo sem fala do fixture sintético, o render DeepFilterNet3 chegou a silêncio digital PCM16. A redução reportada fica limitada conservadoramente à resolução PCM16: ao menos 52,6 dB nesse intervalo. Isso não é uma medição de qualidade perceptual, e não equivale a 52,6 dB de melhoria de inteligibilidade.
- A energia RMS na janela de fala correspondeu a 61,2% da referência sintetizada limpa. O teste não comprova preservação de palavras, naturalidade ou ausência de artefatos; a compensação de volume A/B permite comparação mais justa.
- EQ: preset aplicado, ganho de banda editado, preset pessoal salvo e recarregado, áudio renderizado.
- Transmissão: crossovers 137/1.147/6.910 Hz, parâmetros por banda e limitadores conferidos no relatório. Render válido, loudness mensurado e pico amostral abaixo do teto de −3 dBFS do teste. Implementação/limites em `docs/audio-engine.md`.
- Histórico: desfazer/refazer e restaurar original sem apagar snapshots, inclusive após reload. Ramificação mais antiga pode ser refeita mesmo quando existe outra mais recente.
- Importação mono/estéreo, rejeição de arquivo inválido, cancelamento/repetição, tratamento regional, gravação sintética de microfone, voz/de-esser, nivelamento, mixagem e ducking executados.
- Exportação WAV, MP3 e relatório JSON com controles, motor e origem das versões verificados.
- Masterização de referência: −16,47 LUFS e −0,99 dBTP no sinal de teste; o limite de pico pode impedir a meta exata de LUFS. A cadeia de Transmissão não recebe normalização LUFS posterior.
- Responsividade: 1440/1000/390 px, editor móvel e tema claro/escuro; sem overflow nos fluxos conferidos. Reduzir movimento validado.
- Acessibilidade automatizada: axe WCAG 2 A/AA e 2.1 AA nas superfícies verificadas. Não é certificação completa.
- Anthropic: payload Sonnet 5.5, pensamento adaptativo e esforço high verificados com HTTP simulado. Sessão, origem e operações permitidas testadas. Sem chave real, sem chamada paga.
- Produção sem credenciais: página de IA informa configuração pendente; endpoint rejeita pedidos não autenticados.
- Dependências: nenhuma vulnerabilidade conhecida na última consulta `npm audit --omit=dev`.

Não foram comparadas saídas reais de Adobe Podcast v2, Resolve Voice Isolation ou iZotope RX/Ozone. Não há base para afirmar superioridade ou equivalência. São necessários originais reais e resultados das referências para avaliação com volume igualado, trechos de fala e ruído conhecidos e escuta comparativa. Também não foram homologados Safari/Firefox, dispositivos móveis físicos, arquivos próximos dos limites de memória ou uma conta Anthropic real.

A integração GitHub–Vercel publica `main`. Não é necessário token Vercel para essa publicação. O GitHub Actions permanece sujeito à restrição de cobrança da conta observada anteriormente; os testes e builds acima foram executados localmente. Testes automatizados contra o domínio público seguem limitados pela confiança do proxy no Chromium; TLS não foi desativado. Requisições HTTPS públicas são verificadas pela cadeia de confiança disponível.
