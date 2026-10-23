import { inspect, decode, measure } from './audio';
import { restorationD, validCloudReport } from './restoration';
import type { AudioUsage } from './usage';

export class CloudCancelled extends Error {
  constructor() {
    super('Processamento cancelado. O original foi preservado.');
  }
}
async function api(body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch('/api/audio/jobs', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível acessar a restauração.');
  return data;
}
export async function restoreCloud(
  source: Blob,
  duration: number,
  options: {
    resumeId?: string;
    signal: AbortSignal;
    onStatus: (message: string) => void;
    onProgress: (value: number) => void;
    onUsage: (usage: AudioUsage) => void;
    onJob: (id: string | null) => void;
  },
) {
  let id: string | undefined;
  try {
    let prepared;
    if (options.resumeId) {
      id = options.resumeId;
      options.onJob(id);
      const response = await fetch(`/api/audio/jobs?id=${id}`, {
        signal: options.signal,
        cache: 'no-store',
      });
      const existing = await response.json();
      if (!response.ok) throw new Error(existing.error || 'Não foi possível retomar o tratamento.');
      if (existing.status === 'uploading')
        prepared = await api({ action: 'resume-upload', id }, options.signal);
    } else {
      options.onStatus('Preparando o envio privado para restauração…');
      prepared = await api({ action: 'prepare', bytes: source.size, duration }, options.signal);
      id = prepared.id;
      options.onJob(id!);
    }
    if (prepared) {
      for (let i = 0; i < prepared.uploadUrls.length; i++) {
        options.onStatus(`Enviando áudio com segurança · ${i + 1}/${prepared.uploadUrls.length}…`);
        const response = await fetch(prepared.uploadUrls[i], {
          method: 'PUT',
          signal: options.signal,
          headers: { 'Content-Type': 'application/octet-stream' },
          body: source.slice(i * prepared.partBytes, (i + 1) * prepared.partBytes),
        });
        if (!response.ok)
          throw new Error('Não foi possível enviar o áudio. Seu original foi preservado.');
        options.onProgress(Math.round((15 * (i + 1)) / prepared.uploadUrls.length));
      }
      const submitted = await api({ action: 'submit', id }, options.signal);
      if (submitted.usage) options.onUsage(submitted.usage);
    }
    let status: Record<string, unknown> | undefined;
    const deadline = Date.now() + 35 * 60000;
    while (Date.now() < deadline) {
      if (options.signal.aborted) throw new CloudCancelled();
      const response = await fetch(`/api/audio/jobs?id=${id}`, {
        signal: options.signal,
        cache: 'no-store',
      });
      status = await response.json();
      if (!response.ok)
        throw new Error(String(status?.error || 'Não foi possível consultar o tratamento.'));
      if (status?.status === 'completed') break;
      if (['failed', 'cancelled', 'released'].includes(String(status?.status)))
        throw new Error(
          'A restauração não foi concluída. Seu original foi preservado; confira seu saldo atualizado.',
        );
      options.onStatus(
        status?.status === 'running'
          ? 'Restaurando a fala com NOSSOM Restore D…'
          : 'Aguardando a GPU · a primeira inicialização pode levar alguns minutos…',
      );
      options.onProgress(status?.status === 'running' ? 55 : 20);
      await new Promise<void>((resolve, reject) => {
        const cancel = () => {
          clearTimeout(timer);
          reject(new CloudCancelled());
        };
        const timer = setTimeout(() => {
          options.signal.removeEventListener('abort', cancel);
          resolve();
        }, 2500);
        options.signal.addEventListener('abort', cancel, { once: true });
      });
    }
    if (
      !status ||
      status.status !== 'completed' ||
      !validCloudReport(status.report) ||
      !Array.isArray(status.downloadUrls)
    )
      throw new Error(
        'A restauração ainda não foi concluída. Consulte o tratamento antes de iniciar outro.',
      );
    const parts: Blob[] = [];
    for (const [index, url] of (status.downloadUrls as string[]).entries()) {
      const response = await fetch(url, { signal: options.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível baixar o resultado.');
      const part = await response.blob();
      if (part.size !== status.report.chunks[index]?.bytes)
        throw new Error('O resultado foi recebido incompleto.');
      parts.push(part);
      options.onProgress(75 + Math.round((15 * parts.length) / status.downloadUrls.length));
    }
    const blob = new Blob(parts, { type: 'audio/wav' });
    options.onStatus('Verificando o resultado e preparando seus ajustes…');
    const buffer = await decode(blob);
    if (Math.abs(buffer.duration - duration) > 0.1 || buffer.numberOfChannels !== 1)
      throw new Error('A duração do resultado não corresponde ao original.');
    const info = inspect(buffer),
      metrics = await measure(blob, options.onStatus);
    options.onProgress(100);
    // Release only after the caller has saved the returned version locally.
    return {
      id: id!,
      blob,
      info,
      metrics,
      processing: {
        engine: 'Resemble Enhance · NOSSOM Restore D',
        strength: 100,
        noiseFloor: info.noiseFloor ?? -60,
        mode: 'cloud',
        automatic: true,
        cloudRestoration: { ...restorationD, ...status.report },
      },
    };
  } catch (error) {
    if (options.signal.aborted) {
      if (id) void api({ action: 'cancel', id }).catch(() => {});
      throw new CloudCancelled();
    }
    throw error;
  }
}
export async function releaseCloudJob(id: string) {
  return api({ action: 'release', id });
}
export async function cancelCloudJob(id: string) {
  return api({ action: 'cancel', id });
}
