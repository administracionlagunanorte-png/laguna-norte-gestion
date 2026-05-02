'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Leaf, Brush, Trash2, Wrench, Clock, CheckCircle2,
  MapPin, ChevronRight, X, Plus, ClipboardList,
  Download, ChevronDown, Search, User, Tag, Camera, Image as ImageIcon,
  RefreshCw, Settings, Pencil, Droplets, Flame, Shield, LogOut, Eye,
  BarChart3, Timer, TrendingUp, CalendarDays, Activity, FileSpreadsheet, FileText, Filter
} from 'lucide-react';

/* ─── Data Structures ─── */

interface WorkArea {
  id: string;
  name: string;
  activities: string[];
  color: string;
}

interface Personnel {
  id: string;
  name: string;
  workAreaId: string;
}

interface Zone {
  id: string;
  name: string;
}

/* ─── Default Data ─── */

const DEFAULT_WORK_AREAS: WorkArea[] = [
  { id: 'jardineria', name: 'Jardinería', activities: ['Corte De Pasto', 'Desmalezado', 'Poda de Arbustos', 'Riego'], color: 'bg-green-600' },
  { id: 'aseo', name: 'Aseo', activities: ['Limpieza de Quinchos', 'Limpieza Áreas Comunes', 'Barrido De Calles'], color: 'bg-pink-500' },
  { id: 'recoleccion', name: 'Recolección', activities: ['Recolección De Basura', 'Barrido De Calles'], color: 'bg-orange-500' },
  { id: 'piscinas', name: 'Piscinas y Laguna', activities: ['Limpieza De Piscina', 'Llenado De Piscina', 'Mantención Laguna', 'Tratamiento de Agua'], color: 'bg-cyan-500' },
  { id: 'mantenciones', name: 'Mantenciones', activities: ['Reparación Estructural', 'Pintura', 'Mantención General', 'Carpintería'], color: 'bg-purple-500' },
  { id: 'electricas', name: 'Eléctricas y Mantenciones', activities: ['Reparación Eléctrica', 'Mantención Eléctrica', 'Iluminación'], color: 'bg-yellow-500' },
];

const DEFAULT_PERSONNEL: Personnel[] = [
  { id: 'p1', name: 'Cesar Edmundo Adasme Aravena', workAreaId: 'jardineria' },
  { id: 'p2', name: 'Luis Alejandro Torres Bustos', workAreaId: 'jardineria' },
  { id: 'p3', name: 'Chris Esther Godoy Espinoza', workAreaId: 'aseo' },
  { id: 'p5', name: 'Marie Ginette Dorne', workAreaId: 'aseo' },
  { id: 'p4', name: 'Erik Alberto Arteaga Burgos', workAreaId: 'recoleccion' },
  { id: 'p6', name: 'Jeantelus Fleurissaint', workAreaId: 'recoleccion' },
  { id: 'p7', name: 'Paulo César Toro Pino', workAreaId: 'piscinas' },
  { id: 'p8', name: 'Macario Enrique Manríquez Trigo', workAreaId: 'piscinas' },
  { id: 'p9', name: 'Carlos Alberto Zamorano Torres', workAreaId: 'mantenciones' },
  { id: 'p10', name: 'Jose Luis Venegas Poblete', workAreaId: 'mantenciones' },
  { id: 'p11', name: 'Francisco Marcial Fuentes Carrasco', workAreaId: 'electricas' },
];

const DEFAULT_ZONES: Zone[] = [
  { id: 'z1', name: 'Club House' },
  { id: 'z2', name: 'Piscina 1' },
  { id: 'z3', name: 'Piscina 2' },
  { id: 'z4', name: 'Piscina 3' },
  { id: 'z5', name: 'Mirador' },
  { id: 'z6', name: 'Muelle' },
  { id: 'z7', name: 'Juegos Muelle' },
  { id: 'z8', name: 'Quinchos' },
  { id: 'z9', name: 'Multicancha' },
  { id: 'z10', name: 'Cancha Sintética' },
  { id: 'z11', name: 'Avenida Principal' },
  { id: 'z12', name: 'Canquén' },
  { id: 'z13', name: 'Albatros' },
  { id: 'z14', name: 'Bandurrias' },
  { id: 'z15', name: 'Becacinas' },
  { id: 'z16', name: 'Flamencos' },
  { id: 'z17', name: 'Faisanes' },
  { id: 'z18', name: 'Garzas' },
  { id: 'z19', name: 'Gaviotas' },
  { id: 'z20', name: 'Otro' },
];

/* ─── Other constants ─── */

/* Icon lookup map — stores icon components by string name to avoid React rendering issues */
const ICON_MAP: Record<string, React.ElementType> = {
  Leaf,
  Brush,
  Trash2,
  Droplets,
  Wrench,
  Zap,
};

const CATEGORIES = [
  { id: 'jardineria', name: 'Jardinería', icon: 'Leaf', color: 'bg-green-600', workAreaId: 'jardineria' },
  { id: 'aseo', name: 'Aseo', icon: 'Brush', color: 'bg-pink-500', workAreaId: 'aseo' },
  { id: 'recoleccion', name: 'Recolección', icon: 'Trash2', color: 'bg-orange-500', workAreaId: 'recoleccion' },
  { id: 'piscinas', name: 'Piscinas y Laguna', icon: 'Droplets', color: 'bg-cyan-500', workAreaId: 'piscinas' },
  { id: 'mantenciones', name: 'Mantenciones', icon: 'Wrench', color: 'bg-purple-500', workAreaId: 'mantenciones' },
  { id: 'electricas', name: 'Eléctricas', icon: 'Zap', color: 'bg-yellow-500', workAreaId: 'electricas' },
];

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  'Pendiente': { color: 'bg-red-500', text: 'text-red-500' },
  'En Proceso': { color: 'bg-amber-500', text: 'text-amber-600' },
  'Terminada': { color: 'bg-emerald-500', text: 'text-emerald-600' },
};

/* ─── Types ─── */

interface WorkOrder {
  id: string;
  otId: string;
  activities: string[];
  collaborators: string[];
  zoneName: string;
  description: string;
  status: string;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  photosBefore: string[];
  photosAfter: string[];
}

/* ─── Migration helper (backward compat) ─── */

function migrateWorkOrder(ot: any): WorkOrder {
  let collaborators: string[];
  if (Array.isArray(ot.collaborators)) {
    collaborators = ot.collaborators;
  } else if (typeof ot.collaborators === 'string' && ot.collaborators.trim()) {
    collaborators = [ot.collaborators];
  } else {
    collaborators = [];
  }
  let activities: string[];
  if (Array.isArray(ot.activities)) {
    activities = ot.activities;
  } else if (typeof ot.activities === 'string' && ot.activities.trim()) {
    activities = [ot.activities];
  } else {
    activities = [];
  }
  return {
    ...ot,
    collaborators,
    activities,
    photosBefore: Array.isArray(ot.photosBefore) ? ot.photosBefore : [],
    photosAfter: Array.isArray(ot.photosAfter) ? ot.photosAfter : [],
    startedAt: ot.startedAt ?? null,
    completedAt: ot.completedAt ?? null,
  };
}

/* ─── LocalStorage helpers ─── */

const STORAGE_KEY = 'laguna_norte_ots';
const COUNTER_KEY = 'laguna_norte_ot_counter';
const WORK_AREAS_KEY = 'laguna_norte_work_areas';
const PERSONNEL_KEY = 'laguna_norte_personnel';
const ZONES_KEY = 'laguna_norte_zones';
const CONFIG_VERSION_KEY = 'laguna_norte_config_version';
const CONFIG_VERSION = 2; // Increment when default data changes to force reload
const USER_ROLE_KEY = 'laguna_norte_user_role';
const ADMIN_PWD_KEY = 'laguna_norte_admin_pwd';
const DEFAULT_ADMIN_PWD = 'admin2024';

type UserRole = 'admin' | 'usuario';

function getAdminPwd(): string {
  try { return localStorage.getItem(ADMIN_PWD_KEY) || DEFAULT_ADMIN_PWD; } catch { return DEFAULT_ADMIN_PWD; }
}

function checkAdminPwd(pwd: string): boolean {
  return pwd === getAdminPwd();
}

function readFromLocalStorage(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(migrateWorkOrder) : [];
  } catch {
    return [];
  }
}

function writeToLocalStorage(orders: WorkOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error al guardar en localStorage:', e);
  }
}

function readCounterFromLocalStorage(): number {
  try {
    const stored = localStorage.getItem(COUNTER_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function writeCounterToLocalStorage(counter: number) {
  try {
    localStorage.setItem(COUNTER_KEY, counter.toString());
  } catch { /* ignore */ }
}

/* ─── Config Data localStorage helpers ─── */

function loadWorkAreas(): WorkArea[] {
  try {
    const needsReload = localStorage.getItem(CONFIG_VERSION_KEY) !== String(CONFIG_VERSION);
    if (needsReload) {
      localStorage.setItem(WORK_AREAS_KEY, JSON.stringify(DEFAULT_WORK_AREAS));
      localStorage.setItem(CONFIG_VERSION_KEY, String(CONFIG_VERSION));
      return DEFAULT_WORK_AREAS;
    }
    const raw = localStorage.getItem(WORK_AREAS_KEY);
    if (!raw) {
      localStorage.setItem(WORK_AREAS_KEY, JSON.stringify(DEFAULT_WORK_AREAS));
      return DEFAULT_WORK_AREAS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WORK_AREAS;
  } catch {
    return DEFAULT_WORK_AREAS;
  }
}

function saveWorkAreas(areas: WorkArea[]) {
  try {
    localStorage.setItem(WORK_AREAS_KEY, JSON.stringify(areas));
  } catch { /* ignore */ }
}

function loadPersonnel(): Personnel[] {
  try {
    const needsReload = localStorage.getItem(CONFIG_VERSION_KEY) !== String(CONFIG_VERSION);
    if (needsReload) {
      localStorage.setItem(PERSONNEL_KEY, JSON.stringify(DEFAULT_PERSONNEL));
      return DEFAULT_PERSONNEL;
    }
    const raw = localStorage.getItem(PERSONNEL_KEY);
    if (!raw) {
      localStorage.setItem(PERSONNEL_KEY, JSON.stringify(DEFAULT_PERSONNEL));
      return DEFAULT_PERSONNEL;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PERSONNEL;
  } catch {
    return DEFAULT_PERSONNEL;
  }
}

function savePersonnel(personnel: Personnel[]) {
  try {
    localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnel));
  } catch { /* ignore */ }
}

function loadZones(): Zone[] {
  try {
    const raw = localStorage.getItem(ZONES_KEY);
    if (!raw) {
      localStorage.setItem(ZONES_KEY, JSON.stringify(DEFAULT_ZONES));
      return DEFAULT_ZONES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ZONES;
  } catch {
    return DEFAULT_ZONES;
  }
}

function saveZones(zones: Zone[]) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
  } catch { /* ignore */ }
}

/* ─── Custom Hook: useWorkOrders (Hybrid: localStorage + API sync with immediate push) ─── */

function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const mountedRef = useRef(false);

  // Fetch from API; fallback to localStorage
  const fetchWorkOrders = useCallback(async (showSyncIndicator = false) => {
    try {
      if (showSyncIndicator) setSyncing(true);
      const res = await fetch('/api/workorders');
      if (!res.ok) throw new Error('API not available');
      const data = await res.json();
      const migrated = Array.isArray(data) ? data.map(migrateWorkOrder) : [];
      setWorkOrders(migrated);
      writeToLocalStorage(migrated);
      setApiAvailable(true);
      setLastSync(Date.now());
    } catch {
      setApiAvailable(false);
      const local = readFromLocalStorage();
      setWorkOrders(local);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  // Initial load + polling every 5 seconds for cross-device sync
  useEffect(() => {
    mountedRef.current = true;

    // First load from localStorage for instant display
    const local = readFromLocalStorage();
    if (local.length > 0) {
      setWorkOrders(local);
      setLoading(false);
    }

    // Then fetch from API (authoritative source)
    fetchWorkOrders(true);

    // Poll every 5 seconds for near-real-time cross-device sync
    const interval = setInterval(() => {
      fetchWorkOrders(false);
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const createWorkOrder = useCallback(async (data: Partial<WorkOrder>): Promise<WorkOrder | null> => {
    let counter = readCounterFromLocalStorage();
    counter++;
    writeCounterToLocalStorage(counter);
    const otId = `OT-${String(counter).padStart(4, '0')}`;

    const status = data.status ?? 'Pendiente';
    const now = Date.now();
    const newOT: WorkOrder = {
      id: generateUniqueId(),
      otId,
      activities: data.activities ?? [],
      collaborators: data.collaborators ?? [],
      zoneName: data.zoneName ?? '',
      description: data.description ?? '',
      status,
      createdAt: now,
      startedAt: (status === 'En Proceso' || status === 'Terminada') ? (data.startedAt ?? now) : null,
      completedAt: status === 'Terminada' ? (data.completedAt ?? now) : null,
      photosBefore: data.photosBefore ?? [],
      photosAfter: data.photosAfter ?? [],
    };

    // Save to state + localStorage immediately (always works offline)
    setWorkOrders(prev => {
      const updated = [newOT, ...prev];
      writeToLocalStorage(updated);
      return updated;
    });

    // Push to API immediately — this is what syncs across devices
    try {
      const res = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOT),
      });
      if (res.ok) {
        setApiAvailable(true);
        setLastSync(Date.now());
        // Re-fetch to confirm server state and get any other device's changes
        fetchWorkOrders(false);
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    return newOT;
  }, [fetchWorkOrders]);

  const updateWorkOrder = useCallback(async (data: Partial<WorkOrder>): Promise<WorkOrder | null> => {
    if (!data.id) return null;

    // Update state + localStorage immediately
    setWorkOrders(prev => {
      const updated = prev.map(ot => ot.id === data.id ? { ...ot, ...data } as WorkOrder : ot);
      writeToLocalStorage(updated);
      return updated;
    });

    // Push to API immediately for cross-device sync
    try {
      const res = await fetch(`/api/workorders/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setApiAvailable(true);
        setLastSync(Date.now());
        fetchWorkOrders(false);
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    return { ...data } as WorkOrder;
  }, [fetchWorkOrders]);

  const deleteWorkOrder = useCallback(async (id: string): Promise<boolean> => {
    // Delete from state + localStorage immediately
    setWorkOrders(prev => {
      const updated = prev.filter(ot => ot.id !== id);
      writeToLocalStorage(updated);
      return updated;
    });

    // Push deletion to API immediately for cross-device sync
    try {
      const res = await fetch(`/api/workorders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApiAvailable(true);
        setLastSync(Date.now());
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    return true;
  }, []);

  return {
    workOrders,
    loading,
    syncing,
    apiAvailable,
    lastSync,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
  };
}

/* ─── Custom Hook: useConfigData ─── */

function useConfigData() {
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(() => loadWorkAreas());
  const [personnel, setPersonnel] = useState<Personnel[]>(() => loadPersonnel());
  const [zones, setZones] = useState<Zone[]>(() => loadZones());

  const updateWorkAreas = useCallback((areas: WorkArea[]) => {
    setWorkAreas(areas);
    saveWorkAreas(areas);
  }, []);

  const updatePersonnel = useCallback((p: Personnel[]) => {
    setPersonnel(p);
    savePersonnel(p);
  }, []);

  const updateZones = useCallback((z: Zone[]) => {
    setZones(z);
    saveZones(z);
  }, []);

  return { workAreas, personnel, zones, updateWorkAreas, updatePersonnel, updateZones };
}

/* ─── Utility functions ─── */

function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatDateTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—';
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('No canvas context'); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Multi-Select Collaborators Component (now takes filtered list) ─── */

function MultiSelectCollaborators({
  selected,
  onToggle,
  availableCollaborators,
  selectedWorkAreaId,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  availableCollaborators: { name: string; workAreaName: string; workAreaId: string }[];
  selectedWorkAreaId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search.trim()
    ? availableCollaborators.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.workAreaName.toLowerCase().includes(search.toLowerCase())
      )
    : availableCollaborators;

  return (
    <div ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <User size={10} /> Responsables
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(name => (
            <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black">
              {name.split(' ').slice(0, 3).join(' ')}
              <button type="button" onClick={() => onToggle(name)} className="hover:text-red-500 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full p-4 mt-2 rounded-2xl bg-slate-50 border-none font-bold text-left flex items-center justify-between gap-2"
      >
        <span className="text-slate-400 text-sm">{selected.length > 0 ? `${selected.length} seleccionado(s)` : 'Seleccionar responsables...'}</span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-56 overflow-hidden">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <Search size={14} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar colaborador..."
                className="bg-transparent text-sm font-medium w-full outline-none placeholder:text-slate-300"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-40 no-scrollbar">
            {filtered.map((c, idx) => {
              // Show a separator label before "other area" personnel
              const showOtherAreaLabel = selectedWorkAreaId && idx > 0 && c.workAreaId !== selectedWorkAreaId && filtered[idx - 1].workAreaId === selectedWorkAreaId;
              return (
                <div key={c.name}>
                  {showOtherAreaLabel && (
                    <div className="px-4 py-1 bg-slate-50 border-t border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Otras áreas</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggle(c.name)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors ${selected.includes(c.name) ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected.includes(c.name) ? 'bg-blue-600 border-blue-600' : c.workAreaId !== selectedWorkAreaId && selectedWorkAreaId ? 'border-slate-200' : 'border-slate-300'}`}>
                        {selected.includes(c.name) && <span className="text-white text-[8px] font-black">✓</span>}
                      </div>
                      <div>
                        <span className={`block truncate ${selected.includes(c.name) ? 'text-blue-600 font-black' : c.workAreaId !== selectedWorkAreaId && selectedWorkAreaId ? 'text-slate-500 font-semibold' : 'text-slate-700 font-semibold'}`}>{c.name}</span>
                        <span className="block text-[9px] font-medium text-slate-400 normal-case truncate">{c.workAreaName}</span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-400 italic">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Custom Dropdown Component (single select) ─── */

function Dropdown({
  label,
  icon: IconComp,
  options,
  selected,
  onSelect,
  placeholder,
  searchable = false,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: string; subtitle?: string; colorDot?: string }[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = searchable && search.trim()
    ? options.filter(o =>
        o.value.toLowerCase().includes(search.toLowerCase()) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  const selectedOption = options.find(o => o.value === selected);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold text-left flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.colorDot && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedOption.colorDot}`} />}
              <span className="flex flex-col truncate">
                <span className="truncate">{selectedOption.value}</span>
                {selectedOption.subtitle && (
                  <span className="text-[9px] font-medium text-slate-400 normal-case truncate">{selectedOption.subtitle}</span>
                )}
              </span>
            </span>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-56 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                <Search size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-transparent text-sm font-medium w-full outline-none placeholder:text-slate-300"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto max-h-40 no-scrollbar">
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onSelect(opt.value); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors ${selected === opt.value ? 'bg-blue-50 text-blue-600 font-black' : 'text-slate-700 font-semibold'}`}
              >
                <span className="flex items-center gap-2">
                  {opt.colorDot && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.colorDot}`} />}
                  <span className="flex flex-col truncate">
                    <span className="truncate">{opt.value}</span>
                    {opt.subtitle && (
                      <span className="text-[9px] font-medium text-slate-400 normal-case truncate">{opt.subtitle}</span>
                    )}
                  </span>
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-400 italic">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Multi-Select Activities Component (now takes filtered list) ─── */

function MultiSelectActivities({
  selected,
  onToggle,
  customActivity,
  onCustomActivityChange,
  onAddCustom,
  availableActivities,
}: {
  selected: string[];
  onToggle: (activity: string) => void;
  customActivity: string;
  onCustomActivityChange: (val: string) => void;
  onAddCustom: () => void;
  availableActivities: string[];
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <Tag size={10} /> Actividades
      </label>
      <div className="flex flex-wrap gap-2 mt-2">
        {availableActivities.map(act => {
          const isSelected = selected.includes(act);
          return (
            <button
              key={act}
              type="button"
              onClick={() => onToggle(act)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
            >
              {act}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={customActivity}
          onChange={e => onCustomActivityChange(e.target.value)}
          placeholder="Otra actividad..."
          className="flex-1 p-3 rounded-xl bg-slate-50 border-none font-bold text-sm placeholder:text-slate-300"
          onKeyDown={e => { if (e.key === 'Enter' && customActivity.trim()) { e.preventDefault(); onAddCustom(); } }}
        />
        <button
          type="button"
          onClick={onAddCustom}
          disabled={!customActivity.trim()}
          className="px-4 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <Plus size={14} />
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {selected.map(act => (
            <span key={act} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">
              {act}
              <button type="button" onClick={() => onToggle(act)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Photo Upload Component ─── */

function PhotoUpload({
  label,
  photos,
  onPhotosChange,
}: {
  label: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newPhotos: string[] = [...photos];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i], 800, 0.6);
        newPhotos.push(compressed);
      } catch (e) {
        console.error('Error processing image:', e);
      }
    }
    onPhotosChange(newPhotos);
    // Reset input value so the same file can be selected again
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <Camera size={10} /> {label}
      </label>
      {/* Camera input — opens camera directly on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {/* Gallery input — opens file picker / gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group">
            <img src={photo} alt={`${label} ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onPhotosChange(photos.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {/* Camera button — opens camera directly */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center gap-1 text-blue-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Camera size={18} />
          <span className="text-[7px] font-black uppercase">Cámara</span>
        </button>
        {/* Gallery button — opens file picker / gallery */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
        >
          <ImageIcon size={18} />
          <span className="text-[7px] font-black uppercase">Galería</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Security Tab Component ─── */

function SecurityTab() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePwd = () => {
    if (!currentPwd || !newPwd || !confirmPwd) { setErrorMsg('Completa todos los campos'); return; }
    if (!checkAdminPwd(currentPwd)) { setErrorMsg('La clave actual es incorrecta'); setCurrentPwd(''); return; }
    if (newPwd.length < 4) { setErrorMsg('La nueva clave debe tener al menos 4 caracteres'); return; }
    if (newPwd !== confirmPwd) { setErrorMsg('Las claves no coinciden'); return; }
    try { localStorage.setItem(ADMIN_PWD_KEY, newPwd); } catch {}
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setErrorMsg(''); setMsg('Clave actualizada correctamente');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={20} className="text-blue-600" />
          <div>
            <p className="font-black text-slate-800 text-sm uppercase">Clave de Administración</p>
            <p className="text-[9px] text-slate-400 font-medium">Esta clave protege el acceso al perfil administrador</p>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Clave actual</label>
          <input type="password" value={currentPwd} onChange={e => { setCurrentPwd(e.target.value); setErrorMsg(''); setMsg(''); }} className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm mt-1" placeholder="Ingresa la clave actual" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nueva clave</label>
          <input type="password" value={newPwd} onChange={e => { setNewPwd(e.target.value); setErrorMsg(''); setMsg(''); }} className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm mt-1" placeholder="Ingresa la nueva clave" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirmar nueva clave</label>
          <input type="password" value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setErrorMsg(''); setMsg(''); }} className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm mt-1" placeholder="Repite la nueva clave" />
        </div>
        {errorMsg && <p className="text-red-500 text-xs font-bold text-center">{errorMsg}</p>}
        {msg && <p className="text-emerald-500 text-xs font-bold text-center">{msg}</p>}
        <button onClick={handleChangePwd} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase active:scale-95 transition-transform">Cambiar Clave</button>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">Información</p>
        <p className="text-[10px] text-amber-700 font-medium">La clave predeterminada es <span className="font-black">admin2024</span>. Cámbiala para mayor seguridad. Si olvidas la clave, puedes restaurarla eliminando los datos del navegador.</p>
      </div>
    </div>
  );
}

/* ─── Admin Panel Component ─── */

type AdminTab = 'areas' | 'personal' | 'zonas' | 'seguridad';

function AdminPanel({
  isOpen,
  onClose,
  workAreas,
  personnel,
  zones,
  onUpdateWorkAreas,
  onUpdatePersonnel,
  onUpdateZones,
}: {
  isOpen: boolean;
  onClose: () => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
  zones: Zone[];
  onUpdateWorkAreas: (areas: WorkArea[]) => void;
  onUpdatePersonnel: (p: Personnel[]) => void;
  onUpdateZones: (z: Zone[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('areas');
  const [editingArea, setEditingArea] = useState<WorkArea | null>(null);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('bg-green-600');
  const [newAreaActivities, setNewAreaActivities] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonWorkAreaId, setNewPersonWorkAreaId] = useState('');
  const [newZoneName, setNewZoneName] = useState('');

  const COLOR_OPTIONS = [
    'bg-green-600', 'bg-orange-500', 'bg-cyan-500', 'bg-purple-500', 'bg-yellow-500',
    'bg-red-500', 'bg-blue-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
  ];

  if (!isOpen) return null;

  // Work Area CRUD
  const handleAddArea = () => {
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const activities = newAreaActivities.split(',').map(a => a.trim()).filter(Boolean);
    const newArea: WorkArea = { id: 'wa_' + generateUniqueId(), name: trimmed, activities, color: newAreaColor };
    onUpdateWorkAreas([...workAreas, newArea]);
    setNewAreaName('');
    setNewAreaActivities('');
    setNewAreaColor('bg-green-600');
  };

  const handleDeleteArea = (id: string) => {
    onUpdateWorkAreas(workAreas.filter(a => a.id !== id));
    // Also remove personnel references
    onUpdatePersonnel(personnel.filter(p => p.workAreaId !== id));
  };

  const handleSaveArea = () => {
    if (!editingArea) return;
    const activities = newAreaActivities.split(',').map(a => a.trim()).filter(Boolean);
    const updated = workAreas.map(a => a.id === editingArea.id ? { ...a, name: newAreaName.trim() || a.name, activities, color: newAreaColor } : a);
    onUpdateWorkAreas(updated);
    setEditingArea(null);
    setNewAreaName('');
    setNewAreaActivities('');
    setNewAreaColor('bg-green-600');
  };

  const startEditArea = (area: WorkArea) => {
    setEditingArea(area);
    setNewAreaName(area.name);
    setNewAreaActivities(area.activities.join(', '));
    setNewAreaColor(area.color);
  };

  // Personnel CRUD
  const handleAddPerson = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed || !newPersonWorkAreaId) return;
    const newPerson: Personnel = { id: 'p_' + generateUniqueId(), name: trimmed, workAreaId: newPersonWorkAreaId };
    onUpdatePersonnel([...personnel, newPerson]);
    setNewPersonName('');
    setNewPersonWorkAreaId('');
  };

  const handleDeletePerson = (id: string) => {
    onUpdatePersonnel(personnel.filter(p => p.id !== id));
  };

  const handleSavePerson = () => {
    if (!editingPerson) return;
    const updated = personnel.map(p => p.id === editingPerson.id ? { ...p, name: newPersonName.trim() || p.name, workAreaId: newPersonWorkAreaId || p.workAreaId } : p);
    onUpdatePersonnel(updated);
    setEditingPerson(null);
    setNewPersonName('');
    setNewPersonWorkAreaId('');
  };

  const startEditPerson = (person: Personnel) => {
    setEditingPerson(person);
    setNewPersonName(person.name);
    setNewPersonWorkAreaId(person.workAreaId);
  };

  // Zone CRUD
  const handleAddZone = () => {
    const trimmed = newZoneName.trim();
    if (!trimmed) return;
    const newZone: Zone = { id: 'z_' + generateUniqueId(), name: trimmed };
    onUpdateZones([...zones, newZone]);
    setNewZoneName('');
  };

  const handleDeleteZone = (id: string) => {
    onUpdateZones(zones.filter(z => z.id !== id));
  };

  const handleSaveZone = () => {
    if (!editingZone) return;
    const updated = zones.map(z => z.id === editingZone.id ? { ...z, name: newZoneName.trim() || z.name } : z);
    onUpdateZones(updated);
    setEditingZone(null);
    setNewZoneName('');
  };

  const startEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setNewZoneName(zone.name);
  };

  const getWorkAreaName = (id: string) => workAreas.find(a => a.id === id)?.name ?? 'Sin área';

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'areas', label: 'Áreas de Trabajo' },
    { key: 'personal', label: 'Personal' },
    { key: 'zonas', label: 'Zonas' },
    { key: 'seguridad', label: 'Clave' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl no-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            <Settings size={18} /> Administración
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setEditingArea(null); setEditingPerson(null); setEditingZone(null); }}
              className={`flex-1 py-3 text-[9px] font-black uppercase transition-all ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* ─── Work Areas Tab ─── */}
          {activeTab === 'areas' && (
            <>
              {workAreas.map(area => (
                <div key={area.id} className="bg-slate-50 rounded-2xl p-4">
                  {editingArea?.id === area.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newAreaName}
                        onChange={e => setNewAreaName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Nombre del área"
                      />
                      <input
                        type="text"
                        value={newAreaActivities}
                        onChange={e => setNewAreaActivities(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Actividades separadas por coma"
                      />
                      <div className="flex flex-wrap gap-1">
                        {COLOR_OPTIONS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewAreaColor(c)}
                            className={`w-6 h-6 rounded-full ${c} ${newAreaColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveArea} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                        <button onClick={() => { setEditingArea(null); setNewAreaName(''); setNewAreaActivities(''); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full ${area.color}`} />
                          <span className="font-black text-slate-800 text-sm uppercase">{area.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditArea(area)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteArea(area.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {area.activities.map(act => (
                          <span key={act} className="px-2 py-1 bg-white text-slate-500 rounded-lg text-[9px] font-bold">{act}</span>
                        ))}
                      </div>
                      <p className="text-[8px] text-slate-400 mt-2 font-bold uppercase">
                        {personnel.filter(p => p.workAreaId === area.id).length} persona(s)
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new area */}
              {!editingArea && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Agregar Área de Trabajo</p>
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    placeholder="Nombre del área"
                  />
                  <input
                    type="text"
                    value={newAreaActivities}
                    onChange={e => setNewAreaActivities(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    placeholder="Actividades separadas por coma"
                  />
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewAreaColor(c)}
                        className={`w-6 h-6 rounded-full ${c} ${newAreaColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleAddArea}
                    disabled={!newAreaName.trim()}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                  >
                    <Plus size={14} className="inline mr-1" /> Agregar Área
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── Personnel Tab ─── */}
          {activeTab === 'personal' && (
            <>
              {personnel.map(person => (
                <div key={person.id} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  {editingPerson?.id === person.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={newPersonName}
                        onChange={e => setNewPersonName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Nombre completo"
                      />
                      <select
                        value={newPersonWorkAreaId}
                        onChange={e => setNewPersonWorkAreaId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                      >
                        <option value="">Seleccionar área...</option>
                        {workAreas.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleSavePerson} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                        <button onClick={() => { setEditingPerson(null); setNewPersonName(''); setNewPersonWorkAreaId(''); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{person.name}</p>
                        <p className="text-[9px] font-medium text-slate-400">{getWorkAreaName(person.workAreaId)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditPerson(person)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDeletePerson(person.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new person */}
              {!editingPerson && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Agregar Personal</p>
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={e => setNewPersonName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    placeholder="Nombre completo"
                  />
                  <select
                    value={newPersonWorkAreaId}
                    onChange={e => setNewPersonWorkAreaId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                  >
                    <option value="">Seleccionar área...</option>
                    {workAreas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddPerson}
                    disabled={!newPersonName.trim() || !newPersonWorkAreaId}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                  >
                    <Plus size={14} className="inline mr-1" /> Agregar Personal
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── Zones Tab ─── */}
          {activeTab === 'zonas' && (
            <>
              {zones.map(zone => (
                <div key={zone.id} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  {editingZone?.id === zone.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newZoneName}
                        onChange={e => setNewZoneName(e.target.value)}
                        className="flex-1 p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Nombre de zona"
                      />
                      <button onClick={handleSaveZone} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                      <button onClick={() => { setEditingZone(null); setNewZoneName(''); }} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">X</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-700 text-sm">{zone.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditZone(zone)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new zone */}
              {!editingZone && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Agregar Zona</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newZoneName}
                      onChange={e => setNewZoneName(e.target.value)}
                      className="flex-1 p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                      placeholder="Nombre de zona"
                    />
                    <button
                      onClick={handleAddZone}
                      disabled={!newZoneName.trim()}
                      className="px-4 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'seguridad' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Component ─── */

function ModalInner({
  editingItem,
  onClose,
  onSave,
  onDelete,
  onGeneratePDF,
  workAreas,
  personnel,
  zones,
  userRole,
}: {
  editingItem: Partial<WorkOrder> | null;
  onClose: () => void;
  onSave: (data: Partial<WorkOrder>) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (ot: Partial<WorkOrder>) => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
  zones: Zone[];
  userRole: UserRole;
}) {
  const [form, setForm] = useState(() => {
    // Try to infer work area from editing item's activities
    let initialWorkAreaId = '';
    if (editingItem?.activities && editingItem.activities.length > 0) {
      for (const wa of loadWorkAreas()) {
        if (editingItem.activities.some(a => wa.activities.includes(a))) {
          initialWorkAreaId = wa.id;
          break;
        }
      }
    }
    return {
      id: editingItem?.id,
      otId: editingItem?.otId,
      workAreaId: initialWorkAreaId,
      activities: editingItem?.activities ?? [],
      collaborators: editingItem?.collaborators ?? [],
      zoneName: editingItem?.zoneName ?? '',
      description: editingItem?.description ?? '',
      status: editingItem?.status ?? 'Pendiente',
      createdAt: editingItem?.createdAt,
      photosBefore: editingItem?.photosBefore ?? [],
      photosAfter: editingItem?.photosAfter ?? [],
    };
  });
  const [customActivity, setCustomActivity] = useState('');
  const [validationError, setValidationError] = useState('');
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(!!editingItem?.description);

  // Derived filtered data based on selected work area
  const selectedWorkArea = workAreas.find(wa => wa.id === form.workAreaId);
  const filteredActivities = selectedWorkArea ? selectedWorkArea.activities : [];
  // Always show ALL personnel so users can freely select from any area
  // Personnel from the selected work area appear first
  const allCollaborators = personnel.map(p => ({
    name: p.name,
    workAreaName: workAreas.find(wa => wa.id === p.workAreaId)?.name ?? '',
    workAreaId: p.workAreaId,
  }));
  // Sort: personnel from selected work area first, then others
  const filteredCollaborators = form.workAreaId
    ? [
        ...allCollaborators.filter(c => c.workAreaId === form.workAreaId),
        ...allCollaborators.filter(c => c.workAreaId !== form.workAreaId),
      ]
    : allCollaborators;

  const zoneOptions = zones.map(z => ({ value: z.name }));

  const workAreaOptions = workAreas.map(wa => ({
    value: wa.id,
    subtitle: `${wa.activities.length} actividades, ${personnel.filter(p => p.workAreaId === wa.id).length} personas`,
    colorDot: wa.color,
  }));

  // Auto-generate description
  const generateDescription = useCallback((activities: string[], collaborators: string[], workAreaName: string) => {
    const actStr = activities.length > 0 ? activities.join(', ') : '';
    const collStr = collaborators.length > 0 ? collaborators.join(', ') : '';
    const parts: string[] = [];
    if (actStr) parts.push(`Realizar ${actStr}`);
    if (workAreaName) parts.push(`en área ${workAreaName}`);
    if (collStr) parts.push(`Personal asignado: ${collStr}`);
    return parts.join('. ') + '.';
  }, []);

  // Handle work area change
  const handleWorkAreaChange = useCallback((workAreaId: string) => {
    const wa = workAreas.find(a => a.id === workAreaId);
    if (!wa) {
      setForm(prev => ({ ...prev, workAreaId: '', activities: [], collaborators: [] }));
      return;
    }

    // Filter activities: keep only those in the new work area
    const keptActivities = form.activities.filter(a => wa.activities.includes(a));

    // Auto-select personnel from the new work area (replaces previous selection)
    // Users can then manually adjust via the collaborator selector
    const areaPersonnel = personnel.filter(p => p.workAreaId === workAreaId).map(p => p.name);

    const newDescription = generateDescription(keptActivities, areaPersonnel, wa.name);

    setForm(prev => ({
      ...prev,
      workAreaId,
      activities: keptActivities,
      collaborators: areaPersonnel,
      description: descriptionManuallyEdited ? prev.description : newDescription,
    }));
    setDescriptionManuallyEdited(false);
    setValidationError('');
  }, [workAreas, personnel, form.activities, generateDescription, descriptionManuallyEdited]);

  const handleToggleActivity = useCallback((activity: string) => {
    setForm(prev => {
      const newActivities = prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity];
      const wa = workAreas.find(a => a.id === prev.workAreaId);
      const newDescription = generateDescription(newActivities, prev.collaborators, wa?.name ?? '');
      return {
        ...prev,
        activities: newActivities,
        description: descriptionManuallyEdited ? prev.description : newDescription,
      };
    });
    setDescriptionManuallyEdited(false);
    setValidationError('');
  }, [workAreas, generateDescription, descriptionManuallyEdited]);

  const handleToggleCollaborator = useCallback((name: string) => {
    setForm(prev => {
      const newCollaborators = prev.collaborators.includes(name)
        ? prev.collaborators.filter(c => c !== name)
        : [...prev.collaborators, name];
      const wa = workAreas.find(a => a.id === prev.workAreaId);
      const newDescription = generateDescription(prev.activities, newCollaborators, wa?.name ?? '');
      return {
        ...prev,
        collaborators: newCollaborators,
        description: descriptionManuallyEdited ? prev.description : newDescription,
      };
    });
    setDescriptionManuallyEdited(false);
    setValidationError('');
  }, [workAreas, generateDescription, descriptionManuallyEdited]);

  const handleAddCustomActivity = () => {
    const trimmed = customActivity.trim();
    if (trimmed && !form.activities.includes(trimmed)) {
      setForm(prev => {
        const newActivities = [...prev.activities, trimmed];
        const wa = workAreas.find(a => a.id === prev.workAreaId);
        const newDescription = generateDescription(newActivities, prev.collaborators, wa?.name ?? '');
        return {
          ...prev,
          activities: newActivities,
          description: descriptionManuallyEdited ? prev.description : newDescription,
        };
      });
      setDescriptionManuallyEdited(false);
      setCustomActivity('');
      setValidationError('');
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescriptionManuallyEdited(true);
    setForm(prev => ({ ...prev, description: value }));
    setValidationError('');
  };

  const handleSave = () => {
    if (!form.workAreaId) {
      setValidationError('Selecciona un área de trabajo');
      return;
    }
    if (form.activities.length === 0) {
      setValidationError('Selecciona al menos una actividad');
      return;
    }
    if (!form.zoneName) {
      setValidationError('Selecciona una zona');
      return;
    }
    if (!form.description.trim()) {
      setValidationError('Las observaciones son obligatorias');
      return;
    }
    if (form.collaborators.length === 0) {
      setValidationError('Selecciona al menos un responsable');
      return;
    }
    setValidationError('');
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] max-h-[90vh] overflow-y-auto p-8 shadow-2xl no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Detalle de OT</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-5">
          {/* 1. Work Area Selector */}
          <Dropdown
            label="Área de Trabajo"
            icon={Settings}
            options={workAreaOptions}
            selected={form.workAreaId}
            onSelect={handleWorkAreaChange}
            placeholder="Seleccionar área de trabajo..."
          />

          {/* 2. Activities (filtered by work area) */}
          <MultiSelectActivities
            selected={form.activities}
            onToggle={handleToggleActivity}
            customActivity={customActivity}
            onCustomActivityChange={setCustomActivity}
            onAddCustom={handleAddCustomActivity}
            availableActivities={filteredActivities}
          />

          {/* 3. Collaborators (all personnel available, area personnel shown first) */}
          <MultiSelectCollaborators
            selected={form.collaborators}
            onToggle={handleToggleCollaborator}
            availableCollaborators={filteredCollaborators}
            selectedWorkAreaId={form.workAreaId}
          />

          {/* 4. Zone */}
          <Dropdown
            label="Zona"
            icon={MapPin}
            options={zoneOptions}
            selected={form.zoneName}
            onSelect={(z) => { setForm(prev => ({ ...prev, zoneName: z })); setValidationError(''); }}
            placeholder="Seleccionar zona..."
            searchable
          />

          {/* 5. Observations (auto-generated but editable) */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones *</label>
            <textarea
              className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-medium text-sm min-h-[80px]"
              placeholder="Detalle de la tarea..."
              value={form.description}
              onChange={e => handleDescriptionChange(e.target.value)}
            />
          </div>

          {/* 6. Photos */}
          <PhotoUpload
            label="Fotos Antes"
            photos={form.photosBefore}
            onPhotosChange={(p) => setForm(prev => ({ ...prev, photosBefore: p }))}
          />
          <PhotoUpload
            label="Fotos Después"
            photos={form.photosAfter}
            onPhotosChange={(p) => setForm(prev => ({ ...prev, photosAfter: p }))}
          />

          {/* 7. Status */}
          <div className="flex gap-2">
            {Object.keys(STATUS_CONFIG).map(s => {
              const isRestricted = s === 'Terminada' && userRole !== 'admin';
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !isRestricted && setForm(prev => ({ ...prev, status: s }))}
                  disabled={isRestricted}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                    isRestricted
                      ? 'bg-slate-50 text-slate-200 cursor-not-allowed'
                      : form.status === s
                        ? `${STATUS_CONFIG[s].color} text-white`
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isRestricted ? <span className="flex items-center justify-center gap-1"><Shield size={10} /> {s}</span> : s}
                </button>
              );
            })}
          </div>

          {/* 8. Timestamps (Admin only) */}
          {userRole === 'admin' && editingItem?.id && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CalendarDays size={10} /> Registro de Fechas y Horarios
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-blue-500 uppercase">Creada</span>
                  <span className="text-[10px] font-bold text-slate-600">{formatDateTime(editingItem.createdAt ?? null)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-amber-500 uppercase">En Proceso</span>
                  <span className="text-[10px] font-bold text-slate-600">{formatDateTime(editingItem.startedAt ?? null)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase">Terminada</span>
                  <span className="text-[10px] font-bold text-slate-600">{formatDateTime(editingItem.completedAt ?? null)}</span>
                </div>
                {editingItem.startedAt && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400">Tiempo de espera</span>
                      <span className="text-[9px] font-black text-red-500">{formatDuration(editingItem.startedAt - (editingItem.createdAt ?? 0))}</span>
                    </div>
                    {editingItem.completedAt && (
                      <>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] font-bold text-slate-400">Tiempo de proceso</span>
                          <span className="text-[9px] font-black text-amber-500">{formatDuration(editingItem.completedAt - editingItem.startedAt)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] font-bold text-slate-400">Tiempo total</span>
                          <span className="text-[9px] font-black text-emerald-500">{formatDuration(editingItem.completedAt - (editingItem.createdAt ?? 0))}</span>
                        </div>
                      </>
                    )}
                    {!editingItem.completedAt && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] font-bold text-slate-400">En proceso durante</span>
                        <span className="text-[9px] font-black text-amber-500">{formatDuration(Date.now() - editingItem.startedAt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {validationError && (
            <p className="text-red-500 text-xs font-bold text-center">{validationError}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl active:scale-95 transition-transform"
          >
            GUARDAR
          </button>

          {editingItem?.id && (
            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => onGeneratePDF(editingItem)}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
              >
                <Download size={14} /> PDF
              </button>
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => onDelete(editingItem.id!)}
                  className="p-3 bg-red-50 text-red-500 rounded-xl"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({
  isOpen,
  editingItem,
  onClose,
  onSave,
  onDelete,
  onGeneratePDF,
  workAreas,
  personnel,
  zones,
  userRole,
}: {
  isOpen: boolean;
  editingItem: Partial<WorkOrder> | null;
  onClose: () => void;
  onSave: (data: Partial<WorkOrder>) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (ot: Partial<WorkOrder>) => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
  zones: Zone[];
  userRole: UserRole;
}) {
  if (!isOpen) return null;
  const modalKey = editingItem?.id ?? 'new';
  return (
    <ModalInner
      key={modalKey}
      editingItem={editingItem}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
      onGeneratePDF={onGeneratePDF}
      workAreas={workAreas}
      personnel={personnel}
      zones={zones}
      userRole={userRole}
    />
  );
}

/* ─── PDF Generation ─── */

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('No canvas'); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function addPageFooter(doc: any, pw: number, ph: number) {
  const footerY = ph - 30;
  doc.setDrawColor(31, 40, 107);
  doc.setLineWidth(0.5);
  doc.line(40, footerY - 8, pw - 40, footerY - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Documento generado automaticamente por Sistema de Gestion Laguna Norte', pw / 2, footerY, { align: 'center' });
  doc.text('Administracion - Asesorias Integrales CyJ', pw / 2, footerY + 8, { align: 'center' });
}

async function buildPDF(ot: Partial<WorkOrder>) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pw = 595.28;
  const ph = 841.89;
  const m = 40;
  const cw = pw - m * 2;

  const navy = [31, 40, 107];
  const navyLight = [230, 233, 245];
  const valueColor = [30, 30, 30];
  const borderColor = [190, 195, 210];

  let y = 30;

  try {
    const logo1 = await loadImageAsBase64('/logo-laguna.jpg');
    doc.addImage(logo1, 'JPEG', m, y, 130, 52);
  } catch { /* skip */ }

  try {
    const logo2 = await loadImageAsBase64('/logo-empresa.png');
    doc.addImage(logo2, 'PNG', pw - m - 90, y, 90, 52);
  } catch { /* skip */ }

  y += 62;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(9);
  doc.text('C O N D O M I N I O   &   P A R Q U E', pw / 2, y, { align: 'center' });
  y += 16;
  doc.setFontSize(14);
  doc.text('REPORTE DE OPERACION', pw / 2, y, { align: 'center' });
  y += 14;
  doc.setFontSize(10);
  doc.text(`CODIGO: ${ot.otId ?? ''}`, pw / 2, y, { align: 'center' });
  y += 12;

  doc.setDrawColor(...navy);
  doc.setLineWidth(1.5);
  doc.line(m, y, pw - m, y);
  y += 14;

  const tblX = m;
  const tblW = cw;
  const labelColW = 90;
  const halfW = tblW / 2;
  const valColW = halfW - labelColW;
  const rowH = 24;

  function drawTableRow(
    label1: string, value1: string,
    label2: string, value2: string,
    rowY: number
  ): number {
    doc.setFillColor(252, 252, 255);
    doc.rect(tblX, rowY, tblW, rowH, 'F');
    doc.setFillColor(...navyLight);
    doc.rect(tblX, rowY, labelColW, rowH, 'F');
    doc.setFillColor(...navyLight);
    doc.rect(tblX + halfW, rowY, labelColW, rowH, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.rect(tblX, rowY, tblW, rowH, 'S');
    doc.line(tblX + halfW, rowY, tblX + halfW, rowY + rowH);
    doc.line(tblX + labelColW, rowY, tblX + labelColW, rowY + rowH);
    doc.line(tblX + halfW + labelColW, rowY, tblX + halfW + labelColW, rowY + rowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...navy);
    doc.text(label1, tblX + 6, rowY + 15);
    doc.text(label2, tblX + halfW + 6, rowY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...valueColor);
    const v1 = doc.splitTextToSize(value1, valColW - 12);
    const v2 = doc.splitTextToSize(value2, valColW - 12);
    doc.text(v1[0] || '', tblX + labelColW + 6, rowY + 15);
    doc.text(v2[0] || '', tblX + halfW + labelColW + 6, rowY + 15);
    return rowY + rowH;
  }

  doc.setFillColor(...navy);
  doc.rect(tblX, y, tblW, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('INFORMACION DE LA ORDEN', tblX + 6, y + 15);
  doc.text('DETALLE', tblX + halfW + 6, y + 15);
  y += rowH;

  const activities = (ot.activities ?? []).join(', ');
  const collaborators = (ot.collaborators ?? []).join(', ');
  const dateStr = ot.createdAt ? formatDate(ot.createdAt) : '';
  const startedStr = ot.startedAt ? formatDateTime(ot.startedAt) : '—';
  const completedStr = ot.completedAt ? formatDateTime(ot.completedAt) : '—';

  y = drawTableRow('Actividad', activities, 'Fecha Creación', dateStr, y);
  y = drawTableRow('Estado', ot.status ?? '', 'Zona', ot.zoneName ?? '', y);
  y = drawTableRow('Inicio', startedStr, 'Término', completedStr, y);
  y = drawTableRow('Codigo', ot.otId ?? '', 'Area', activities, y);

  const respSplit = doc.splitTextToSize(collaborators, tblW - labelColW - 12);
  const respH = Math.max(rowH, respSplit.length * 11 + 12);

  doc.setFillColor(252, 252, 255);
  doc.rect(tblX, y, tblW, respH, 'F');
  doc.setFillColor(...navyLight);
  doc.rect(tblX, y, labelColW, respH, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.rect(tblX, y, tblW, respH, 'S');
  doc.line(tblX + labelColW, y, tblX + labelColW, y + respH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text('Responsables', tblX + 6, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...valueColor);
  doc.text(respSplit, tblX + labelColW + 6, y + 14);
  y += respH;

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text('OBSERVACIONES', m, y);
  y += 6;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 10;

  const descText = ot.description || 'Sin observaciones registradas';
  const splitDesc = doc.splitTextToSize(descText, cw - 24);
  const descH = Math.max(40, splitDesc.length * 11 + 18);

  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.setFillColor(252, 252, 255);
  doc.roundedRect(m, y, cw, descH, 3, 3, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...valueColor);
  doc.setFontSize(9);
  doc.text(splitDesc, m + 12, y + 14);
  y += descH + 18;

  const photoW = (cw - 16) / 2;
  const photoH = photoW * 0.75;
  const minSpaceNeeded = photoH + 50;

  if (y + minSpaceNeeded > ph - 50) {
    addPageFooter(doc, pw, ph);
    doc.addPage();
    y = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text('EVIDENCIA FOTOGRAFICA', pw / 2, y, { align: 'center' });
  y += 6;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 12;

  const gap = 16;
  const beforeX = m;
  const afterX = m + photoW + gap;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('ANTES', beforeX + photoW / 2, y, { align: 'center' });
  doc.text('DESPUES', afterX + photoW / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(...borderColor);
  doc.setFillColor(245, 246, 250);
  doc.setLineWidth(0.3);
  doc.roundedRect(beforeX, y, photoW, photoH, 3, 3, 'FD');
  doc.roundedRect(afterX, y, photoW, photoH, 3, 3, 'FD');

  const photosBefore = ot.photosBefore ?? [];
  const photosAfter = ot.photosAfter ?? [];

  if (photosBefore.length > 0) {
    try { doc.addImage(photosBefore[0], 'JPEG', beforeX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin foto', beforeX + photoW / 2, y + photoH / 2, { align: 'center' });
  }

  if (photosAfter.length > 0) {
    try { doc.addImage(photosAfter[0], 'JPEG', afterX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin foto', afterX + photoW / 2, y + photoH / 2, { align: 'center' });
  }
  y += photoH + 8;

  const extraBefore = photosBefore.slice(1);
  const extraAfter = photosAfter.slice(1);
  if (extraBefore.length > 0 || extraAfter.length > 0) {
    const maxExtra = Math.max(extraBefore.length, extraAfter.length);
    for (let i = 0; i < maxExtra; i++) {
      if (y + photoH + 40 > ph - 40) {
        addPageFooter(doc, pw, ph);
        doc.addPage();
        y = 40;
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text(`Foto ${i + 2}`, m, y);
      y += 12;

      doc.setDrawColor(...borderColor);
      doc.setFillColor(245, 246, 250);
      doc.setLineWidth(0.3);
      doc.roundedRect(beforeX, y, photoW, photoH, 3, 3, 'FD');
      doc.roundedRect(afterX, y, photoW, photoH, 3, 3, 'FD');

      if (extraBefore[i]) {
        try { doc.addImage(extraBefore[i], 'JPEG', beforeX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
      } else {
        doc.setFontSize(7); doc.setTextColor(180, 180, 180); doc.setFont('helvetica', 'italic');
        doc.text('Sin foto', beforeX + photoW / 2, y + photoH / 2, { align: 'center' });
      }
      if (extraAfter[i]) {
        try { doc.addImage(extraAfter[i], 'JPEG', afterX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
      } else {
        doc.setFontSize(7); doc.setTextColor(180, 180, 180); doc.setFont('helvetica', 'italic');
        doc.text('Sin foto', afterX + photoW / 2, y + photoH / 2, { align: 'center' });
      }
      y += photoH + 12;
    }
  }

  addPageFooter(doc, pw, ph);
  doc.save(`OT_${ot.otId ?? 'Reporte'}_Reporte.pdf`);
}

/* ─── Main App (Unified Single Page) ─── */

type StatusFilter = 'Todas' | 'Pendiente' | 'En Proceso' | 'Terminada';

/* ─── Admin Dashboard Component ─── */

function AdminDashboard({
  isOpen,
  onClose,
  workOrders,
  workAreas,
  personnel,
}: {
  isOpen: boolean;
  workOrders: WorkOrder[];
  onClose: () => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
}) {
  const [dashTab, setDashTab] = useState<'resumen' | 'personal' | 'areas' | 'detalle' | 'exportar'>('resumen');
  // Filter state
  const [filterArea, setFilterArea] = useState<string>('todas');
  const [filterPerson, setFilterPerson] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  if (!isOpen) return null;

  const now = Date.now();

  // ─── Apply filters to work orders ───
  const filteredOrders = workOrders.filter(o => {
    // Area filter
    if (filterArea !== 'todas') {
      const wa = workAreas.find(wa => wa.id === filterArea);
      if (wa && !o.activities.some(a => wa.activities.includes(a))) return false;
    }
    // Person filter
    if (filterPerson !== 'todos') {
      const person = personnel.find(p => p.id === filterPerson);
      if (person && !o.collaborators.includes(person.name)) return false;
    }
    // Status filter
    if (filterStatus !== 'todas' && o.status !== filterStatus) return false;
    // Date from
    if (filterDateFrom) {
      const from = new Date(filterDateFrom).getTime();
      if (o.createdAt < from) return false;
    }
    // Date to
    if (filterDateTo) {
      const to = new Date(filterDateTo).getTime() + 86400000; // include full day
      if (o.createdAt > to) return false;
    }
    return true;
  });

  const hasActiveFilters = filterArea !== 'todas' || filterPerson !== 'todos' || filterStatus !== 'todas' || filterDateFrom || filterDateTo;

  // Time calculations (on filtered data)
  const completedOrders = filteredOrders.filter(o => o.status === 'Terminada' && o.startedAt && o.completedAt);
  const inProcessOrders = filteredOrders.filter(o => o.status === 'En Proceso' && o.startedAt);
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pendiente');

  // Average times for completed orders
  const avgWaitTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + ((o.startedAt! - o.createdAt) || 0), 0) / completedOrders.length
    : 0;
  const avgProcessTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + ((o.completedAt! - o.startedAt!) || 0), 0) / completedOrders.length
    : 0;
  const avgTotalTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + ((o.completedAt! - o.createdAt) || 0), 0) / completedOrders.length
    : 0;

  // Currently in-process duration
  const avgCurrentProcessTime = inProcessOrders.length > 0
    ? inProcessOrders.reduce((sum, o) => sum + ((now - o.startedAt!) || 0), 0) / inProcessOrders.length
    : 0;

  // Per-personnel metrics (on filtered data)
  const personnelMetrics = personnel.map(p => {
    const personOrders = filteredOrders.filter(o =>
      o.collaborators.includes(p.name) && o.startedAt
    );
    const completedByPerson = personOrders.filter(o => o.status === 'Terminada' && o.completedAt);
    const inProcessByPerson = personOrders.filter(o => o.status === 'En Proceso');

    const avgTime = completedByPerson.length > 0
      ? completedByPerson.reduce((sum, o) => sum + ((o.completedAt! - o.startedAt!) || 0), 0) / completedByPerson.length
      : 0;

    const totalTime = completedByPerson.reduce((sum, o) => sum + ((o.completedAt! - o.startedAt!) || 0), 0);

    return {
      id: p.id,
      name: p.name,
      workAreaName: workAreas.find(wa => wa.id === p.workAreaId)?.name ?? 'Sin área',
      workAreaColor: workAreas.find(wa => wa.id === p.workAreaId)?.color ?? 'bg-gray-500',
      totalOrders: personOrders.length,
      completedOrders: completedByPerson.length,
      inProcessOrders: inProcessByPerson.length,
      avgTime,
      totalTime,
    };
  }).filter(pm => pm.totalOrders > 0 || !hasActiveFilters).sort((a, b) => b.totalOrders - a.totalOrders);

  // Per-area metrics (on filtered data)
  const areaMetrics = workAreas.map(wa => {
    const areaOrders = filteredOrders.filter(o =>
      o.activities.some(a => wa.activities.includes(a))
    );
    const completedArea = areaOrders.filter(o => o.status === 'Terminada' && o.startedAt && o.completedAt);
    const inProcessArea = areaOrders.filter(o => o.status === 'En Proceso');
    const pendingArea = areaOrders.filter(o => o.status === 'Pendiente');

    const avgTime = completedArea.length > 0
      ? completedArea.reduce((sum, o) => sum + ((o.completedAt! - o.startedAt!) || 0), 0) / completedArea.length
      : 0;

    return {
      id: wa.id,
      name: wa.name,
      color: wa.color,
      total: areaOrders.length,
      completed: completedArea.length,
      inProcess: inProcessArea.length,
      pending: pendingArea.length,
      avgTime,
    };
  }).filter(am => am.total > 0 || !hasActiveFilters).sort((a, b) => b.total - a.total);

  // Detailed OT list with time info (on filtered data)
  const ordersWithTime = filteredOrders
    .filter(o => o.startedAt)
    .map(o => {
      const wa = workAreas.find(wa => o.activities.some(a => wa.activities.includes(a)));
      const processTime = o.completedAt ? o.completedAt - o.startedAt! : (o.status === 'En Proceso' ? now - o.startedAt! : 0);
      const waitTime = o.startedAt - o.createdAt;
      const totalTime = o.completedAt ? o.completedAt - o.createdAt : (o.status === 'En Proceso' ? now - o.createdAt : 0);
      return { ...o, wa, processTime, waitTime, totalTime };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // ─── Export CSV ───
  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Código', 'Actividades', 'Responsables', 'Zona', 'Estado', 'Fecha Creación', 'Hora Creación', 'Fecha Inicio', 'Hora Inicio', 'Fecha Término', 'Hora Término', 'Tiempo Espera', 'Tiempo Proceso', 'Tiempo Total', 'Observaciones'];
    const rows = filteredOrders.map(o => {
      const wa = workAreas.find(wa => o.activities.some(a => wa.activities.includes(a)));
      return [
        o.otId,
        `"${(o.activities ?? []).join('; ')}"`,
        `"${(o.collaborators ?? []).join('; ')}"`,
        o.zoneName,
        o.status,
        o.createdAt ? formatDate(o.createdAt) : '',
        o.createdAt ? new Date(o.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        o.startedAt ? formatDate(o.startedAt) : '',
        o.startedAt ? new Date(o.startedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        o.completedAt ? formatDate(o.completedAt) : '',
        o.completedAt ? new Date(o.completedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        o.startedAt ? formatDuration(o.startedAt - o.createdAt) : '',
        o.startedAt && o.completedAt ? formatDuration(o.completedAt - o.startedAt) : '',
        o.completedAt ? formatDuration(o.completedAt - o.createdAt) : '',
        `"${(o.description ?? '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const filterLabel = hasActiveFilters
      ? `_${[filterArea !== 'todas' ? workAreas.find(wa => wa.id === filterArea)?.name : '', filterPerson !== 'todos' ? personnel.find(p => p.id === filterPerson)?.name?.split(' ').slice(0, 2).join('') : '', filterStatus !== 'todas' ? filterStatus : ''].filter(Boolean).join('_')}`
      : '';
    const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LagunaNorte_OTs${filterLabel}_${formatDate(Date.now()).replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Export Personnel Report CSV ───
  const exportPersonnelCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Nombre', 'Área', 'OTs Totales', 'OTs Terminadas', 'OTs En Proceso', 'Tiempo Prom/OT', 'Tiempo Total Trabajado'];
    const rows = personnelMetrics.map(pm => [
      `"${pm.name}"`,
      pm.workAreaName,
      pm.totalOrders,
      pm.completedOrders,
      pm.inProcessOrders,
      pm.avgTime > 0 ? formatDuration(pm.avgTime) : '',
      pm.totalTime > 0 ? formatDuration(pm.totalTime) : '',
    ].join(','));
    const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LagunaNorte_Personal_${formatDate(Date.now()).replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Export Area Report CSV ───
  const exportAreaCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Área', 'OTs Totales', 'Pendientes', 'En Proceso', 'Terminadas', 'Tiempo Promedio'];
    const rows = areaMetrics.map(am => [
      `"${am.name}"`,
      am.total,
      am.pending,
      am.inProcess,
      am.completed,
      am.avgTime > 0 ? formatDuration(am.avgTime) : '',
    ].join(','));
    const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LagunaNorte_Areas_${formatDate(Date.now()).replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Export PDF Report ───
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 30;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(31, 40, 107);
    doc.text('REPORTE DE GESTION - LAGUNA NORTE', pw / 2, 30, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const filterDesc = hasActiveFilters
      ? `Filtros: ${[filterArea !== 'todas' ? 'Area: ' + (workAreas.find(wa => wa.id === filterArea)?.name ?? '') : '', filterPerson !== 'todos' ? 'Persona: ' + (personnel.find(p => p.id === filterPerson)?.name ?? '') : '', filterStatus !== 'todas' ? 'Estado: ' + filterStatus : '', filterDateFrom ? 'Desde: ' + filterDateFrom : '', filterDateTo ? 'Hasta: ' + filterDateTo : ''].filter(Boolean).join(' | ')}`
      : 'Sin filtros aplicados';
    doc.text(filterDesc, pw / 2, 45, { align: 'center' });
    doc.text(`Generado: ${formatDateTime(Date.now())} | Total OTs: ${filteredOrders.length}`, pw / 2, 56, { align: 'center' });

    // Summary box
    let y = 70;
    doc.setFillColor(240, 242, 250);
    doc.roundedRect(m, y, pw - m * 2, 35, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 40, 107);
    doc.text(`Pendientes: ${pendingOrders.length}`, m + 15, y + 15);
    doc.text(`En Proceso: ${inProcessOrders.length}`, m + 130, y + 15);
    doc.text(`Terminadas: ${completedOrders.length}`, m + 250, y + 15);
    doc.text(`Eficiencia: ${filteredOrders.length > 0 ? Math.round((completedOrders.length / filteredOrders.length) * 100) : 0}%`, m + 380, y + 15);
    if (avgProcessTime > 0) doc.text(`Prom Proceso: ${formatDuration(avgProcessTime)}`, m + 490, y + 15);
    if (avgWaitTime > 0) doc.text(`Prom Espera: ${formatDuration(avgWaitTime)}`, m + 490, y + 28);

    y += 50;

    // Table header
    const cols = [40, 100, 90, 55, 55, 65, 65, 65, 55, 55];
    const colLabels = ['Codigo', 'Actividades', 'Responsables', 'Zona', 'Estado', 'Creacion', 'Inicio', 'Termino', 'T Espera', 'T Proceso'];
    let x = m;

    doc.setFillColor(31, 40, 107);
    doc.rect(m, y, pw - m * 2, 18, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    cols.forEach((w, i) => { doc.text(colLabels[i], x + 3, y + 12); x += w; });
    y += 18;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 30, 30);
    let rowIndex = 0;
    for (const o of filteredOrders) {
      if (y > ph - 40) { doc.addPage(); y = 30; }
      if (rowIndex % 2 === 0) { doc.setFillColor(250, 250, 255); doc.rect(m, y, pw - m * 2, 16, 'F'); }
      x = m;
      const row = [
        o.otId,
        (o.activities ?? []).join(', '),
        (o.collaborators ?? []).map(c => c.split(' ').slice(0, 2).join(' ')).join(', '),
        o.zoneName,
        o.status,
        formatDateTime(o.createdAt),
        formatDateTime(o.startedAt),
        formatDateTime(o.completedAt),
        o.startedAt ? formatDuration(o.startedAt - o.createdAt) : '',
        o.startedAt && o.completedAt ? formatDuration(o.completedAt - o.startedAt) : '',
      ];
      row.forEach((val, i) => {
        const maxW = cols[i] - 6;
        const lines = doc.splitTextToSize(String(val), maxW);
        doc.text(lines[0] || '', x + 3, y + 10);
        x += cols[i];
      });
      y += 16;
      rowIndex++;
    }

    // Footer
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento generado por Sistema de Gestion Laguna Norte', pw / 2, ph - 15, { align: 'center' });

    const filterLabel = hasActiveFilters
      ? `_${[filterArea !== 'todas' ? workAreas.find(wa => wa.id === filterArea)?.name : '', filterPerson !== 'todos' ? personnel.find(p => p.id === filterPerson)?.name?.split(' ').slice(0, 2).join('') : '', filterStatus !== 'todas' ? filterStatus : ''].filter(Boolean).join('_')}`
      : '';
    doc.save(`LagunaNorte_Reporte${filterLabel}_${formatDate(Date.now()).replace(/\//g, '-')}.pdf`);
  };

  const clearFilters = () => {
    setFilterArea('todas');
    setFilterPerson('todos');
    setFilterStatus('todas');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const tabs: { key: typeof dashTab; label: string; icon: React.ElementType }[] = [
    { key: 'resumen', label: 'Resumen', icon: BarChart3 },
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'areas', label: 'Áreas', icon: Activity },
    { key: 'detalle', label: 'Detalle', icon: Timer },
    { key: 'exportar', label: 'Exportar', icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl no-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <BarChart3 size={18} /> Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
              title="Filtros"
            >
              <Filter size={16} className="text-white" />
            </button>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white"><X size={20} /></button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-slate-50 border-b border-slate-200 p-3 space-y-2 sticky top-[60px] z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Filter size={10} /> Filtros de Datos
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[8px] font-black text-red-500 uppercase hover:text-red-700">
                  Limpiar
                </button>
              )}
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Área</label>
              <select
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-700 mt-0.5"
              >
                <option value="todas">Todas las áreas</option>
                {workAreas.map(wa => (
                  <option key={wa.id} value={wa.id}>{wa.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Trabajador</label>
              <select
                value={filterPerson}
                onChange={e => setFilterPerson(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-700 mt-0.5"
              >
                <option value="todos">Todo el personal</option>
                {personnel.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Estado</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-700 mt-0.5"
              >
                <option value="todas">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Terminada">Terminada</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Desde</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-700 mt-0.5"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Hasta</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-700 mt-0.5"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-1 pt-1">
                <span className="text-[8px] font-bold text-blue-500">{filteredOrders.length} de {workOrders.length} OTs</span>
                <span className="text-[7px] text-slate-300">|</span>
                {filterArea !== 'todas' && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[7px] font-bold">{workAreas.find(wa => wa.id === filterArea)?.name}</span>
                )}
                {filterPerson !== 'todos' && (
                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[7px] font-bold">{personnel.find(p => p.id === filterPerson)?.name?.split(' ').slice(0, 2).join(' ')}</span>
                )}
                {filterStatus !== 'todas' && (
                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[7px] font-bold">{filterStatus}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white sticky top-[60px] z-10" style={{ top: showFilters ? undefined : '60px' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setDashTab(tab.key)}
              className={`flex-1 py-3 text-[7px] font-black uppercase transition-all flex flex-col items-center gap-1 ${
                dashTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* ─── Resumen Tab ─── */}
          {dashTab === 'resumen' && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-red-500" />
                    <span className="text-[8px] font-black text-red-400 uppercase">Pendientes</span>
                  </div>
                  <p className="text-2xl font-black text-red-600">{pendingOrders.length}</p>
                  <p className="text-[8px] text-red-400 font-medium mt-1">Esperando inicio</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={14} className="text-amber-500" />
                    <span className="text-[8px] font-black text-amber-400 uppercase">En Proceso</span>
                  </div>
                  <p className="text-2xl font-black text-amber-600">{inProcessOrders.length}</p>
                  <p className="text-[8px] text-amber-400 font-medium mt-1">Prom: {formatDuration(avgCurrentProcessTime)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase">Terminadas</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600">{completedOrders.length}</p>
                  <p className="text-[8px] text-emerald-400 font-medium mt-1">Completadas</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-blue-500" />
                    <span className="text-[8px] font-black text-blue-400 uppercase">Eficiencia</span>
                  </div>
                  <p className="text-2xl font-black text-blue-600">{filteredOrders.length > 0 ? Math.round((completedOrders.length / filteredOrders.length) * 100) : 0}%</p>
                  <p className="text-[8px] text-blue-400 font-medium mt-1">Tasa completado</p>
                </div>
              </div>

              {/* Average Times */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Timer size={12} /> Tiempos Promedio (OTs Terminadas)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Espera (creacion - inicio)</span>
                    <span className="text-sm font-black text-red-600">{formatDuration(avgWaitTime)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${Math.min(100, (avgWaitTime / Math.max(avgTotalTime, 1)) * 100)}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Proceso (inicio - termino)</span>
                    <span className="text-sm font-black text-amber-600">{formatDuration(avgProcessTime)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${Math.min(100, (avgProcessTime / Math.max(avgTotalTime, 1)) * 100)}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Total (creacion - termino)</span>
                    <span className="text-sm font-black text-emerald-600">{formatDuration(avgTotalTime)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              {/* Completion Rate Visual */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Distribucion de Estados</h3>
                <div className="flex h-4 rounded-full overflow-hidden bg-slate-200">
                  {filteredOrders.length > 0 && (
                    <>
                      <div className="bg-red-400 transition-all" style={{ width: `${(pendingOrders.length / filteredOrders.length) * 100}%` }}></div>
                      <div className="bg-amber-400 transition-all" style={{ width: `${(inProcessOrders.length / filteredOrders.length) * 100}%` }}></div>
                      <div className="bg-emerald-400 transition-all" style={{ width: `${(completedOrders.length / filteredOrders.length) * 100}%` }}></div>
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-bold text-red-400">{pendingOrders.length} Pend.</span>
                  <span className="text-[8px] font-bold text-amber-400">{inProcessOrders.length} Proc.</span>
                  <span className="text-[8px] font-bold text-emerald-400">{completedOrders.length} Term.</span>
                </div>
              </div>
            </>
          )}

          {/* ─── Personal Tab ─── */}
          {dashTab === 'personal' && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-2">
                <p className="text-[9px] font-bold text-blue-600">Rendimiento del personal basado en tiempos registrados de las ordenes de trabajo</p>
              </div>
              {personnelMetrics.map(pm => (
                <div key={pm.id} className="bg-slate-50 rounded-2xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-slate-800 text-xs">{pm.name}</p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase text-white ${pm.workAreaColor}`}>
                        {pm.workAreaName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-600">{pm.totalOrders}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase">OTs</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-xl p-2">
                      <p className="text-xs font-black text-emerald-600">{pm.completedOrders}</p>
                      <p className="text-[7px] font-bold text-slate-400">Terminadas</p>
                    </div>
                    <div className="bg-white rounded-xl p-2">
                      <p className="text-xs font-black text-amber-600">{pm.inProcessOrders}</p>
                      <p className="text-[7px] font-bold text-slate-400">En Proceso</p>
                    </div>
                    <div className="bg-white rounded-xl p-2">
                      <p className="text-xs font-black text-blue-600">{pm.avgTime > 0 ? formatDuration(pm.avgTime) : '--'}</p>
                      <p className="text-[7px] font-bold text-slate-400">Prom/OT</p>
                    </div>
                  </div>
                  {pm.avgTime > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 mb-1">
                        <span>Tiempo total trabajado</span>
                        <span className="text-slate-600">{formatDuration(pm.totalTime)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (pm.avgTime / Math.max(avgProcessTime, 1)) * 100)}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ─── Areas Tab ─── */}
          {dashTab === 'areas' && (
            <>
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 mb-2">
                <p className="text-[9px] font-bold text-purple-600">Rendimiento por area de trabajo basado en tiempos de OTs completadas</p>
              </div>
              {areaMetrics.map(am => (
                <div key={am.id} className="bg-slate-50 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${am.color}`} />
                      <span className="font-black text-slate-800 text-xs uppercase">{am.name}</span>
                    </div>
                    <span className="text-lg font-black text-slate-600">{am.total}</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 mb-2">
                    {am.total > 0 && (
                      <>
                        <div className="bg-red-400 transition-all" style={{ width: `${(am.pending / am.total) * 100}%` }}></div>
                        <div className="bg-amber-400 transition-all" style={{ width: `${(am.inProcess / am.total) * 100}%` }}></div>
                        <div className="bg-emerald-400 transition-all" style={{ width: `${(am.completed / am.total) * 100}%` }}></div>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[10px] font-black text-red-500">{am.pending}</p>
                      <p className="text-[6px] font-bold text-slate-400 uppercase">Pend</p>
                    </div>
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[10px] font-black text-amber-500">{am.inProcess}</p>
                      <p className="text-[6px] font-bold text-slate-400 uppercase">Proc</p>
                    </div>
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[10px] font-black text-emerald-500">{am.completed}</p>
                      <p className="text-[6px] font-bold text-slate-400 uppercase">Term</p>
                    </div>
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[10px] font-black text-blue-600">{am.avgTime > 0 ? formatDuration(am.avgTime) : '--'}</p>
                      <p className="text-[6px] font-bold text-slate-400 uppercase">Prom</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ─── Detalle Tab ─── */}
          {dashTab === 'detalle' && (
            <>
              <div className="bg-slate-50 rounded-2xl p-3 mb-2">
                <p className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                  <CalendarDays size={12} /> Registro de fechas y horarios por cada orden de trabajo
                </p>
              </div>
              {ordersWithTime.map(ot => (
                <div key={ot.id} className="bg-slate-50 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-slate-200 px-2 py-0.5 rounded-full">{ot.otId}</span>
                      <span className={`text-[9px] font-black uppercase ${STATUS_CONFIG[ot.status]?.text ?? 'text-gray-500'}`}>{ot.status}</span>
                    </div>
                    {ot.wa && (
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase text-white ${ot.wa.color}`}>
                        {ot.wa.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 mb-2 truncate">{(ot.activities ?? []).join(', ')}</p>

                  {/* Timeline */}
                  <div className="border-l-2 border-slate-200 ml-2 pl-3 space-y-2">
                    <div className="relative">
                      <div className="absolute -left-[17px] top-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      <p className="text-[8px] font-black text-blue-500 uppercase">Creada</p>
                      <p className="text-[10px] font-bold text-slate-600">{formatDateTime(ot.createdAt)}</p>
                    </div>
                    {ot.startedAt && (
                      <div className="relative">
                        <div className="absolute -left-[17px] top-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                        <p className="text-[8px] font-black text-amber-500 uppercase">En Proceso</p>
                        <p className="text-[10px] font-bold text-slate-600">{formatDateTime(ot.startedAt)}</p>
                        <p className="text-[8px] text-slate-400 font-medium">Espera: {formatDuration(ot.startedAt - ot.createdAt)}</p>
                      </div>
                    )}
                    {ot.completedAt && (
                      <div className="relative">
                        <div className="absolute -left-[17px] top-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                        <p className="text-[8px] font-black text-emerald-500 uppercase">Terminada</p>
                        <p className="text-[10px] font-bold text-slate-600">{formatDateTime(ot.completedAt)}</p>
                        <p className="text-[8px] text-slate-400 font-medium">Proceso: {formatDuration(ot.processTime)}</p>
                      </div>
                    )}
                  </div>

                  {/* Time Summary */}
                  <div className="mt-2 flex gap-2">
                    {ot.waitTime > 0 && (
                      <span className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-[8px] font-black">
                        Espera: {formatDuration(ot.waitTime)}
                      </span>
                    )}
                    {ot.processTime > 0 && (
                      <span className="px-2 py-1 bg-amber-50 text-amber-500 rounded-lg text-[8px] font-black">
                        Proceso: {formatDuration(ot.processTime)}
                      </span>
                    )}
                    {ot.totalTime > 0 && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[8px] font-black">
                        Total: {formatDuration(ot.totalTime)}
                      </span>
                    )}
                  </div>

                  {/* Collaborators */}
                  {(ot.collaborators ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(ot.collaborators ?? []).map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[7px] font-bold">
                          {c.split(' ').slice(0, 2).join(' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {ordersWithTime.length === 0 && (
                <div className="text-center py-12">
                  <Timer className="mx-auto text-slate-200 mb-3" size={40} />
                  <p className="text-slate-300 text-xs font-bold uppercase">No hay OTs con registros de tiempo</p>
                </div>
              )}
            </>
          )}

          {/* ─── Exportar Tab ─── */}
          {dashTab === 'exportar' && (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-2">
                <p className="text-[9px] font-bold text-amber-700 flex items-center gap-1">
                  <Filter size={12} /> Usa los filtros de la parte superior para seleccionar los datos que deseas exportar
                </p>
              </div>

              {/* Current filter summary */}
              <div className="bg-slate-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Datos seleccionados</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white rounded-xl p-2">
                    <p className="text-xl font-black text-blue-600">{filteredOrders.length}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase">OTs a exportar</p>
                  </div>
                  <div className="bg-white rounded-xl p-2">
                    <p className="text-xl font-black text-emerald-600">{completedOrders.length}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase">Terminadas</p>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {filterArea !== 'todas' && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[7px] font-bold">
                        Area: {workAreas.find(wa => wa.id === filterArea)?.name}
                      </span>
                    )}
                    {filterPerson !== 'todos' && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[7px] font-bold">
                        Persona: {personnel.find(p => p.id === filterPerson)?.name?.split(' ').slice(0, 2).join(' ')}
                      </span>
                    )}
                    {filterStatus !== 'todas' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[7px] font-bold">
                        Estado: {filterStatus}
                      </span>
                    )}
                    {filterDateFrom && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[7px] font-bold">
                        Desde: {filterDateFrom}
                      </span>
                    )}
                    {filterDateTo && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[7px] font-bold">
                        Hasta: {filterDateTo}
                      </span>
                    )}
                  </div>
                )}
                {!hasActiveFilters && (
                  <p className="text-[8px] text-slate-400 font-medium mt-2 text-center">Sin filtros - se exportaran todas las OTs</p>
                )}
              </div>

              {/* Export OT Data */}
              <div className="bg-slate-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <FileSpreadsheet size={12} /> Exportar Ordenes de Trabajo
                </p>
                <div className="space-y-2">
                  <button
                    onClick={exportCSV}
                    disabled={filteredOrders.length === 0}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-transform"
                  >
                    <FileSpreadsheet size={16} /> Exportar CSV (Excel)
                  </button>
                  <button
                    onClick={exportPDF}
                    disabled={filteredOrders.length === 0}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-transform"
                  >
                    <FileText size={16} /> Exportar PDF (Reporte)
                  </button>
                </div>
                <p className="text-[7px] text-slate-400 font-medium mt-2 text-center">
                  CSV: Todas las OTs con fechas, horarios y tiempos | PDF: Reporte formateado con tabla resumen
                </p>
              </div>

              {/* Export Personnel Report */}
              <div className="bg-slate-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <User size={12} /> Exportar Reporte de Personal
                </p>
                <button
                  onClick={exportPersonnelCSV}
                  disabled={personnelMetrics.length === 0}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-transform"
                >
                  <FileSpreadsheet size={16} /> Reporte Personal CSV
                </button>
                <p className="text-[7px] text-slate-400 font-medium mt-2 text-center">
                  Nombre, area, OTs totales, terminadas, en proceso, tiempo promedio, tiempo total
                </p>
              </div>

              {/* Export Area Report */}
              <div className="bg-slate-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Activity size={12} /> Exportar Reporte por Areas
                </p>
                <button
                  onClick={exportAreaCSV}
                  disabled={areaMetrics.length === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-transform"
                >
                  <FileSpreadsheet size={16} /> Reporte Areas CSV
                </button>
                <p className="text-[7px] text-slate-400 font-medium mt-2 text-center">
                  Area, OTs totales, pendientes, en proceso, terminadas, tiempo promedio
                </p>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <Download className="mx-auto text-slate-200 mb-3" size={40} />
                  <p className="text-slate-300 text-xs font-bold uppercase">No hay datos para exportar</p>
                  <p className="text-[8px] text-slate-300 mt-1">Ajusta los filtros para seleccionar datos</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Login Screen ─── */

function ProfileLogin({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [showPwdModal, setShowPwdModal] = useState(false);

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-laguna.jpg" alt="Laguna Norte" className="h-20 rounded-2xl mx-auto mb-4 shadow-lg" />
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Laguna Norte</h1>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Condominio & Parque - Sistema de Gestión</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
          <p className="text-center text-sm font-bold text-slate-500 uppercase">Selecciona tu perfil</p>
          <button
            onClick={() => setShowPwdModal(true)}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-black uppercase shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <Shield size={22} />
            <div className="text-left">
              <div className="text-sm">Administrador</div>
              <div className="text-[9px] font-semibold opacity-80">Requiere clave de acceso</div>
            </div>
          </button>
          <button
            onClick={() => {
              localStorage.setItem(USER_ROLE_KEY, 'usuario');
              onLogin('usuario');
            }}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <Eye size={22} />
            <div className="text-left">
              <div className="text-sm">Usuario</div>
              <div className="text-[9px] font-semibold opacity-80">Solo órdenes pendientes y en proceso</div>
            </div>
          </button>
        </div>
        <p className="text-center text-[8px] text-slate-300 mt-6 font-medium uppercase">Administración - Asesorías Integrales CyJ</p>
      </div>
      {showPwdModal && (
        <PasswordModal
          onUnlock={(pwd) => {
            if (checkAdminPwd(pwd)) {
              localStorage.setItem(USER_ROLE_KEY, 'admin');
              onLogin('admin');
            }
          }}
          onCancel={() => setShowPwdModal(false)}
        />
      )}
    </div>
  );
}

function PasswordModal({ onUnlock, onCancel }: { onUnlock: (pwd: string) => void; onCancel: () => void }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Acceso Restringido</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Ingresa la clave de administración</p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (checkAdminPwd(pwd)) { onUnlock(pwd); }
          else { setError('Clave incorrecta'); setPwd(''); }
        }} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(''); }}
            placeholder="Clave de administración"
            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-transform">Ingresar</button>
          <button type="button" onClick={onCancel} className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors">Cancelar</button>
        </form>
      </div>
    </div>
  );
}

export default function LagunaNorteApp() {
  const { workOrders, loading, syncing, apiAvailable, lastSync, createWorkOrder, updateWorkOrder, deleteWorkOrder } = useWorkOrders();
  const { workAreas, personnel, zones, updateWorkAreas, updatePersonnel, updateZones } = useConfigData();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WorkOrder> | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDashOpen, setIsDashOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    try {
      const saved = localStorage.getItem(USER_ROLE_KEY);
      // Only auto-restore 'usuario' role, NOT admin (requires password each time)
      return saved === 'usuario' ? 'usuario' : null;
    } catch { return null; }
  });

  const handleSaveOT = useCallback(async (data: Partial<WorkOrder>) => {
    if (data.id) {
      // Auto-track timestamps when status changes
      const existing = workOrders.find(o => o.id === data.id);
      const now = Date.now();
      const updateData = { ...data };
      if (existing) {
        if (data.status === 'En Proceso' && !existing.startedAt) {
          updateData.startedAt = now;
        }
        if (data.status === 'Terminada' && !existing.completedAt) {
          updateData.completedAt = now;
          // Also ensure startedAt is set if it wasn't
          if (!existing.startedAt) {
            updateData.startedAt = existing.createdAt;
          }
        }
      }
      await updateWorkOrder(updateData);
    } else {
      await createWorkOrder(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  }, [createWorkOrder, updateWorkOrder]);

  const handleDeleteOT = useCallback(async (id: string) => {
    await deleteWorkOrder(id);
    setIsModalOpen(false);
    setEditingItem(null);
  }, [deleteWorkOrder]);

  const handleCreateFromCategory = useCallback((cat: typeof CATEGORIES[number]) => {
    const wa = workAreas.find(a => a.id === cat.workAreaId);
    const areaPersonnel = personnel.filter(p => p.workAreaId === cat.workAreaId).map(p => p.name);
    const activities = wa ? wa.activities : [];
    const description = activities.length > 0 || areaPersonnel.length > 0
      ? `Realizar ${activities.join(', ')} en área ${wa?.name ?? ''}. Personal asignado: ${areaPersonnel.join(', ')}.`
      : '';

    setEditingItem({
      workAreaId: cat.workAreaId,
      activities,
      collaborators: areaPersonnel,
      status: 'Pendiente',
      zoneName: '',
      description,
      photosBefore: [],
      photosAfter: [],
    } as any);
    setIsModalOpen(true);
  }, [workAreas, personnel]);

  const handleEditOT = useCallback((ot: WorkOrder) => {
    setEditingItem(ot);
    setIsModalOpen(true);
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingItem(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
  }, []);

  const generatePDF = useCallback((ot: Partial<WorkOrder>) => {
    buildPDF(ot);
  }, []);

  // Counts
  // Helper: get work area color for an OT by matching its activities
  const getWorkAreaForOT = useCallback((ot: WorkOrder) => {
    for (const wa of workAreas) {
      if (ot.activities.some(a => wa.activities.includes(a))) {
        return wa;
      }
    }
    return null;
  }, [workAreas]);

  // Show loading spinner while initial data is being fetched
  if (loading) {
    return (
      <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-bold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Show profile login if no role is selected
  if (!userRole) {
    return <ProfileLogin onLogin={(role) => setUserRole(role)} />;
  }

  // Visible work orders: usuario can only see Pendiente and En Proceso
  const visibleWorkOrders = userRole === 'usuario'
    ? workOrders.filter(o => o.status === 'Pendiente' || o.status === 'En Proceso')
    : workOrders;

  const visiblePendientes = visibleWorkOrders.filter(o => o.status === 'Pendiente').length;
  const visibleEnProceso = visibleWorkOrders.filter(o => o.status === 'En Proceso').length;
  const visibleTerminadas = visibleWorkOrders.filter(o => o.status === 'Terminada').length;

  const filteredOTs = statusFilter === 'Todas'
    ? visibleWorkOrders
    : visibleWorkOrders.filter(o => o.status === statusFilter);

  // Available filters based on role
  const availableFilters: StatusFilter[] = userRole === 'usuario'
    ? ['Todas', 'Pendiente', 'En Proceso']
    : ['Todas', 'Pendiente', 'En Proceso', 'Terminada'];

  return (
    <div className="max-w-xl mx-auto min-h-screen pb-24 bg-slate-50">
      {/* ─── Header ─── */}
      <header className="p-4 bg-white border-b border-slate-100 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo-laguna.jpg" alt="Laguna Norte" className="h-10 rounded-lg" />
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Laguna Norte</h1>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Condominio & Parque</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-full ${userRole === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {userRole === 'admin' ? <Shield size={10} /> : <Eye size={10} />}
            <span className="hidden sm:inline">{userRole === 'admin' ? 'Admin' : 'Usuario'}</span>
          </div>
          <div className={`flex items-center gap-1 text-[8px] font-black uppercase ${syncing ? 'text-amber-500' : apiAvailable ? 'text-emerald-500' : 'text-orange-400'}`}>
            <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : apiAvailable ? 'En línea' : 'Sin BD'}</span>
          </div>
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setIsDashOpen(true)}
                className="p-2 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                title="Dashboard"
              >
                <BarChart3 size={16} />
              </button>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Administración"
              >
                <Settings size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => {
              localStorage.removeItem(USER_ROLE_KEY);
              setUserRole(null);
            }}
            className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
          <img src="/logo-empresa.png" alt="CyJ" className="h-10 rounded-lg" />
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* ─── Stats Chips ─── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-2">
            <Clock className="text-red-500 flex-shrink-0" size={16} />
            <div>
              <div className="text-xl font-black text-red-600 leading-none">{visiblePendientes}</div>
              <div className="text-[8px] font-bold text-red-400 uppercase tracking-wider">Pendientes</div>
            </div>
          </div>
          <div className="flex-1 bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-2">
            <Zap className="text-amber-500 flex-shrink-0" size={16} />
            <div>
              <div className="text-xl font-black text-amber-600 leading-none">{visibleEnProceso}</div>
              <div className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">En Proceso</div>
            </div>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
            <div>
              <div className="text-xl font-black text-emerald-600 leading-none">{visibleTerminadas}</div>
              <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Listas</div>
            </div>
          </div>
        </div>

        {/* ─── Quick Create Categories ─── */}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Crear OT rápida</p>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => {
              const IconComp = ICON_MAP[cat.icon];
              return (
                <button key={cat.id} onClick={() => handleCreateFromCategory(cat)} className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
                  <div className={`${cat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    {IconComp && <IconComp size={18} />}
                  </div>
                  <span className="text-[7px] font-black uppercase text-slate-500">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Status Filter Tabs ─── */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          {availableFilters.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all ${
                statusFilter === s
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {s === 'Todas' ? `Todas (${workOrders.length})` : s}
            </button>
          ))}
        </div>

        {/* ─── Work Order List ─── */}
        <div className="space-y-3">
          {filteredOTs.map(ot => {
            const wa = getWorkAreaForOT(ot);
            return (
              <div
                key={ot.id}
                onClick={() => handleEditOT(ot)}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm cursor-pointer relative overflow-hidden active:scale-[0.98] transition-transform"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${wa?.color ?? STATUS_CONFIG[ot.status]?.color ?? 'bg-gray-500'}`}></div>
                <div className="flex-1 truncate pr-3 pl-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded-full">{ot.otId}</span>
                    <span className={`text-[9px] font-black uppercase ${STATUS_CONFIG[ot.status]?.text ?? 'text-gray-500'}`}>{ot.status}</span>
                    <span className="text-[8px] text-slate-300 font-medium">{formatDate(ot.createdAt)}</span>
                    {userRole === 'admin' && ot.startedAt && (
                      <span className="text-[8px] text-amber-400 font-bold flex items-center gap-0.5">
                        <Timer size={8} /> {formatDuration((ot.completedAt || Date.now()) - ot.startedAt)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-800 uppercase truncate text-sm">{(ot.activities ?? []).join(', ')}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <MapPin size={10} className="text-blue-500" /> {ot.zoneName}
                    </p>
                    {(ot.collaborators ?? []).length > 0 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <User size={10} className="text-purple-500" /> {(ot.collaborators ?? []).map(c => c.split(' ').slice(0, 2).join(' ')).join(', ')}
                      </p>
                    )}
                  </div>
                  {wa && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white ${wa.color}`}>
                      {wa.name}
                    </span>
                  )}
                </div>
                <ChevronRight className="text-slate-300 flex-shrink-0" size={18} />
              </div>
            );
          })}
          {filteredOTs.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto text-slate-200 mb-3" size={40} />
              <p className="text-slate-300 text-xs font-bold uppercase">No hay órdenes {statusFilter === 'Todas' ? '' : statusFilter.toLowerCase()}</p>
            </div>
          )}
        </div>
      </main>

      {/* ─── Floating Action Button ─── */}
      <button
        onClick={handleOpenNew}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-300/50 active:scale-90 transition-transform z-50"
      >
        <Plus size={28} />
      </button>

      <Modal
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={handleCloseModal}
        onSave={handleSaveOT}
        onDelete={handleDeleteOT}
        onGeneratePDF={generatePDF}
        workAreas={workAreas}
        personnel={personnel}
        zones={zones}
        userRole={userRole}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        workAreas={workAreas}
        personnel={personnel}
        zones={zones}
        onUpdateWorkAreas={updateWorkAreas}
        onUpdatePersonnel={updatePersonnel}
        onUpdateZones={updateZones}
      />

      <AdminDashboard
        isOpen={isDashOpen}
        onClose={() => setIsDashOpen(false)}
        workOrders={workOrders}
        workAreas={workAreas}
        personnel={personnel}
      />
    </div>
  );
}
