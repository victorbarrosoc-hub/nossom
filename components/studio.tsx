'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toolPath, routeOperation } from '@/lib/studio-routes';
import { activateVersion, activeIndex, previousIndex, nextIndex } from '@/lib/history';
import { EqualizerControls, BroadcastControls } from './preset-controls';
import ClaudeSettings from './claude-settings';
import { eqPresets, type EqGains } from '@/lib/equalizer';
import { freshBroadcast, type BroadcastSettings } from '@/lib/broadcast';
import PresetLibrary from './preset-library';
import type { SavedRecipe } from '@/lib/saved-presets';
import { voicePresets } from '@/lib/voice-presets';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  AudioLines,
  Folder,
  House,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Upload,
  Mic,
  Search,
  Clock,
  MoreHorizontal,
  Trash2,
  Download,
  Check,
  ChevronRight,
  X,
  Settings2,
  ShieldCheck,
  LoaderCircle,
  Square,
  FileAudio,
  Activity,
  Undo2,
  MessageCircle,
  Menu,
  PenLine,
  Info,
} from 'lucide-react';
import { Brand } from './brand';
import { useDialog } from '@/lib/use-dialog';
import Assistant from './assistant';
import { WavePlayer } from './wave-player';
import { operations, deliveryPresets, type Operation, type DenoiseMode } from '@/lib/presets';
import { estimateNoiseFloor } from '@/lib/noise-profile';
import {
  decode,
  importAudio,
  processAudio,
  exportMp3,
  makeDemo,
  download,
  formatTime,
  cancelProcessing,
  type Measurements,
} from '@/lib/audio';
import {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  type Project,
  type ProjectSummary,
  type Version,
} from '@/lib/storage';
const toolIcons = {
  denoise: Sparkles,
  eq: SlidersHorizontal,
  clarity: Mic,
  wind: AudioLines,
  level: SlidersHorizontal,
  master: Activity,
  mix: Layers,
};
function metric(value: number | null, suffix = '') {
  return value === null ? '—' : `${value.toFixed(1)}${suffix}`;
}
function date(value: number) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(value);
}
function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="audio-range">
      <span>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </span>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={`${value}${unit}`}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="range-scale">
        <small>
          {min}
          {unit}
        </small>
        <small>
          {max}
          {unit}
        </small>
      </span>
    </label>
  );
}
export default function Studio() {
  const pathname = usePathname(),
    router = useRouter();
  const routeTool = routeOperation(pathname);
  const [eqPreset, setEqPreset] = useState('neutral'),
    [eqGains, setEqGains] = useState<EqGains>([0, 0, 0, 0, 0]),
    [eqHighpass, setEqHighpass] = useState(30);
  const [masterRecipe, setMasterRecipe] = useState('podcast');
  const [broadcast, setBroadcast] = useState<BroadcastSettings>(freshBroadcast);
  const [voicePreset, setVoicePreset] = useState('dialogue'),
    [deess, setDeess] = useState(25),
    [hum, setHum] = useState(0);
  function selectEq(id: string) {
    const p = eqPresets.find((p) => p.id === id);
    if (!p) return;
    setEqPreset(id);
    setEqGains([...p.gains]);
    setEqHighpass(p.highpass);
  }
  function selectVoice(id: string) {
    const p = voicePresets.find((p) => p.id === id);
    if (!p) return;
    setVoicePreset(id);
    setPresence(p.presence);
    setCompression(p.compression);
    setDeess(p.deess);
    setHum(p.hum);
    setIntensity(p.strength);
    setDenoiseMode('studio');
  }
  function selectMaster(id: string) {
    setMasterRecipe(id);
    if (id === 'broadcast') {
      setBroadcast(freshBroadcast());
      setIntensity(100);
      return;
    }
    const p = deliveryPresets.find((p) => p.id === id);
    if (p) {
      setPreset(id);
      setTarget(p.lufs);
      setPeak(p.peak);
    }
    setIntensity(80);
    setCompression(id === 'social' ? 3 : 2);
  }

  const [denoiseMode, setDenoiseMode] = useState<DenoiseMode>('studio');
  const [noiseFloor, setNoiseFloor] = useState<number | null>(null);
  const [noiseReduction, setNoiseReduction] = useState(36);
  const [neuralAttenuation, setNeuralAttenuation] = useState(60);
  const [presence, setPresence] = useState(2);
  const [compression, setCompression] = useState(2);
  const [highpass, setHighpass] = useState(140);
  const [analysisNote, setAnalysisNote] = useState('');
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('dark');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nossom-theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {
      /* The studio also works with preference storage disabled. */
    }
  }, []);
  function changeTheme(value: 'system' | 'light' | 'dark') {
    setTheme(value);
    try {
      localStorage.setItem('nossom-theme', value);
    } catch {
      /* Optional preference. */
    }
  }
  const [view, setView] = useState<'home' | 'projects' | 'editor' | 'tool' | 'ai'>(
      pathname === '/studio/ia'
        ? 'ai'
        : pathname === '/studio/projetos'
          ? 'projects'
          : routeTool
            ? 'tool'
            : 'home',
    ),
    [projects, setProjects] = useState<ProjectSummary[]>([]),
    [project, setProject] = useState<Project | null>(null),
    [versionIndex, setVersionIndex] = useState(0);
  const [operation, setOperation] = useState<Operation>(routeTool ?? 'denoise'),
    [intensity, setIntensity] = useState(100),
    [preset, setPreset] = useState('podcast'),
    [target, setTarget] = useState(-16),
    [peak, setPeak] = useState(-1),
    [advanced, setAdvanced] = useState(false),
    [search, setSearch] = useState('');
  const [busy, setBusy] = useState(''),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [assistant, setAssistant] = useState(false),
    [sidebar, setSidebar] = useState(false),
    [dragging, setDragging] = useState(false),
    [deleteId, setDeleteId] = useState<string | null>(null),
    [renaming, setRenaming] = useState(false),
    [newName, setNewName] = useState('');
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null),
    [music, setMusic] = useState<{ blob: Blob; name: string } | null>(null),
    [musicGain, setMusicGain] = useState(0.25),
    [recording, setRecording] = useState(false),
    [recordSeconds, setRecordSeconds] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null),
    musicInput = useRef<HTMLInputElement>(null),
    recorder = useRef<MediaRecorder | null>(null),
    recordStream = useRef<MediaStream | null>(null),
    operationLock = useRef(false),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useDialog(!!deleteId || renaming);
  const version = project?.versions[versionIndex];
  const selectedTool = operations.find((o) => o.id === operation)!;
  useEffect(() => {
    if (pathname === '/studio/ia') {
      setView('ai');
      return;
    }
    if (pathname === '/studio/projetos') {
      setView('projects');
      return;
    }
    const tool = routeOperation(pathname);
    if (tool) {
      setOperation(tool);
      setView(project ? 'editor' : 'tool');
      const id = new URLSearchParams(location.search).get('project');
      if (id && project?.id !== id)
        void getProject(id)
          .then((p) => {
            if (p) {
              setProject(p);
              setVersionIndex(activeIndex(p));
              setView('editor');
            }
          })
          .catch(() => setError('Não foi possível abrir este projeto.'));
    } else setView('home');
    setSidebar(false);
  }, [pathname]);
  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() =>
        setError('O armazenamento local está indisponível. Permita dados neste navegador.'),
      );
    const tool = new URLSearchParams(location.search).get('tool');
    if (operations.some((o) => o.id === tool)) {
      setOperation(tool as Operation);
      router.replace(toolPath(tool as Operation));
    }
    return () => {
      recordStream.current?.getTracks().forEach((t) => t.stop());
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);
  useEffect(() => {
    if (recording && recordSeconds >= 600) recorder.current?.stop();
  }, [recordSeconds, recording]);
  useEffect(() => {
    if (!busy && !recording) return;
    const prevent = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [busy, recording]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAssistant(false);
        setDeleteId(null);
        setRenaming(false);
        setSidebar(false);
      }
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);
  function notify(text: string) {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6000);
  }
  async function refresh() {
    setProjects(await listProjects());
  }
  async function run(task: () => Promise<void>) {
    if (operationLock.current || recording) return;
    operationLock.current = true;
    setError('');
    setProgress(0);
    setBusy('Preparando…');
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.');
    } finally {
      setBusy('');
      setProgress(0);
      operationLock.current = false;
    }
  }
  async function upload(file: File) {
    await run(async () => {
      if (projects.length >= 20)
        throw new Error(
          'Você chegou a 20 projetos locais. Exporte e exclua projetos antigos para liberar espaço.',
        );
      setBusy('Lendo seu áudio…');
      const result = await importAudio(file, setBusy);
      const now = Date.now();
      const created: Project = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''),
        createdAt: now,
        updatedAt: now,
        originalFile: file,
        originalName: file.name,
        versions: [{ id: crypto.randomUUID(), label: 'Original', createdAt: now, ...result }],
      };
      await saveProject(created);
      setProject(created);
      setVersionIndex(0);
      setRegion(null);
      setMusic(null);
      setView('editor');
      router.push(toolPath(operation, created.id), { scroll: false });
      await refresh();
      notify('Áudio importado. Seu original está preservado.');
    });
  }
  async function open(id: string) {
    if (busy || recording) return;
    try {
      const p = await getProject(id);
      if (p) {
        setProject(p);
        setVersionIndex(activeIndex(p));
        setRegion(null);
        setMusic(null);
        setView('editor');
        router.push(toolPath(operation, p.id), { scroll: false });
      }
    } catch {
      setError('Não foi possível abrir esse projeto.');
    }
  }
  function navigate(next: 'home' | 'projects' | 'editor') {
    if (busy || recording) return;
    setSidebar(false);
    router.push(
      next === 'projects'
        ? '/studio/projetos'
        : next === 'home'
          ? '/studio'
          : toolPath(operation, project?.id),
      { scroll: false },
    );
  }
  function chooseTool(next: Operation) {
    if (busy || recording) return;
    setOperation(next);
    setSidebar(false);
    router.push(toolPath(next, project?.id), { scroll: false });
  }
  async function selectVersion(index: number, action: 'select' | 'undo' | 'redo' = 'select') {
    if (!project || busy || recording || index < 0 || index >= project.versions.length) return;
    await run(async () => {
      const updated = activateVersion(project, index);
      if (action === 'undo')
        updated.redoVersionIds = [
          project.versions[versionIndex].id,
          ...(project.redoVersionIds ?? []),
        ];
      else if (action === 'redo')
        updated.redoVersionIds =
          project.redoVersionIds?.[0] === project.versions[index].id
            ? project.redoVersionIds.slice(1)
            : [];
      await saveProject(updated);
      setProject(updated);
      setVersionIndex(index);
      await refresh();
      notify(
        index === 0
          ? 'Original restaurado. O histórico continua disponível.'
          : 'Versão ativa alterada. Você pode refazer pelo histórico.',
      );
    });
  }
  function loadSavedPreset(p: SavedRecipe) {
    setIntensity(Math.max(0, Math.min(100, p.intensity)));
    setDenoiseMode(p.mode);
    setTarget(Math.max(-30, Math.min(-10, p.target)));
    setPeak(Math.max(-6, Math.min(-1, p.peak)));
    setMusicGain(Math.max(0, Math.min(1, p.musicGain)));
    const s = p.settings;
    setNoiseFloor(s.noiseFloor ?? null);
    setNoiseReduction(s.noiseReduction ?? 36);
    setNeuralAttenuation(s.neuralAttenuation ?? 60);
    setPresence(s.presence ?? 2);
    setCompression(s.compression ?? 2);
    setHighpass(s.highpass ?? 140);
    setDeess(s.deess ?? 25);
    setHum(s.hum ?? 0);
    setVoicePreset('custom');
    if (s.eq) {
      setEqGains(s.eq);
      setEqHighpass(s.highpass ?? 30);
      setEqPreset('custom');
    }
    if (s.masterPreset) {
      setMasterRecipe(s.masterPreset);
      if (s.masterPreset !== 'broadcast') setPreset(s.masterPreset);
    }
    if (s.broadcast) setBroadcast(structuredClone(s.broadcast));
  }
  async function applyTreatment() {
    if (!project || !version) return;
    await run(async () => {
      if (project.versions.length >= 9)
        throw new Error(
          'Limite de 8 tratamentos por projeto. Exporte o resultado para iniciar outro projeto.',
        );
      if (operation === 'mix' && !music)
        throw new Error('Envie uma faixa de música antes de mixar.');
      if (operation === 'mix' && region)
        throw new Error('Para mixar, desative a seleção de trecho. A mixagem usa o áudio inteiro.');
      const result = await processAudio(version.blob, {
        operation,
        intensity,
        mode: denoiseMode,
        settings: {
          noiseFloor: noiseFloor ?? version.info.noiseFloor,
          noiseReduction,
          neuralAttenuation,
          presence,
          compression,
          highpass: operation === 'eq' ? eqHighpass : highpass,
          eq: operation === 'eq' ? eqGains : undefined,
          masterPreset: operation === 'master' ? masterRecipe : undefined,
          broadcast: operation === 'master' && masterRecipe === 'broadcast' ? broadcast : undefined,
          deess: operation === 'clarity' ? deess : undefined,
          hum: operation === 'clarity' ? hum : undefined,
        },
        target,
        peak,
        music: music?.blob,
        musicGain,
        region: region ?? undefined,
        onStatus: setBusy,
        onProgress: setProgress,
      });
      const newVersion: Version = {
        id: crypto.randomUUID(),
        parentId: version.id,
        label: `${selectedTool.label} · V${project.versions.length}`,
        createdAt: Date.now(),
        operation,
        preset:
          operation === 'master'
            ? masterRecipe === 'broadcast'
              ? 'Transmissão + Limite −3 dB'
              : `${preset} / alvo ${target} LUFS / pico ${peak} dBTP / v2`
            : operation === 'eq'
              ? `EQ: ${eqPresets.find((p) => p.id === eqPreset)?.label ?? 'Personalizado'}`
              : operation === 'clarity'
                ? `Voz: ${voicePresets.find((p) => p.id === voicePreset)?.label ?? 'Personalizado'}`
                : undefined,
        ...result,
      };
      const updated = {
        ...project,
        updatedAt: Date.now(),
        versions: [...project.versions, newVersion],
        activeVersionId: newVersion.id,
        redoVersionIds: [],
      };
      await saveProject(updated);
      setProject(updated);
      setVersionIndex(updated.versions.length - 1);
      await refresh();
      notify('Nova versão salva. Compare com o original.');
    });
  }
  async function addMusic(file: File) {
    await run(async () => {
      const result = await importAudio(file, setBusy);
      setMusic({ blob: result.blob, name: file.name });
      notify('Trilha adicionada à mixagem.');
    });
  }
  async function exportAudio(format: 'wav' | 'mp3') {
    if (!project || !version) return;
    await run(async () => {
      setBusy(`Preparando ${format.toUpperCase()}…`);
      const blob = format === 'wav' ? version.blob : await exportMp3(version.blob);
      download(blob, `${project.name}-v${versionIndex}.${format}`);
      notify('Seu download está pronto.');
    });
  }
  function report() {
    if (!project || !version) return;
    const body = {
      product: 'NOSSOM',
      reportVersion: '2.0',
      activeVersionId: version.id,
      algorithm: 'FFmpeg loudnorm / EBU R128 measurement',
      createdAt: new Date().toISOString(),
      project: project.name,
      source: project.originalName,
      version: version.label,
      processingPreset: version.preset ?? null,
      processingSettings: version.processing ?? null,
      output: {
        format: 'WAV PCM 16-bit',
        sampleRate: version.info.sampleRate,
        channels: version.info.channels,
        duration: version.info.duration,
      },
      before: project.versions[0].metrics,
      after: version.metrics,
      clippedSamples: version.info.clipped,
      samplePeakDbfs: Number.isFinite(version.info.peak) ? version.info.peak : null,
      history: project.versions.map((v) => ({
        label: v.label,
        operation: v.operation ?? 'import',
        parentId: v.parentId ?? null,
        processing: v.processing ?? null,
        preset: v.preset ?? null,
        createdAt: new Date(v.createdAt).toISOString(),
      })),
      notice:
        'Medições do WAV renderizado. Não constitui certificação de entrega. Metas e tolerâncias devem ser acordadas com o destinatário.',
    };
    download(
      new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }),
      `${project.name}-relatorio.json`,
    );
    notify('Relatório JSON exportado.');
  }
  async function remove() {
    if (!deleteId) return;
    try {
      await deleteProject(deleteId);
      if (project?.id === deleteId) {
        setProject(null);
        setView('projects');
      }
      setDeleteId(null);
      await refresh();
      notify('Projeto excluído deste navegador.');
    } catch {
      setError('Não foi possível excluir o projeto.');
    }
  }
  async function rename() {
    if (!project || !newName.trim()) return;
    try {
      const updated = { ...project, name: newName.trim().slice(0, 100), updatedAt: Date.now() };
      await saveProject(updated);
      setProject(updated);
      await refresh();
      setRenaming(false);
    } catch {
      setError('Não foi possível salvar o nome.');
    }
  }
  async function record() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (busy) return;
    setError('');
    if (projects.length >= 20) {
      setError('Limite de 20 projetos locais. Exporte e exclua projetos antigos para continuar.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      recordStream.current = stream;
      const media = new MediaRecorder(stream),
        chunks: BlobPart[] = [];
      recorder.current = media;
      media.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const file = new File(chunks, `Gravação ${new Date().toISOString().slice(0, 10)}.webm`, {
          type: media.mimeType,
        });
        setTimeout(() => {
          operationLock.current = false;
          void importRecording(file);
        }, 0);
      };
      media.start(1000);
      setRecordSeconds(0);
      setRecording(true);
    } catch {
      setError('Não foi possível acessar o microfone. Confira a permissão no navegador.');
    }
  }
  async function importRecording(file: File) {
    operationLock.current = true;
    setBusy('Preparando gravação…');
    try {
      const result = await importAudio(file, setBusy);
      const now = Date.now();
      const p: Project = {
        id: crypto.randomUUID(),
        name: `Gravação ${date(now)}`,
        createdAt: now,
        updatedAt: now,
        originalFile: file,
        originalName: file.name,
        versions: [{ id: crypto.randomUUID(), label: 'Original', createdAt: now, ...result }],
      };
      await saveProject(p);
      setProject(p);
      setVersionIndex(0);
      setRegion(null);
      setMusic(null);
      setView('editor');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao importar gravação.');
    } finally {
      setBusy('');
      operationLock.current = false;
    }
  }
  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const renderProject = (p: ProjectSummary) => (
    <div className="project-row" key={p.id}>
      <button className="project-open" onClick={() => open(p.id)} disabled={!!busy || recording}>
        <span className="project-icon">
          <AudioLines size={21} />
        </span>
        <span>
          <strong>{p.name}</strong>
          <small>
            {formatTime(p.duration)} · {p.versionCount}{' '}
            {p.versionCount === 1 ? 'versão' : 'versões'}
          </small>
        </span>
        <span className="project-date">{date(p.updatedAt)}</span>
        <span className="project-status">
          <span /> Salvo localmente
        </span>
        <ChevronRight size={17} />
      </button>
      <button
        className="icon-button delete-button"
        aria-label={`Excluir ${p.name}`}
        disabled={!!busy || recording}
        onClick={() => setDeleteId(p.id)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
  return (
    <div
      className={`studio-shell ${routeTool ? `tool-editor tool-${routeTool}` : ''}`}
      data-theme={theme}
    >
      <a className="skip-link" href="#studio-main">
        Pular para o estúdio
      </a>
      {sidebar && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebar(false)}
          aria-label="Fechar navegação"
        />
      )}
      <aside className={`studio-sidebar ${sidebar ? 'open' : ''}`}>
        <Link href="/" aria-label="NOSSOM página inicial">
          <Brand />
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">N</span>
          <div>
            Meu espaço<small>Estúdio local</small>
          </div>
          <span className="local-badge">BETA</span>
        </div>
        <button
          className="button primary new-project"
          onClick={() => fileInput.current?.click()}
          disabled={!!busy || recording}
        >
          <Plus size={17} /> Novo projeto
        </button>
        <nav aria-label="Navegação do estúdio">
          <button className={view === 'home' ? 'active' : ''} onClick={() => navigate('home')}>
            <House size={18} /> Início
          </button>
          <button
            className={view === 'projects' ? 'active' : ''}
            onClick={() => navigate('projects')}
          >
            <Folder size={18} /> Meus projetos <small>{projects.length}</small>
          </button>
          <span className="sidebar-caption">FERRAMENTAS</span>
          {operations.map((o) => {
            const Icon = toolIcons[o.id];
            return (
              <button
                key={o.id}
                className={routeTool === o.id ? 'active' : ''}
                onClick={() => chooseTool(o.id)}
              >
                <Icon size={17} />
                {o.label}
              </button>
            );
          })}
          <button
            className={view === 'ai' ? 'active' : ''}
            onClick={() => {
              if (!busy && !recording) router.push('/studio/ia');
            }}
          >
            <AudioLines size={17} /> Inteligência NOSSOM
          </button>
          <span className="sidebar-caption">EM BREVE</span>
          <span className="future-nav">
            <Layers size={17} /> Separação por IA <small>Em breve</small>
          </span>
          <span className="future-nav">
            <Folder size={17} /> Nuvem e equipes <small>Em breve</small>
          </span>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={17} />
            <div>
              Seu áudio fica com você.
              <p>
                Processamento e projetos
                <br />
                neste navegador.
              </p>
            </div>
          </div>
          <Link href="/privacidade">
            Privacidade e armazenamento <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>
      <div className="studio-body">
        <header className="studio-header">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir navegação"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <span>Meu espaço</span>
            <ChevronRight size={12} />
            <strong>
              {routeTool
                ? selectedTool.label
                : view === 'ai'
                  ? 'Inteligência NOSSOM'
                  : view === 'projects'
                    ? 'Meus projetos'
                    : 'Início'}
            </strong>
          </div>
          <div className="studio-header-actions">
            <label className="theme-control">
              <span className="sr-only">Tema do estúdio</span>
              <select
                aria-label="Tema do estúdio"
                value={theme}
                onChange={(e) => changeTheme(e.target.value as 'system' | 'light' | 'dark')}
              >
                <option value="system">Tema do aparelho</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </label>
            <button
              className="assistant-top"
              aria-label="Assistente NOSSOM"
              onClick={() => setAssistant(true)}
            >
              <AudioLines size={17} />
              <span>Assistente NOSSOM</span>
              <span className="keycap">↗</span>
            </button>
          </div>
        </header>
        <main id="studio-main" className="studio-main">
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            aria-label="Importar arquivo de áudio"
            accept="audio/*,video/mp4,video/quicktime,.m4a,.flac,.mov,.webm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void upload(f);
            }}
          />
          <input
            ref={musicInput}
            className="sr-only"
            type="file"
            aria-label="Importar trilha de música"
            accept="audio/*,.m4a,.flac"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void addMusic(f);
            }}
          />
          {error && (
            <div className="alert error" role="alert">
              <Info size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dispensar erro"
                onClick={() => setError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {busy && (
            <div className="processing-banner" role="status">
              <LoaderCircle className="spin" size={19} />
              <div>
                <strong>{busy}</strong>
                <small>
                  {progress > 0 ? `${progress}% · ` : ''}O original está preservado. Mantenha esta
                  aba aberta.
                </small>
              </div>
              {progress > 0 && <progress value={progress} max={100} />}
              <button
                className="text-link"
                onClick={() => {
                  cancelProcessing();
                  setError(
                    'Processamento cancelado. O original e as versões salvas foram preservados.',
                  );
                }}
              >
                Cancelar
              </button>
            </div>
          )}
          {(view === 'home' || view === 'tool') && (
            <>
              <div className="studio-welcome">
                <div>
                  <span className="eyebrow">TUDO ACONTECE NO SOM</span>
                  <h1>{view === 'tool' ? selectedTool.label : 'Seu espaço de criação.'}</h1>
                  <p>
                    {view === 'tool'
                      ? selectedTool.description
                      : 'Grave uma ideia, cuide do som e prepare a próxima entrega.'}
                  </p>
                </div>
                <div className="workspace-indicator">
                  <span className="status-light" /> Seu estúdio está aberto
                </div>
              </div>
              {view === 'home' && (
                <div className="studio-stats">
                  <div>
                    <span className="stat-icon purple">
                      <Folder size={19} />
                    </span>
                    <div>
                      <span>Seus projetos</span>
                      <strong>{projects.length}</strong>
                      <small>Salvos neste navegador</small>
                    </div>
                  </div>
                  <div>
                    <span className="stat-icon blue">
                      <Clock size={19} />
                    </span>
                    <div>
                      <span>Áudio no seu espaço</span>
                      <strong>
                        {formatTime(projects.reduce((sum, p) => sum + p.duration, 0))}
                      </strong>
                      <small>Duração dos originais</small>
                    </div>
                  </div>
                  <div>
                    <span className="stat-icon green">
                      <ShieldCheck size={19} />
                    </span>
                    <div>
                      <span>Seu áudio, com você</span>
                      <strong>Local</strong>
                      <small>Sem envio para servidores</small>
                    </div>
                  </div>
                </div>
              )}
              <div className="studio-start-grid">
                <section
                  className={`upload-zone ${dragging ? 'dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f && !busy && !recording) void upload(f);
                  }}
                >
                  <span className="upload-icon">
                    <Upload size={25} strokeWidth={1.4} />
                  </span>
                  <h2>Vamos dar o primeiro play.</h2>
                  <p>Arraste um arquivo ou escolha por onde começar.</p>
                  <div className="upload-actions">
                    <button
                      className="button primary"
                      disabled={!!busy || recording}
                      onClick={() => fileInput.current?.click()}
                    >
                      <Plus size={16} /> Enviar áudio
                    </button>
                    <button
                      className={`button secondary ${recording ? 'recording' : ''}`}
                      onClick={record}
                      disabled={!!busy}
                    >
                      {recording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}{' '}
                      {recording ? `Finalizar · ${formatTime(recordSeconds)}` : 'Gravar uma ideia'}
                    </button>
                  </div>
                  <span className="upload-formats">
                    WAV, MP3, M4A, FLAC, OGG, MP4 e MOV · até 100 MB / 10 min
                  </span>
                </section>
                <aside className="studio-start-guide">
                  <span className="eyebrow">DO ARQUIVO AO ÁUDIO PRONTO</span>
                  <h2>Um passo de cada vez.</h2>
                  <ol>
                    <li>
                      <span>1</span>
                      <div>
                        <strong>Traga o seu áudio</strong>
                        <p>Importe um arquivo ou grave aqui.</p>
                      </div>
                    </li>
                    <li>
                      <span>2</span>
                      <div>
                        <strong>Encontre o ponto</strong>
                        <p>Ajuste e compare com o original.</p>
                      </div>
                    </li>
                    <li>
                      <span>3</span>
                      <div>
                        <strong>Prepare a entrega</strong>
                        <p>Baixe em WAV ou MP3.</p>
                      </div>
                    </li>
                  </ol>
                </aside>
              </div>
              {view === 'home' && (
                <div className="quick-section">
                  <div className="subheading">
                    <h2>O que você quer melhorar?</h2>
                    <span>ESCOLHA UM TRATAMENTO</span>
                  </div>
                  <div className="quick-grid">
                    {operations.slice(0, 5).map((o) => {
                      const Icon = toolIcons[o.id];
                      return (
                        <button
                          key={o.id}
                          className={operation === o.id ? 'selected' : ''}
                          onClick={() => chooseTool(o.id)}
                        >
                          <Icon size={21} strokeWidth={1.5} />
                          <span>{o.label}</span>
                          <ArrowUpRight size={13} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="studio-lower">
                <section className="recent-projects">
                  <div className="subheading">
                    <h2>Projetos recentes</h2>
                    <button className="text-link" onClick={() => navigate('projects')}>
                      Ver todos <ArrowRight size={13} />
                    </button>
                  </div>
                  {projects.length ? (
                    projects.slice(0, 4).map(renderProject)
                  ) : (
                    <div className="empty-projects">
                      <span className="empty-icon">
                        <Folder size={25} strokeWidth={1.2} />
                      </span>
                      <h3>Um espaço para suas próximas ideias.</h3>
                      <p>Os projetos que você criar aparecem aqui.</p>
                      <button
                        className="text-link"
                        disabled={!!busy || recording}
                        onClick={() => {
                          setDenoiseMode('general');
                          void upload(makeDemo());
                        }}
                      >
                        Experimentar com um áudio de teste <ArrowRight size={14} />
                      </button>
                      <small>Sinal musical sintetizado, com ruído adicionado.</small>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
          {view === 'ai' && <ClaudeSettings />}
          {view === 'projects' && (
            <>
              <div className="studio-welcome">
                <div>
                  <span className="eyebrow">CADA IDEIA TEM SEU LUGAR</span>
                  <h1>
                    Meus <span className="text-gradient">projetos.</span>
                  </h1>
                  <p>
                    {projects.length} {projects.length === 1 ? 'projeto salvo' : 'projetos salvos'}{' '}
                    neste navegador.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => fileInput.current?.click()}
                  disabled={!!busy || recording}
                >
                  <Plus size={16} /> Novo projeto
                </button>
              </div>
              <label className="search-input">
                <Search size={18} />
                <input
                  placeholder="Buscar um projeto…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar projetos"
                />
              </label>
              <section className="project-list">
                {filtered.length ? (
                  filtered.map(renderProject)
                ) : (
                  <div className="empty-projects">
                    <Folder size={30} />
                    <h3>
                      {search
                        ? 'Nenhum projeto encontrado.'
                        : 'Seu próximo projeto começa com um arquivo.'}
                    </h3>
                    <p>
                      {search
                        ? 'Tente buscar por outro nome.'
                        : 'Importe um áudio para criar seu primeiro projeto.'}
                    </p>
                  </div>
                )}
              </section>
              <p className="storage-note">
                <ShieldCheck size={14} /> Os arquivos ficam neste dispositivo. Exporte seus áudios
                antes de limpar os dados do navegador.
              </p>
            </>
          )}
          {view === 'editor' && project && version && (
            <>
              <div className="editor-heading">
                <div>
                  <button
                    className="text-link"
                    onClick={() => navigate('projects')}
                    disabled={!!busy}
                  >
                    <ArrowLeft size={14} /> Meus projetos
                  </button>
                  <div className="editor-title-line">
                    <h1>{routeTool ? selectedTool.label : project.name}</h1>
                    <button
                      className="icon-button"
                      onClick={() => {
                        setNewName(project.name);
                        setRenaming(true);
                      }}
                      aria-label="Renomear projeto"
                      disabled={!!busy}
                    >
                      <PenLine size={16} />
                    </button>
                  </div>
                  <p>
                    <strong>{project.name}</strong> <span>·</span>
                    {formatTime(version.info.duration)} <span>·</span>{' '}
                    {version.info.channels === 1 ? 'Mono' : 'Estéreo'} <span>·</span>{' '}
                    {version.info.sampleRate / 1000} kHz <span>·</span> WAV 16-bit{' '}
                    <span className="saved">
                      <Check size={12} /> Salvo neste navegador
                    </span>
                  </p>
                </div>
                <button
                  className="button primary"
                  disabled={!!busy}
                  onClick={() => exportAudio('wav')}
                >
                  <Download size={16} /> Baixar WAV
                </button>
              </div>
              <div className="effect-toolbar" role="group" aria-label="Histórico de tratamentos">
                <button
                  className="button secondary small"
                  disabled={!!busy || previousIndex(project, versionIndex) < 0}
                  onClick={() => void selectVersion(previousIndex(project, versionIndex), 'undo')}
                >
                  <Undo2 size={15} /> Desfazer efeito
                </button>
                <button
                  className="button secondary small"
                  disabled={!!busy || nextIndex(project, versionIndex) < 0}
                  onClick={() => void selectVersion(nextIndex(project, versionIndex), 'redo')}
                >
                  Refazer efeito <ArrowRight size={15} />
                </button>
                <button
                  className="text-link"
                  disabled={!!busy || versionIndex === 0}
                  onClick={() => void selectVersion(0)}
                >
                  Restaurar original
                </button>
                <span>{versionIndex === 0 ? 'Original ativo' : version.label}</span>
              </div>
              <div className="editor-layout">
                <div className="editor-main">
                  <WavePlayer
                    key={project.id}
                    original={project.versions[0]}
                    version={version}
                    region={region}
                    onRegion={setRegion}
                  />
                  <section className="analysis-panel">
                    <div className="subheading">
                      <h2>Seu som, em detalhes.</h2>
                      <button className="text-link" onClick={report}>
                        Relatório <Download size={13} />
                      </button>
                    </div>
                    <div className="metrics-grid">
                      <div>
                        <span>
                          Volume percebido <Info size={12} />
                        </span>
                        <strong>
                          {metric(version.metrics.lufs)}
                          <small>LUFS</small>
                        </strong>
                        <p>Volume integrado do arquivo.</p>
                      </div>
                      <div>
                        <span>
                          Pico real <Info size={12} />
                        </span>
                        <strong>
                          {metric(version.metrics.truePeak)}
                          <small>dBTP</small>
                        </strong>
                        <p>Inclui picos entre amostras.</p>
                      </div>
                      <div>
                        <span>Faixa de loudness</span>
                        <strong>
                          {metric(version.metrics.lra)}
                          <small>LU</small>
                        </strong>
                        <p>Variação do volume percebido.</p>
                      </div>
                    </div>
                    <div className={`analysis-verdict ${version.info.clipped ? 'warning' : ''}`}>
                      <ShieldCheck size={17} />
                      <p>
                        {version.info.clipped
                          ? `${version.info.clipped} amostras próximas ao limite digital. Revise os picos antes de entregar.`
                          : version.metrics.lufs === null
                            ? 'Áudio silencioso ou insuficiente para medir loudness.'
                            : 'Nenhuma amostra saturada detectada no WAV. Confira também o true peak e a especificação de entrega.'}
                      </p>
                    </div>
                    {operation === 'master' &&
                      version.operation === 'master' &&
                      version.processing?.masterPreset !== 'broadcast' && (
                        <div className="delivery-result">
                          <span className="eyebrow">COMPARAÇÃO COM O ALVO ATUAL</span>
                          <p>
                            {version.metrics.lufs !== null &&
                            version.metrics.truePeak !== null &&
                            Math.abs(version.metrics.lufs - target) <= 1 &&
                            version.metrics.truePeak <= peak + 0.2
                              ? 'Dentro da referência selecionada (±1 LU / +0,2 dBTP).'
                              : 'Atenção: o resultado precisa ser revisto em relação ao alvo selecionado.'}
                          </p>
                          <small>
                            Alvo: {target} LUFS · teto {peak} dBTP. Confira as exigências do
                            destinatário.
                          </small>
                        </div>
                      )}
                  </section>
                  <section className="history-panel">
                    <div className="subheading">
                      <h2>O caminho do seu som.</h2>
                      <span>
                        {project.versions.length}{' '}
                        {project.versions.length === 1 ? 'VERSÃO' : 'VERSÕES'}
                      </span>
                    </div>
                    {project.versions.map((v, i) => (
                      <button
                        className={`version-row ${i === versionIndex ? 'active' : ''}`}
                        key={v.id}
                        disabled={!!busy}
                        onClick={() => void selectVersion(i)}
                      >
                        <span className="version-marker">
                          {i === 0 ? <ShieldCheck size={15} /> : <AudioLines size={15} />}
                        </span>
                        <span>
                          <strong>{v.label}</strong>
                          <small>
                            {i === 0
                              ? 'Original preservado'
                              : (v.preset ?? 'Tratamento não destrutivo')}{' '}
                            ·{' '}
                            {new Date(v.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </small>
                        </span>
                        <span>{metric(v.metrics.lufs, ' LUFS')}</span>
                        {i === versionIndex ? <Check size={15} /> : <Undo2 size={14} />}
                      </button>
                    ))}
                  </section>
                  <div className="export-strip">
                    <FileAudio size={19} />
                    <div>
                      <strong>Pronto para seguir com seu som?</strong>
                      <span>WAV 16-bit ou MP3 192 kbps · 48 kHz</span>
                    </div>
                    <button
                      className="button secondary small"
                      onClick={() => download(project.originalFile, project.originalName)}
                      disabled={!!busy}
                    >
                      Original
                    </button>
                    <button
                      className="button secondary small"
                      onClick={() => exportAudio('mp3')}
                      disabled={!!busy}
                    >
                      <Download size={14} /> MP3
                    </button>
                    <button
                      className="button primary small"
                      onClick={() => exportAudio('wav')}
                      disabled={!!busy}
                    >
                      <Download size={14} /> WAV
                    </button>
                  </div>
                </div>
                <aside className="treatment-panel">
                  <div className="panel-heading">
                    <Sparkles size={18} />
                    <h2>{selectedTool.label}</h2>
                  </div>
                  <p className="panel-subtitle">{selectedTool.description}</p>
                  <div className="treatment-controls">
                    {operation === 'eq' && (
                      <EqualizerControls
                        gains={eqGains}
                        highpass={eqHighpass}
                        preset={eqPreset}
                        onPreset={selectEq}
                        onGains={(g) => {
                          setEqGains(g);
                          setEqPreset('custom');
                        }}
                        onHighpass={setEqHighpass}
                        disabled={!!busy}
                      />
                    )}
                    {operation === 'clarity' && (
                      <div
                        className="preset-grid voice-presets"
                        role="group"
                        aria-label="Presets de voz"
                      >
                        {voicePresets.map((p) => (
                          <button
                            key={p.id}
                            className={voicePreset === p.id ? 'active' : ''}
                            aria-pressed={voicePreset === p.id}
                            disabled={!!busy}
                            onClick={() => selectVoice(p.id)}
                          >
                            <strong>{p.label}</strong>
                            <span>{p.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {operation === 'master' && (
                      <>
                        <div
                          className="preset-grid master-presets"
                          role="group"
                          aria-label="Presets de masterização"
                        >
                          <button
                            className={masterRecipe === 'broadcast' ? 'active' : ''}
                            aria-pressed={masterRecipe === 'broadcast'}
                            disabled={!!busy}
                            onClick={() => selectMaster('broadcast')}
                          >
                            <strong>Transmissão + Limite −3 dB</strong>
                            <span>
                              Sua cadeia do Premiere, com quatro bandas e dois limitadores.
                            </span>
                          </button>
                          {deliveryPresets.map((p) => (
                            <button
                              key={p.id}
                              disabled={!!busy}
                              className={masterRecipe === p.id ? 'active' : ''}
                              aria-pressed={masterRecipe === p.id}
                              onClick={() => selectMaster(p.id)}
                            >
                              <strong>{p.label}</strong>
                              <span>
                                {p.lufs} LUFS · {p.peak} dBTP
                              </span>
                            </button>
                          ))}
                        </div>
                        {masterRecipe === 'broadcast' && (
                          <BroadcastControls
                            settings={broadcast}
                            onChange={setBroadcast}
                            disabled={!!busy}
                          />
                        )}
                      </>
                    )}

                    {(operation === 'denoise' || operation === 'clarity') && (
                      <>
                        <span className="field-label">MODO DE LIMPEZA</span>
                        <div
                          className="audio-mode-options"
                          role="group"
                          aria-label="Modo de limpeza"
                        >
                          <button
                            aria-pressed={denoiseMode === 'studio'}
                            className={denoiseMode === 'studio' ? 'active' : ''}
                            disabled={!!busy}
                            onClick={() => setDenoiseMode('studio')}
                          >
                            <Sparkles size={18} />
                            <strong>NOSSOM Voice</strong>
                            <span>DeepFilterNet3 · qualidade</span>
                          </button>
                          <button
                            aria-pressed={denoiseMode === 'voice'}
                            className={denoiseMode === 'voice' ? 'active' : ''}
                            disabled={!!busy}
                            onClick={() => setDenoiseMode('voice')}
                          >
                            <Mic size={18} />
                            <strong>Voz · IA local</strong>
                            <span>Modelo neural para fala</span>
                          </button>
                          <button
                            aria-pressed={denoiseMode === 'general'}
                            className={denoiseMode === 'general' ? 'active' : ''}
                            disabled={!!busy}
                            onClick={() => setDenoiseMode('general')}
                          >
                            <AudioLines size={18} />
                            <strong>Áudio geral</strong>
                            <span>Redução espectral</span>
                          </button>
                        </div>
                        <p className="field-hint">
                          {denoiseMode === 'studio'
                            ? 'Restauração neural em banda completa, a 48 kHz. Modelo DeepFilterNet3 executado localmente. O primeiro uso baixa cerca de 33 MB.'
                            : denoiseMode === 'voice'
                              ? 'O modelo RNNoise distingue fala de ruído. Para música e instrumentos, use Áudio geral.'
                              : 'Atenua ruído contínuo preservando conteúdo musical. Ajuste o piso para o seu ambiente.'}
                        </p>
                      </>
                    )}
                    {denoiseMode === 'studio' &&
                      (operation === 'denoise' || operation === 'clarity') && (
                        <RangeControl
                          label="Supressão neural máxima"
                          value={neuralAttenuation}
                          min={0}
                          max={80}
                          unit=" dB"
                          disabled={!!busy}
                          onChange={setNeuralAttenuation}
                        />
                      )}
                    <RangeControl
                      label={
                        operation === 'master'
                          ? masterRecipe === 'broadcast'
                            ? 'Mistura do preset'
                            : 'Controle de dinâmica'
                          : operation === 'mix'
                            ? 'Redução da trilha durante a fala'
                            : 'Intensidade do tratamento'
                      }
                      value={intensity}
                      min={0}
                      max={100}
                      unit="%"
                      disabled={!!busy}
                      onChange={setIntensity}
                    />
                    <div
                      className="intensity-selector"
                      role="group"
                      aria-label="Atalhos de intensidade"
                    >
                      {[
                        [30, 'Suave'],
                        [65, 'Equilibrado'],
                        [100, 'Máximo'],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          disabled={!!busy}
                          className={intensity === value ? 'active' : ''}
                          onClick={() => setIntensity(Number(value))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="field-hint">
                      {operation === 'master'
                        ? masterRecipe === 'broadcast'
                          ? 'Mistura o sinal original com a cadeia de transmissão. Em 100%, utiliza somente o resultado tratado.'
                          : 'Controla a faixa dinâmica pedida ao normalizador. Confira o resultado nas medições abaixo.'
                        : operation === 'mix'
                          ? 'Quanto maior, mais a trilha recua enquanto há sinal na voz.'
                          : intensity === 0
                            ? 'Sem tratamento adicional.'
                            : intensity > 85
                              ? 'Tratamento intenso. Compare com o original para conferir se os detalhes continuam naturais.'
                              : 'Ajuste livremente, aplique e compare o resultado com o original.'}
                    </p>
                    {['denoise', 'clarity', 'wind'].includes(operation) &&
                      (denoiseMode === 'general' || operation === 'wind') && (
                        <>
                          <RangeControl
                            label="Redução máxima de ruído"
                            value={noiseReduction}
                            min={0}
                            max={48}
                            unit=" dB"
                            disabled={!!busy}
                            onChange={setNoiseReduction}
                          />
                          <RangeControl
                            label="Piso de ruído"
                            value={noiseFloor ?? version.info.noiseFloor ?? -50}
                            min={-80}
                            max={-20}
                            unit=" dB"
                            disabled={!!busy}
                            onChange={setNoiseFloor}
                          />
                          <button
                            className="text-link analyze-noise"
                            disabled={!!busy}
                            onClick={() =>
                              void run(async () => {
                                setBusy('Analisando os trechos mais silenciosos…');
                                const buffer = await decode(version.blob);
                                const profile = estimateNoiseFloor(
                                  buffer.getChannelData(0),
                                  buffer.sampleRate,
                                );
                                setNoiseFloor(profile.floorDb);
                                setAnalysisNote(
                                  profile.confidence === 'estimated'
                                    ? `Piso estimado: ${profile.floorDb} dB. Ajuste pela escuta antes de aplicar.`
                                    : 'Não encontrei uma pausa clara para estimar o ruído. Mantive −50 dB como ponto de partida.',
                                );
                              })
                            }
                          >
                            <Activity size={14} /> Estimar pelo áudio
                          </button>
                          {analysisNote && (
                            <p className="field-hint" role="status">
                              {analysisNote}
                            </p>
                          )}
                        </>
                      )}
                    {operation === 'clarity' && (
                      <>
                        <RangeControl
                          label="Controle de sibilância"
                          value={deess}
                          min={0}
                          max={100}
                          unit="%"
                          disabled={!!busy}
                          onChange={setDeess}
                        />
                        <label className="field-label" htmlFor="hum-mode">
                          HUM DE REDE
                        </label>
                        <select
                          id="hum-mode"
                          value={hum}
                          disabled={!!busy}
                          onChange={(e) => setHum(Number(e.target.value))}
                        >
                          <option value={0}>Desligado</option>
                          <option value={50}>50 Hz + harmônicos</option>
                          <option value={60}>60 Hz + harmônicos</option>
                        </select>
                      </>
                    )}
                    {operation === 'clarity' && (
                      <RangeControl
                        label="Presença da voz"
                        value={presence}
                        min={0}
                        max={9}
                        step={0.5}
                        unit=" dB"
                        disabled={!!busy}
                        onChange={setPresence}
                      />
                    )}
                    {(operation === 'clarity' || operation === 'level') && (
                      <RangeControl
                        label="Compressão"
                        value={compression}
                        min={1}
                        max={8}
                        step={0.5}
                        unit=":1"
                        disabled={!!busy}
                        onChange={setCompression}
                      />
                    )}
                    {operation === 'wind' && (
                      <RangeControl
                        label="Corte de graves"
                        value={highpass}
                        min={30}
                        max={300}
                        step={5}
                        unit=" Hz"
                        disabled={!!busy}
                        onChange={setHighpass}
                      />
                    )}
                  </div>
                  {operation === 'master' && masterRecipe !== 'broadcast' && (
                    <>
                      <label className="field-label" htmlFor="destination">
                        ONDE ESSE SOM VAI CHEGAR?
                      </label>
                      <select
                        id="destination"
                        value={preset}
                        disabled={!!busy}
                        onChange={(e) => {
                          setMasterRecipe(e.target.value);
                          const p = deliveryPresets.find((p) => p.id === e.target.value)!;
                          setPreset(p.id);
                          setTarget(p.lufs);
                          setPeak(p.peak);
                        }}
                      >
                        {deliveryPresets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <p className="field-hint">
                        {deliveryPresets.find((p) => p.id === preset)?.note}
                      </p>
                      <RangeControl
                        label="Volume final"
                        value={target}
                        min={-30}
                        max={-10}
                        step={0.5}
                        unit=" LUFS"
                        disabled={!!busy}
                        onChange={setTarget}
                      />
                      <RangeControl
                        label="Teto de pico"
                        value={peak}
                        min={-6}
                        max={-1}
                        step={0.1}
                        unit=" dBTP"
                        disabled={!!busy}
                        onChange={setPeak}
                      />
                      <div className="target-preview">
                        <span>
                          Atual
                          <strong>
                            {metric(version.metrics.lufs)} <small>LUFS</small>
                          </strong>
                        </span>
                        <ArrowRight size={16} />
                        <span>
                          Alvo
                          <strong>
                            {target} <small>LUFS</small>
                          </strong>
                        </span>
                      </div>
                    </>
                  )}
                  {operation === 'mix' && (
                    <>
                      <label className="field-label">SUA TRILHA</label>
                      <button
                        className="music-upload"
                        onClick={() => musicInput.current?.click()}
                        disabled={!!busy}
                      >
                        <Plus size={19} />
                        <span>{music?.name ?? 'Adicionar faixa de música'}</span>
                      </button>
                      <label className="field-label" htmlFor="music-volume">
                        NÍVEL DA TRILHA · {Math.round(musicGain * 100)}%
                      </label>
                      <input
                        id="music-volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={musicGain}
                        onChange={(e) => setMusicGain(Number(e.target.value))}
                        disabled={!!busy}
                      />
                      <p className="field-hint">
                        A trilha se repete até o fim do áudio e abaixa automaticamente quando há
                        sinal na faixa principal.
                      </p>
                    </>
                  )}
                  <PresetLibrary
                    operation={operation}
                    disabled={!!busy}
                    onLoad={loadSavedPreset}
                    current={{
                      operation,
                      intensity,
                      mode: denoiseMode,
                      target,
                      peak,
                      musicGain,
                      settings: {
                        noiseFloor: noiseFloor ?? version.info.noiseFloor,
                        noiseReduction,
                        neuralAttenuation,
                        presence,
                        compression,
                        highpass: operation === 'eq' ? eqHighpass : highpass,
                        eq: operation === 'eq' ? eqGains : undefined,
                        masterPreset: operation === 'master' ? masterRecipe : undefined,
                        broadcast:
                          operation === 'master' && masterRecipe === 'broadcast'
                            ? broadcast
                            : undefined,
                        deess: operation === 'clarity' ? deess : undefined,
                        hum: operation === 'clarity' ? hum : undefined,
                      },
                    }}
                  />
                  <button
                    className="advanced-toggle"
                    onClick={() => setAdvanced(!advanced)}
                    aria-expanded={advanced}
                  >
                    <Settings2 size={14} /> Detalhes avançados <Plus size={13} />
                  </button>
                  {advanced && (
                    <div className="advanced-panel">
                      {operation === 'master' ? (
                        <>
                          <label>
                            Loudness alvo (LUFS)
                            <input
                              type="number"
                              min={-30}
                              max={-10}
                              value={target}
                              disabled={!!busy}
                              onChange={(e) =>
                                setTarget(Math.max(-30, Math.min(-10, Number(e.target.value))))
                              }
                            />
                          </label>
                          <label>
                            Teto de true peak (dBTP)
                            <input
                              type="number"
                              min={-6}
                              max={-1}
                              step={0.1}
                              value={peak}
                              disabled={!!busy}
                              onChange={(e) =>
                                setPeak(Math.max(-6, Math.min(-1, Number(e.target.value))))
                              }
                            />
                          </label>
                          <p>
                            Normalização EBU R128 por FFmpeg loudnorm, com medição pós-renderização.
                            Perfis de cinema e ATSC exigem especificações próprias.
                          </p>
                        </>
                      ) : (
                        <p>
                          {operation === 'denoise'
                            ? 'RNNoise neural para fala ou afftdn espectral adaptativo. Intensidade contínua, alinhamento temporal preservado e processamento local.'
                            : operation === 'clarity'
                              ? 'Limpeza neural ou espectral, corte em 70 Hz, redução de graves médios, presença em 3 kHz, compressor e limitador.'
                              : operation === 'wind'
                                ? 'Corte de graves ajustável de 30 a 300 Hz com redução espectral de ruído.'
                                : operation === 'level'
                                  ? 'Compressor: threshold 0,12; ratio 2 / 3 / 4; ataque 10 ms; release 220 ms. Limiter de pico amostral em −1 dBFS.'
                                  : 'Sidechain compressor: threshold 0,02; ratio 6:1; ataque 20 ms; release 500 ms. Não usa detecção semântica de fala.'}
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    className="button primary process-button"
                    onClick={applyTreatment}
                    disabled={!!busy}
                  >
                    {busy ? <LoaderCircle size={17} className="spin" /> : <Sparkles size={17} />}{' '}
                    {busy ? 'Processando…' : 'Aplicar tratamento'}{' '}
                    {!busy && <ArrowRight size={15} />}
                  </button>
                  <span className="treatment-footnote">
                    <ShieldCheck size={12} /> Uma nova versão. Seu original intacto.
                  </span>
                  <div className="panel-help">
                    <AudioLines size={21} />
                    <h3>Não sabe por onde começar?</h3>
                    <p>Descreva a sua ideia e encontre um tratamento.</p>
                    <button className="text-link" onClick={() => setAssistant(true)}>
                      Conversar com o assistente <ArrowUpRight size={13} />
                    </button>
                  </div>
                </aside>
              </div>
            </>
          )}
        </main>
        <footer className="studio-footer">
          <span>
            NOSSOM <span>·</span> Tudo acontece no som.
          </span>
          <span>
            <ShieldCheck size={12} /> Processado no seu dispositivo
          </span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </div>
      )}
      <nav className="studio-tabs" aria-label="Navegação rápida">
        <button className={view === 'home' ? 'active' : ''} onClick={() => navigate('home')}>
          <House size={19} />
          <span>Início</span>
        </button>
        <button
          className="tab-create"
          onClick={() => fileInput.current?.click()}
          disabled={!!busy || recording}
          aria-label="Importar novo áudio"
        >
          <Plus size={23} />
        </button>
        <button
          className={view === 'projects' ? 'active' : ''}
          onClick={() => navigate('projects')}
        >
          <Folder size={19} />
          <span>Projetos</span>
        </button>
      </nav>
      {assistant && (
        <Assistant
          onClose={() => setAssistant(false)}
          onPlan={(next, amount, eq) => {
            if (typeof amount === 'number') setIntensity(amount);
            if (eq) selectEq(eq);
            chooseTool(next);
          }}
          context={
            version
              ? {
                  ...version.metrics,
                  duration: version.info.duration,
                  channels: version.info.channels,
                }
              : undefined
          }
        />
      )}{' '}
      {deleteId && (
        <div className="modal-backdrop">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <Trash2 size={27} />
            <h2 id="delete-title">Excluir este projeto?</h2>
            <p>
              O áudio e todas as versões serão removidos deste navegador. Exporte os arquivos que
              deseja guardar antes de continuar.
            </p>
            <div>
              <button className="button secondary" onClick={() => setDeleteId(null)}>
                Manter projeto
              </button>
              <button className="button danger" onClick={remove}>
                Excluir projeto
              </button>
            </div>
          </section>
        </div>
      )}
      {renaming && (
        <div className="modal-backdrop">
          <form
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-title"
            onSubmit={(e) => {
              e.preventDefault();
              void rename();
            }}
          >
            <h2 id="rename-title">Um nome para essa ideia.</h2>
            <input
              aria-label="Nome do projeto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
            <div>
              <button type="button" className="button secondary" onClick={() => setRenaming(false)}>
                Cancelar
              </button>
              <button className="button primary" type="submit">
                Salvar nome
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
