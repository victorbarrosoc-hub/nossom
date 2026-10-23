import { randomUUID } from 'node:crypto';
import { supabaseConfig } from './supabase';
import { audioUsage } from './usage';
import {
  CLOUD_PART_BYTES,
  CLOUD_OUTPUT_PARTS,
  type CloudReport,
  type CloudState,
  restorationD,
  validCloudReport,
} from '../restoration';

const bucket = 'nossom-restoration';
export type RestorationJob = {
  id: string;
  user_id: string;
  status: CloudState;
  input_parts: number;
  input_bytes: number;
  duration: number;
  provider_id: string | null;
  report: CloudReport | null;
  created_at: string;
};
export class RestorationError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
function config() {
  const sb = supabaseConfig();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = process.env.RUNPOD_API_KEY;
  const endpoint = process.env.RUNPOD_ENDPOINT_ID;
  if (!sb || !service || !key || !endpoint || !/^[a-zA-Z0-9_-]{3,100}$/.test(endpoint)) return null;
  return { ...sb, service, runpodKey: key, endpoint };
}
export const restorationConfigured = () => !!config();
async function service<T>(path: string, method = 'POST', body?: unknown): Promise<T> {
  const c = config();
  if (!c)
    throw new RestorationError(
      'A restauração avançada está sendo conectada. As ferramentas de acabamento continuam disponíveis.',
    );
  const response = await fetch(c.url + path, {
    method,
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    headers: {
      apikey: c.service,
      Authorization: `Bearer ${c.service}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok)
    throw new RestorationError(
      'Não foi possível acessar o processamento. Tente novamente em instantes.',
    );
  return response.status === 204 ? (undefined as T) : response.json();
}
export async function jobAction(action: string, user: string | null, id?: string, data?: unknown) {
  return service<{ job: RestorationJob | null; claimed?: boolean; jobs?: RestorationJob[] }>(
    '/rest/v1/rpc/nossom_restoration_job',
    'POST',
    { p_action: action, p_user: user, p_id: id ?? null, p_data: data ?? {} },
  );
}
function objectPath(job: RestorationJob, kind: 'source' | 'output', part: number) {
  return `${job.user_id}/${job.id}/${kind}-${part}.bin`;
}
function storageURL(path: string) {
  const c = config()!;
  const url = new URL(path, c.url);
  if (url.origin !== new URL(c.url).origin || !url.pathname.startsWith('/storage/v1/'))
    throw new RestorationError('O armazenamento retornou um endereço inválido.');
  return url.href;
}
async function uploadURL(job: RestorationJob, kind: 'source' | 'output', part: number) {
  const path = objectPath(job, kind, part);
  const data = await service<{ url: string }>(
    `/storage/v1/object/upload/sign/${bucket}/${path}`,
    'POST',
    { upsert: true },
  );
  // Supabase returns a path relative to /storage/v1, not the API origin.
  return storageURL(data.url.startsWith('/storage/v1/') ? data.url : '/storage/v1' + data.url);
}
async function readURL(job: RestorationJob, kind: 'source' | 'output', part: number) {
  const path = objectPath(job, kind, part);
  const data = await service<{ signedURL: string }>(
    `/storage/v1/object/sign/${bucket}/${path}`,
    'POST',
    { expiresIn: 3600 },
  );
  return storageURL(
    data.signedURL.startsWith('/storage/v1/') ? data.signedURL : '/storage/v1' + data.signedURL,
  );
}
async function runpod(path: string, method = 'GET', body?: unknown) {
  const c = config();
  if (!c) throw new RestorationError('O motor de restauração ainda não está conectado.');
  const response = await fetch(`https://api.runpod.ai/v2/${c.endpoint}/${path}`, {
    method,
    cache: 'no-store',
    signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${c.runpodKey}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok)
    throw new RestorationError(
      'O servidor de restauração está indisponível. Tente novamente em instantes.',
    );
  return response.json();
}
export async function prepareJob(user: string, bytes: number, duration: number) {
  const result = await jobAction('prepare', user, randomUUID(), {
    input_bytes: bytes,
    duration,
    input_parts: Math.ceil(bytes / CLOUD_PART_BYTES),
  });
  const job = result.job;
  if (!job)
    throw new RestorationError(
      'Você já tem um áudio em processamento. Aguarde a conclusão ou cancele o pedido anterior.',
      409,
    );
  return uploadPlan(job);
}
export async function uploadPlan(job: RestorationJob) {
  if (job.status !== 'uploading')
    throw new RestorationError('O envio deste trabalho já foi encerrado.', 409);
  return {
    id: job.id,
    partBytes: CLOUD_PART_BYTES,
    uploadUrls: await Promise.all(
      Array.from({ length: job.input_parts }, (_, i) => uploadURL(job, 'source', i)),
    ),
  };
}
export async function ownedJob(user: string, id: string) {
  const { job } = await jobAction('get', user, id);
  if (!job) throw new RestorationError('Tratamento não encontrado para esta conta.', 404);
  return job;
}
export async function submitJob(request: Request, user: string, id: string) {
  const { job, claimed } = await jobAction('claim', user, id);
  if (!job) throw new RestorationError('Tratamento não encontrado.', 404);
  if (!claimed) return { id, status: job.status };
  let dispatched = false;
  try {
    const usage = await audioUsage(request, job.id, 'auto');
    if (!usage.allowed)
      throw new RestorationError(
        'A franquia mensal não cobre este áudio. Confira seus minutos ou solicite outro plano.',
        429,
      );
    const [inputUrls, outputUrls] = await Promise.all([
      Promise.all(Array.from({ length: job.input_parts }, (_, i) => readURL(job, 'source', i))),
      Promise.all(
        Array.from({ length: CLOUD_OUTPUT_PARTS }, (_, i) => uploadURL(job, 'output', i)),
      ),
    ]);
    // Once dispatch begins its outcome can be ambiguous on a network failure.
    // Never retry dispatch or refund blindly: that could create duplicate GPU work.
    dispatched = true;
    const result = await runpod('run', 'POST', {
      input: {
        preset: restorationD.id,
        input_urls: inputUrls,
        output_urls: outputUrls,
        input_bytes: job.input_bytes,
        duration: job.duration,
        storage_origin: new URL(config()!.url).origin,
      },
      policy: { executionTimeout: 900000, ttl: 1800000 },
    });
    if (typeof result.id !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(result.id))
      throw new RestorationError('O servidor não confirmou o tratamento.');
    await jobAction('update', user, id, { status: 'queued', provider_id: result.id });
    return { id, status: 'queued', usage };
  } catch (error) {
    if (!dispatched) await jobAction('fail', user, id).catch(() => {});
    throw error;
  }
}
export async function jobStatus(user: string, id: string) {
  let job = await ownedJob(user, id);
  if (['queued', 'running'].includes(job.status) && job.provider_id) {
    const result = await runpod(`status/${job.provider_id}`);
    if (
      ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT'].includes(result.status) &&
      Number.isInteger(result.executionTime) &&
      result.executionTime >= 0 &&
      result.executionTime <= 3600000
    ) {
      await service('/rest/v1/rpc/nossom_job_runtime', 'POST', {
        p_id: id,
        p_user: user,
        p_runtime: result.executionTime,
      });
    }
    if (result.status === 'COMPLETED') {
      if (!validCloudReport(result.output)) {
        await jobAction('fail', user, id);
        throw new RestorationError(
          'O motor não gerou um áudio válido. Seu tratamento foi devolvido.',
        );
      }
      const updated = await jobAction('update', user, id, {
        status: 'completed',
        report: result.output,
      });
      job = updated.job ?? job;
    } else if (['FAILED', 'CANCELLED', 'TIMED_OUT'].includes(result.status)) {
      const failed = await jobAction('fail', user, id);
      job = failed.job ?? job;
    } else if (result.status === 'IN_PROGRESS' && job.status !== 'running') {
      job = (await jobAction('update', user, id, { status: 'running' })).job ?? job;
    }
  }
  return {
    id,
    status: job.status,
    ...(job.status === 'completed' && validCloudReport(job.report)
      ? {
          report: job.report,
          downloadUrls: await Promise.all(
            job.report.chunks.map((_, i) => readURL(job, 'output', i)),
          ),
        }
      : {}),
  };
}
export async function clearJob(job: RestorationJob) {
  const prefixes = [
    ...Array.from({ length: job.input_parts }, (_, i) => objectPath(job, 'source', i)),
    ...Array.from({ length: CLOUD_OUTPUT_PARTS }, (_, i) => objectPath(job, 'output', i)),
  ];
  await service(`/storage/v1/object/${bucket}`, 'DELETE', { prefixes });
  await jobAction('release', job.user_id, job.id);
}
export async function cancelJob(user: string, id: string) {
  const job = await ownedJob(user, id);
  if (job.provider_id && ['queued', 'running'].includes(job.status)) {
    await runpod(`cancel/${job.provider_id}`, 'POST');
    // Do not stop a shared worker: RunPod handles the queue and scale-down.
    return { id, status: 'cancelling' };
  }
  if (job.status === 'uploading') {
    const failed = await jobAction('fail', user, id);
    if (failed.job) await clearJob(failed.job);
    return { id, status: 'released' };
  }
  return { id, status: job.status };
}
