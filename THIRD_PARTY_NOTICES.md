# Componentes de terceiros

O produto utiliza pacotes instalados conforme `package-lock.json`, mantendo as licenças fornecidas pelos autores.

- **FFmpeg.wasm wrapper**: MIT. https://github.com/ffmpegwasm/ffmpeg.wasm
- **FFmpeg core**: build distribuído por `@ffmpeg/core`; inclui FFmpeg e bibliotecas habilitadas no build. A distribuição do core usa GPL-2.0-or-later, conforme o pacote. Fontes e scripts de build: https://github.com/ffmpegwasm/ffmpeg.wasm e https://ffmpeg.org/legal.html. O campo license do package.json instalado declara GPL-2.0-or-later. Distribuições modificadas devem cumprir as obrigações de licença e disponibilização do código correspondente; o motor nesta aplicação é copiado sem modificação do pacote publicado.
- **Next.js / React / Lucide / Motion / idb**: consulte as licenças MIT/ISC incluídas em cada pacote.
- **Manrope**: SIL Open Font License 1.1, distribuída por `@fontsource-variable/manrope`.
- **ElevenLabs SDK**: consulte a licença do pacote. A utilização do serviço e das vozes segue os termos do provedor e exige configuração autorizada.

A NOSSOM não inclui conteúdo de áudio licenciado de terceiros: a demonstração é um sinal musical sintetizado pelo próprio código. As referências visuais do usuário foram usadas como direção de design.
