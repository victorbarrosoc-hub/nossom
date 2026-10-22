# Validação da primeira entrega

Ambiente: Node.js 24, Next.js 16, Chromium Linux, FFmpeg core 0.12.10. A validação foi local; não comprova deploy na Vercel, nova tarefa restaurada ou sessão ElevenLabs.

- TypeScript: sem erros.
- Build de produção: concluído; páginas /, /studio e /privacidade pré-renderizadas.
- Testes unitários: 3 aprovados (intenções permitidas, interpretação de medições, rejeição de operação inadequada).
- Fluxos E2E: 6 aprovados (cinco em uma execução e gravação em execução adicional).
- Importação de arquivo inválido: rejeitada com mensagem; nova tentativa válida funciona.
- Áudio mono e estéreo: importados, medidos e preservados nos formatos suportados.
- Denoise, clareza, passa-altas de vento, compressão de volume, loudnorm e mixagem com ducking: executados pelo motor real.
- Masterização do sinal estéreo de teste: leitura pós-renderização dentro de ±1 LU do alvo de -16 LUFS e true peak abaixo do teto de teste.
- Seleção de trecho: tratamento concluído com arquivo de saída válido.
- Exportação: WAV com cabeçalho RIFF válido e conteúdo; MP3 não vazio; JSON de medições lido e verificado.
- Persistência: projeto recuperado após reload, renomeado e excluído.
- Cancelamento: importação interrompida sem salvar projeto parcial, seguida de nova importação bem-sucedida.
- Microfone: gravação via MediaRecorder com dispositivo sintético Chromium, importação e tratamentos concluídos. Não é teste de um microfone físico.
- Responsividade: navegação móvel, editor a 390 px, sem overflow horizontal nos fluxos verificados.
- Acessibilidade: axe-core WCAG 2 A/AA e 2.1 AA sem violações nas páginas inicial e estúdio inicial verificadas. Isso não constitui certificação de acessibilidade completa.
- Formatação: Prettier aprovado.
- Dependências de produção: `npm audit --omit=dev --audit-level=high` retornou zero vulnerabilidades conhecidas no momento da consulta.

## Não verificado

- Qualidade perceptual em gravações reais de fala, vento e reverberação.
- Navegadores Safari/Firefox, dispositivos físicos móveis ou arquivos próximos dos limites de memória.
- Voz ElevenLabs: ausência do ID de agente autorizado.
- Conta, armazenamento de nuvem, colaboração, billing e IA neural: fora do MVP local, identificados como futuros.
- Publicação Vercel: não confirmada; ausência de sessão/token Vercel e restrição de rede às APIs externas.

O workflow CI foi adicionado ao repositório. A execução remota não foi observada neste ambiente.
