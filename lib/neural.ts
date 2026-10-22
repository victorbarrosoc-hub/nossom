let activeCancel: (() => void) | null = null;
export function cancelNeural() {
  activeCancel?.();
}
export function denoiseVoice(
  buffer: AudioBuffer,
  progress?: (n: number) => void,
): Promise<Float32Array[]> {
  if (buffer.sampleRate !== 48000) throw new Error('O modelo de voz requer áudio em 48 kHz.');
  return new Promise((resolve, reject) => {
    const worker = new Worker('/audio/neural-worker.js', { type: 'module' });
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
      activeCancel = null;
    };
    const fail = (message: string) => {
      finish();
      reject(new Error(message));
    };
    const timer = setTimeout(
      () => fail('O modelo de voz excedeu o tempo limite. Tente um trecho menor.'),
      180000,
    );
    activeCancel = () =>
      fail('Processamento cancelado. O original e as versões salvas foram preservados.');
    worker.onerror = () =>
      fail(
        'Não foi possível carregar o modelo de voz. Recarregue a página ou escolha o modo Áudio geral.',
      );
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') progress?.(data.value);
      else if (data.type === 'error') fail(data.message);
      else if (data.type === 'result') {
        finish();
        resolve(data.channels);
      }
    };
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) =>
      buffer.getChannelData(c).slice(),
    );
    worker.postMessage(
      { channels },
      channels.map((c) => c.buffer),
    );
  });
}
