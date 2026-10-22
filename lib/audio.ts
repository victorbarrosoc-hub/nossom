import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { treatmentFilter, type Operation, type Intensity } from './presets';
export const MAX_BYTES = 100 * 1024 * 1024;
export const MAX_DURATION = 600;
export type Measurements = { lufs: number | null; truePeak: number | null; lra: number | null };
export type AudioInfo = {
  duration: number;
  channels: number;
  sampleRate: number;
  peak: number;
  clipped: number;
  wave: number[];
};
let engine: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;
let inUse = false;
let cancellationEpoch = 0;
const cancelledMessage =
  'Processamento cancelado. O original e as versões salvas foram preservados.';
function checkCancellation(epoch: number) {
  if (epoch !== cancellationEpoch) throw new Error(cancelledMessage);
}
export async function getEngine(onStatus?: (status: string) => void) {
  if (engine?.loaded) return engine;
  if (loading) return loading;
  const epoch = cancellationEpoch;
  loading = (async () => {
    onStatus?.('Preparando o motor de áudio…');
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    checkCancellation(epoch);
    const next = new FFmpeg();
    engine = next;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        next.load({
          classWorkerURL: new URL('/ffmpeg/worker/worker.js', location.origin).href,
          coreURL: new URL('/ffmpeg/ffmpeg-core.js', location.origin).href,
          wasmURL: new URL('/ffmpeg/ffmpeg-core.wasm', location.origin).href,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            next.terminate();
            reject(
              new Error(
                'O motor de áudio demorou para carregar. Verifique sua conexão e tente novamente.',
              ),
            );
          }, 60000);
        }),
      ]);
      return next;
    } catch (error) {
      next.terminate();
      if (engine === next) engine = null;
      throw error instanceof Error
        ? error
        : new Error('Não foi possível iniciar o motor de áudio. Tente recarregar a página.');
    } finally {
      if (timer) clearTimeout(timer);
    }
  })();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}
export function cancelProcessing() {
  cancellationEpoch++;
  engine?.terminate();
  engine = null;
  loading = null;
}
async function exclusive<T>(task: () => Promise<T>): Promise<T> {
  if (inUse) throw new Error('Aguarde o processamento atual terminar.');
  inUse = true;
  const epoch = cancellationEpoch;
  try {
    const result = await task();
    checkCancellation(epoch);
    return result;
  } catch (error) {
    checkCancellation(epoch);
    throw error;
  } finally {
    inUse = false;
  }
}
async function execChecked(ff: FFmpeg, args: string[]) {
  const code = await ff.exec(args, 180000);
  if (code !== 0)
    throw new Error(
      code === 1
        ? 'Não foi possível processar este áudio. Verifique o arquivo e tente novamente.'
        : 'O processamento excedeu o limite. Tente um trecho menor.',
    );
}
export async function decode(blob: Blob): Promise<AudioBuffer> {
  const context = new AudioContext({ sampleRate: 48000 });
  try {
    return await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close();
  }
}
export function inspect(buffer: AudioBuffer): AudioInfo {
  const wave: number[] = [];
  let peak = 0,
    clipped = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i]);
      peak = Math.max(peak, a);
      if (a >= 0.99997) clipped++;
    }
  }
  const data = buffer.getChannelData(0),
    step = Math.max(1, Math.floor(data.length / 240));
  for (let i = 0; i < 240; i++) {
    let p = 0;
    for (let j = i * step; j < Math.min((i + 1) * step, data.length); j++)
      p = Math.max(p, Math.abs(data[j]));
    wave.push(p);
  }
  return {
    duration: buffer.duration,
    channels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
    peak: peak ? 20 * Math.log10(peak) : -Infinity,
    clipped,
    wave,
  };
}
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels,
    frames = buffer.length;
  const bytes = new ArrayBuffer(44 + frames * channels * 2),
    view = new DataView(bytes);
  const str = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  str(0, 'RIFF');
  view.setUint32(4, 36 + frames * channels * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  const arrays = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  for (let i = 0; i < frames; i++)
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, arrays[c][i]));
      view.setInt16(44 + (i * channels + c) * 2, s < 0 ? s * 32768 : s * 32767, true);
    }
  return new Blob([bytes], { type: 'audio/wav' });
}
export function parseMeasurements(logs: string[]): Measurements {
  const matches = logs.join('\n').match(/\{[^{}]*"input_i"[^{}]*\}/g);
  if (!matches?.length) throw new Error('O motor não retornou medições de loudness.');
  const v = JSON.parse(matches[matches.length - 1]);
  const number = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : null);
  return { lufs: number(v.input_i), truePeak: number(v.input_tp), lra: number(v.input_lra) };
}
async function measureFile(ff: FFmpeg, path: string): Promise<Measurements> {
  const logs: string[] = [];
  const listener = ({ message }: { message: string }) => logs.push(message);
  ff.on('log', listener);
  try {
    await execChecked(ff, [
      '-i',
      path,
      '-af',
      'loudnorm=I=-16:TP=-1:LRA=11:print_format=json',
      '-f',
      'null',
      '-',
    ]);
    return parseMeasurements(logs);
  } finally {
    ff.off('log', listener);
  }
}
export async function measure(blob: Blob, onStatus?: (s: string) => void): Promise<Measurements> {
  return exclusive(async () => {
    const ff = await getEngine(onStatus);
    onStatus?.('Medindo loudness e true peak…');
    await ff.writeFile('measure.wav', new Uint8Array(await blob.arrayBuffer()));
    try {
      return await measureFile(ff, 'measure.wav');
    } finally {
      await ff.deleteFile('measure.wav').catch(() => {});
    }
  });
}
export async function importAudio(file: File, onStatus?: (s: string) => void) {
  const epoch = cancellationEpoch;
  if (file.size === 0) throw new Error('Este arquivo está vazio.');
  if (file.size > MAX_BYTES) throw new Error('O limite por arquivo é de 100 MB.');
  let buffer: AudioBuffer;
  try {
    buffer = await decode(file);
  } catch {
    checkCancellation(epoch);
    const converted = await exclusive(async () => {
      const ff = await getEngine(onStatus);
      onStatus?.('Extraindo o áudio…');
      await ff.writeFile('upload', new Uint8Array(await file.arrayBuffer()));
      try {
        await execChecked(ff, [
          '-i',
          'upload',
          '-vn',
          '-t',
          '601',
          '-ar',
          '48000',
          '-c:a',
          'pcm_s16le',
          'import.wav',
        ]);
        const bytes = await ff.readFile('import.wav');
        return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'audio/wav' });
      } finally {
        await ff.deleteFile('upload').catch(() => {});
        await ff.deleteFile('import.wav').catch(() => {});
      }
    });
    buffer = await decode(converted);
  }
  checkCancellation(epoch);
  if (buffer.duration > MAX_DURATION)
    throw new Error('O limite desta versão é de 10 minutos por arquivo.');
  if (buffer.duration < 0.1) throw new Error('O áudio precisa ter pelo menos 0,1 segundo.');
  if (buffer.numberOfChannels > 2)
    throw new Error('Use um arquivo mono ou estéreo. Áudio multicanal ainda não é suportado.');
  const blob = encodeWav(buffer),
    info = inspect(buffer),
    metrics = await measure(blob, onStatus);
  checkCancellation(epoch);
  return { blob, info, metrics };
}
export type ProcessOptions = {
  operation: Operation;
  intensity: Intensity;
  target: number;
  peak: number;
  music?: Blob;
  musicGain?: number;
  region?: { start: number; end: number };
  onStatus?: (s: string) => void;
  onProgress?: (n: number) => void;
};
export async function processAudio(blob: Blob, options: ProcessOptions) {
  return exclusive(async () => {
    const ff = await getEngine(options.onStatus);
    const files = ['source.wav', 'result.wav', 'music.wav'];
    await ff.writeFile('source.wav', new Uint8Array(await blob.arrayBuffer()));
    const progress = ({ progress }: { progress: number }) =>
      options.onProgress?.(Math.min(95, Math.max(0, Math.round(progress * 95))));
    ff.on('progress', progress);
    try {
      options.onStatus?.('Tratando seu áudio…');
      let args = ['-i', 'source.wav'];
      if (options.operation === 'mix') {
        if (!options.music) throw new Error('Adicione a faixa de música para fazer a mixagem.');
        await ff.writeFile('music.wav', new Uint8Array(await options.music.arrayBuffer()));
        args.push(
          '-stream_loop',
          '-1',
          '-i',
          'music.wav',
          '-filter_complex',
          `[0:a]asplit=2[voice][side];[1:a]volume=${options.musicGain ?? 0.25}[music];[music][side]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=500[duck];[voice][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.8913:level=0[out]`,
          '-map',
          '[out]',
        );
      } else {
        const filter = treatmentFilter(
          options.operation,
          options.intensity,
          options.target,
          options.peak,
        );
        if (options.region) {
          const { start, end } = options.region;
          // Apply the filter only to the chosen region, keeping the timeline and original surroundings.
          const nodes: string[] = [];
          const labels: string[] = [];
          if (start > 0) {
            nodes.push(`[0:a]atrim=end=${start},asetpts=PTS-STARTPTS[pre]`);
            labels.push('[pre]');
          }
          nodes.push(
            `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,${filter}[selected]`,
          );
          labels.push('[selected]');
          nodes.push(`[0:a]atrim=start=${end},asetpts=PTS-STARTPTS[post]`);
          labels.push('[post]');
          nodes.push(`${labels.join('')}concat=n=${labels.length}:v=0:a=1[out]`);
          args.push('-filter_complex', nodes.join(';'), '-map', '[out]');
        } else args.push('-af', filter);
      }
      args.push('-ar', '48000', '-c:a', 'pcm_s16le', 'result.wav');
      await execChecked(ff, args);
      ff.off('progress', progress);
      options.onStatus?.('Verificando o resultado…');
      const bytes = await ff.readFile('result.wav');
      if (typeof bytes === 'string' || bytes.length <= 44)
        throw new Error('O processamento não gerou áudio válido.');
      const result = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'audio/wav' });
      const info = inspect(await decode(result)),
        metrics = await measureFile(ff, 'result.wav');
      options.onProgress?.(100);
      return { blob: result, info, metrics };
    } finally {
      ff.off('progress', progress);
      for (const file of files) await ff.deleteFile(file).catch(() => {});
    }
  });
}
export async function exportMp3(blob: Blob) {
  return exclusive(async () => {
    const ff = await getEngine();
    await ff.writeFile('export.wav', new Uint8Array(await blob.arrayBuffer()));
    try {
      await execChecked(ff, [
        '-i',
        'export.wav',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '192k',
        'export.mp3',
      ]);
      const data = await ff.readFile('export.mp3');
      return new Blob([data as Uint8Array<ArrayBuffer>], { type: 'audio/mpeg' });
    } finally {
      await ff.deleteFile('export.wav').catch(() => {});
      await ff.deleteFile('export.mp3').catch(() => {});
    }
  });
}
export function makeDemo(duration = 8) {
  const buffer = new AudioBuffer({
    length: 48000 * duration,
    numberOfChannels: 1,
    sampleRate: 48000,
  });
  const data = buffer.getChannelData(0);
  let seed = 42;
  for (let i = 0; i < data.length; i++) {
    const t = i / 48000;
    seed = (seed * 16807) % 2147483647;
    const envelope = Math.pow(Math.max(0, Math.sin(t * 2.5)), 2) * 0.18;
    const melody = [220, 277.18, 329.63, 440][Math.floor(t) % 4];
    data[i] =
      envelope *
        (Math.sin(2 * Math.PI * melody * t) + 0.3 * Math.sin(2 * Math.PI * melody * 2 * t)) +
      (seed / 2147483647 - 0.5) * 0.035;
  }
  return new File([encodeWav(buffer)], 'Experimento sonoro.wav', { type: 'audio/wav' });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}
