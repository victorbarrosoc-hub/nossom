import { openDB, type DBSchema } from 'idb';
import type { AudioInfo, Measurements } from './audio';
import type { FilterSettings } from './presets';
export type Version = {
  id: string;
  label: string;
  createdAt: number;
  blob: Blob;
  info: AudioInfo;
  metrics: Measurements;
  parentId?: string;
  operation?: string;
  preset?: string;
  processing?: FilterSettings & {
    engine: string;
    strength: number;
    noiseFloor: number;
    mode: string;
    noiseReduction?: number;
    presence?: number;
    compression?: number;
    highpass?: number;
  };
};
export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  activeVersionId?: string;
  redoVersionIds?: string[];
  originalFile: Blob;
  originalName: string;
  versions: Version[];
};
export type ProjectSummary = Omit<Project, 'versions' | 'originalFile'> & {
  duration: number;
  versionCount: number;
};
interface NossomDB extends DBSchema {
  projects: { key: string; value: Project };
}
const db = () =>
  openDB<NossomDB>('nossom-studio', 1, {
    upgrade(database) {
      database.createObjectStore('projects', { keyPath: 'id' });
    },
  });
export async function listProjects(): Promise<ProjectSummary[]> {
  const all = await (await db()).getAll('projects');
  return all
    .map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      originalName: p.originalName,
      duration: p.versions[0].info.duration,
      versionCount: p.versions.length,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function saveProject(project: Project) {
  try {
    await (await db()).put('projects', project);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError')
      throw new Error(
        'O armazenamento deste navegador está cheio. Exclua projetos antigos e tente novamente.',
      );
    throw e;
  }
}
export async function getProject(id: string) {
  return (await db()).get('projects', id);
}
export async function deleteProject(id: string) {
  await (await db()).delete('projects', id);
}
