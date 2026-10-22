# Motor NOSSOM e preset de transmissão

NOSSOM Voice combina processamento neural local e estágios de DSP controláveis. O núcleo de restauração padrão é o modelo aberto DeepFilterNet3, distribuído por `@lofcz/deepfilternet-web@0.1.0` (MIT/Apache-2.0). A alternativa leve usa RNNoise. NOSSOM não reivindica ter treinado esses modelos nem reproduzir o código proprietário de Adobe, Blackmagic ou iZotope.

DeepFilterNet3 processa PCM float a 48 kHz em quadros de 480 amostras. O modelo embutido foi inspecionado: FFT 960, hop 480 e look-ahead 2. O worker acrescenta zeros ao final e remove 1.440 amostras de atraso. O modelo/WASM de aproximadamente 33 MB é servido pelo próprio domínio; a licença acompanha os assets em `/audio/DEEPFILTER-LICENSE.txt`. Não há fallback silencioso para um algoritmo diferente.

## Padrão automático e preservação da voz

O padrão anterior aplicava a saída neural diretamente, a 100% e com supressão máxima de 60 dB. No par real enviado pelo usuário, o resultado ficou mais baixo e dois canais quase idênticos ficaram menos correlacionados. As medições de regressão iniciais em fala sintética não eram suficientes para validar a qualidade perceptual.

Natural 2 usa a estimativa neural para calcular ganhos espectrais; a reconstrução mantém a fase do sinal original. FFT 1.024, hop 512, janela de raiz de Hann e sobreposição com soma unitária. O ganho é comum aos canais. A saída é escrita em blocos já consumidos para evitar uma terceira cópia integral do áudio no worker. Ganho unitário reconstrói inclusive as bordas; há teste de impulsos no primeiro e último samples.

A análise usa percentis RMS em janelas de 20 ms, exclui silêncio digital da estimativa de fundo e mantém uma indicação de confiança. A política escolhe o limite de supressão e protege mais a fala quando a separação entre janelas fracas e fortes é maior. A relação de energia entre a estimativa neural e a entrada adapta o ganho por quadro; os ganhos são suavizados no tempo e na frequência. Isso é um controlador DSP sobre um modelo neural aberto, não um novo modelo treinado pela NOSSOM. O indicador de separação entre percentis não é uma medição certificada de SNR.

`/studio/automatico` é a entrada padrão. O usuário importa e usa “Analisar e tratar”. O motor restaura, escolhe presença/corte de médios graves/de-esser/compressão dentro de limites conservadores, ajusta o nível de voz para a etapa de finalização e aplica Transmissão + Limite −3 dB. Não se normaliza o LUFS depois dessa cadeia. O relatório registra a análise e todos os parâmetros usados. O controle de pico é verificado depois do render.

As ferramentas Limpeza e Voz também começam em análise automática, com “Ajustar manualmente” disponível. A limpeza isolada preserva o nível vocal com compensação limitada e limitador em oversampling 4×. O modo manual mantém intensidade e limite de supressão; esse limite agora controla o piso dos ganhos espectrais, em vez de substituir o sinal pela saída neural bruta. No modo de compatibilidade RNNoise, mantém-se a implementação anterior.

Cada execução automática parte do original e abre uma ramificação no histórico. Repetir não reaplica o modelo sobre uma voz já tratada. As operações manuais continuam encadeáveis. A exportação MP3 passa a 320 kb/s; o WAV é a referência das medições.

As ferramentas são páginas próprias com uma fonte de áudio compartilhada. EQ, voz, dinâmica e entrega são estágios separados; aplicar um ajuste produz um snapshot e registra sua versão de origem. Desfazer/refazer seleciona snapshots, sem renderizar novamente ou destruir o histórico. Ramificações e a trilha de refazer são preservadas ao recarregar. Projetos antigos sem identificadores de origem continuam navegáveis por ordem linear.

## Transmissão + Limite −3 dB

Valores transcritos das capturas do usuário:

| Banda         | Limiar   | Ganho | Proporção | Ataque | Liberação |
| ------------- | -------- | ----- | --------- | ------ | --------- |
| Graves        | −20,2 dB | +1 dB | 3:1       | 1 ms   | 100 ms    |
| Médios graves | −17,6 dB | 0 dB  | 2:1       | 1 ms   | 100 ms    |
| Médios agudos | −24,8 dB | 0 dB  | 2:1       | 1 ms   | 100 ms    |
| Agudos        | −25 dB   | +3 dB | 3:1       | 1 ms   | 100 ms    |

Crossovers: **137 / 1.147 / 6.910 Hz**.

Limitador multibanda: limiar −10 dB, margem −0,1 dB, ataque 1 ms, liberação 250 ms, saída 0 dB. O motor limita no limiar e usa compensação para a margem. Essa interpretação é explícita: curvas internas de auto-gain/knee dos plugins Adobe não podem ser deduzidas integralmente pelas imagens.

Limitador final: **modo pico amostral**, entrada +6 dB, teto −3 dBFS, look-ahead 7 ms, liberação 100 ms, canais vinculados. Não é o modo true peak, que estava desmarcado na captura. O relatório mede true peak separadamente.

A implementação usa crossover Linkwitz–Riley de 4ª ordem, compressão RMS por banda com knee duro, soma sem normalização e limitadores com compensação de latência. A via seca da intensidade passa pelo mesmo crossover para preservar a relação de fase na mistura. Os controles são ajustáveis e voltam aos valores das capturas com “Restaurar valores da referência”. Não se aplica normalização LUFS extra depois desse preset: isso alteraria a cadeia e a intenção do teto final.

## EQ e presets de voz

O EQ possui bandas em 100, 250, 1.000, 3.500 e 10.000 Hz, de −12 a +12 dB, e corte de graves ajustável. Os presets Neutro, Corpo e calor, Voz em destaque e Brilho e abertura são pontos de partida editáveis. Reserva-se margem antes dos realces para reduzir o risco de clipping. O gráfico mostra ganhos por banda, não uma medição do espectro ou resposta exata do filtro.

Os presets Diálogo limpo, Locução encorpada, Podcast equilibrado, Sibilância suave e Diálogo com hum de rede combinam a restauração neural com EQ de voz, compressor, limitador e de-esser conforme controles. Hum usa notches na fundamental 50/60 Hz e três harmônicos. Isso não recupera gravações saturadas ou ausentes nem equivale a todas as funções RX/Ozone.

“Meus presets” guarda as configurações por ferramenta no navegador. Não inclui o áudio, não é sincronizado em nuvem e possui limite de 20 presets por ferramenta.

## Qualidade e comparação

O fixture permanente é fala sintetizada com ruído branco adicionado; ele verifica também melhoria de SI-SDR, preservação de estéreo e ausência de alterações no original. O teste opcional com `NOSSOM_REGRESSION_MP3` usa o bruto privado do usuário e `NOSSOM_REFERENCE_MP3` usa sua referência Adobe Podcast v2 + Premiere. Esses áudios não são versionados nem publicados. O teste verifica duração, relação entre canais, preservação do sinal, repetição a partir do original e níveis finais em relação à referência. Os previews ficam em `artifacts/`, ignorado pelo Git.

Proximidade de LUFS/pico/dinâmica não comprova equivalência perceptual, inteligibilidade nem ausência de artefatos. Não se afirma que o modelo local supera ou iguala Adobe, Resolve ou iZotope. A aprovação do padrão perceptual requer comparação auditiva com volume igualado; a referência fornecida passa a ser o benchmark dessa avaliação.
