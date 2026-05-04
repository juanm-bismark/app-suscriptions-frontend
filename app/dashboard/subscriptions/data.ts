import type { SourceId, StatusId } from "./tokens";

export interface SubscriptionRecord {
  id: string;
  source: SourceId;
  customer: string;
  customerEmail: string;
  plan: string;
  status: StatusId;
  nativeStatus: string;
  parent: string;
  usage: { used: number; total: number | null; unit: string; label: string };
  amount: number;
  currency: string;
  cycle: "Mensual" | "Semanal" | "Anual";
  nextRenewal: string;
  createdAt: string;
  specific: Record<string, string | number | boolean | null>;
}

export const DATA: SubscriptionRecord[] = [
  {
    id: "KT-82941",
    source: "kite",
    customer: "Valentina Ocampo",
    customerEmail: "v.ocampo@dominio.co",
    plan: "Fibra 600 Hogar",
    status: "active",
    nativeStatus: "ACTIVE",
    parent: "Hogar particular",
    usage: { used: 412, total: 600, unit: "GB", label: "Datos mes" },
    amount: 119900,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "2026-05-08",
    createdAt: "2024-03-14",
    specific: {
      ont_serial: "HG8245H5-A91X",
      bw_down_mbps: 600,
      bw_up_mbps: 300,
      installation_addr: "Cra 11 #93-45, Bogotá",
      technician: "J. Restrepo",
      signal_dBm: -22.4,
    },
  },
  {
    id: "T2-1029384",
    source: "tele2",
    customer: "Valentina Ocampo",
    customerEmail: "v.ocampo@dominio.co",
    plan: "Postpago 40GB + Voz",
    status: "active",
    nativeStatus: "ACTIVATED",
    parent: "Cuenta personal · OCAMPO",
    usage: { used: 28.4, total: 40, unit: "GB", label: "Datos mes" },
    amount: 69900,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "2026-05-02",
    createdAt: "2023-11-02",
    specific: {
      msisdn: "+57 311 555 0142",
      iccid: "8957 1102 3319 0142",
      imei: "356938 11 123456 7",
      data_used_gb: 28.4,
      data_cap_gb: 40,
      roaming: false,
    },
  },
  {
    id: "MB-ENT-7720",
    source: "moabits",
    customer: "Agrocampo S.A.S",
    customerEmail: "ops@agrocampo.com.co",
    plan: "IoT Flota · 120 sensores",
    status: "overdue",
    nativeStatus: "Suspended",
    parent: "Agrocampo S.A.S",
    usage: { used: 9.2, total: 12, unit: "GB", label: "Datos mes" },
    amount: 4280000,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "2026-04-10",
    createdAt: "2022-07-19",
    specific: {
      account_mgr: "D. Quintero",
      devices_active: 118,
      devices_total: 120,
      sla_tier: "Gold · 99.9%",
      cost_center: "AGR-OPS-003",
      last_invoice_status: "Vencida (11 días)",
    },
  },
  {
    id: "KT-82106",
    source: "kite",
    customer: "Mateo Rivas",
    customerEmail: "mateo.rivas@correo.co",
    plan: "Fibra 300 + TV",
    status: "paused",
    nativeStatus: "TEST",
    parent: "Hogar particular",
    usage: { used: 0, total: 300, unit: "GB", label: "Datos mes" },
    amount: 89900,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "—",
    createdAt: "2025-01-08",
    specific: {
      ont_serial: "HG8245H5-B22L",
      bw_down_mbps: 300,
      bw_up_mbps: 150,
      installation_addr: "Calle 52 #22-11, Medellín",
      technician: "K. Muñoz",
      signal_dBm: -24.9,
    },
  },
  {
    id: "T2-1024811",
    source: "tele2",
    customer: "Juliana Prieto",
    customerEmail: "j.prieto@correo.co",
    plan: "Prepago Ilimitado Semanal",
    status: "trial",
    nativeStatus: "ACTIVATED",
    parent: "Cuenta personal · PRIETO",
    usage: { used: 2.1, total: null, unit: "GB", label: "Datos sem." },
    amount: 14900,
    currency: "COP",
    cycle: "Semanal",
    nextRenewal: "2026-04-28",
    createdAt: "2026-04-21",
    specific: {
      msisdn: "+57 322 101 7743",
      iccid: "8957 1102 9912 7743",
      imei: "359145 22 887766 1",
      data_used_gb: 2.1,
      data_cap_gb: null,
      roaming: true,
    },
  },
  {
    id: "MB-ENT-7441",
    source: "moabits",
    customer: "Grupo Solera",
    customerEmail: "it@gruposolera.co",
    plan: "Conectividad MPLS · 6 sedes",
    status: "active",
    nativeStatus: "Active",
    parent: "Grupo Solera",
    usage: { used: 380, total: 500, unit: "GB", label: "Datos mes" },
    amount: 9120000,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "2026-05-15",
    createdAt: "2021-05-22",
    specific: {
      account_mgr: "P. Londoño",
      devices_active: 6,
      devices_total: 6,
      sla_tier: "Platinum · 99.99%",
      cost_center: "CORP-IT-001",
      last_invoice_status: "Pagada",
    },
  },
  {
    id: "KT-81003",
    source: "kite",
    customer: "Laura Méndez",
    customerEmail: "laura.m@correo.co",
    plan: "Fibra 900 Gamer",
    status: "canceled",
    nativeStatus: "DEACTIVATED",
    parent: "Hogar particular",
    usage: { used: 0, total: 900, unit: "GB", label: "Datos mes" },
    amount: 149900,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "—",
    createdAt: "2024-09-01",
    specific: {
      ont_serial: "HG8245H5-Z01K",
      bw_down_mbps: 900,
      bw_up_mbps: 600,
      installation_addr: "Av. 6N #28-02, Cali",
      technician: "S. Arango",
      signal_dBm: -20.1,
    },
  },
  {
    id: "T2-1031902",
    source: "tele2",
    customer: "Andrés Caicedo",
    customerEmail: "a.caicedo@correo.co",
    plan: "Postpago 80GB Familiar (×3)",
    status: "pending",
    nativeStatus: "ACTIVATED",
    parent: "Cuenta familiar · CAICEDO",
    usage: { used: 0, total: 80, unit: "GB", label: "Datos mes" },
    amount: 189700,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "2026-05-04",
    createdAt: "2026-04-19",
    specific: {
      msisdn: "+57 300 889 2210",
      iccid: "8957 1103 0022 1100",
      imei: "352211 98 112233 4",
      data_used_gb: 0,
      data_cap_gb: 80,
      roaming: false,
    },
  },
  {
    id: "MB-SMB-2208",
    source: "moabits",
    customer: "Clínica Altavista",
    customerEmail: "compras@altavista.co",
    plan: "IoT Médico · 22 dispositivos",
    status: "active",
    nativeStatus: "Active",
    parent: "Clínica Altavista",
    usage: { used: 6.4, total: 8, unit: "GB", label: "Datos mes" },
    amount: 1980000,
    currency: "COP",
    cycle: "Mensual",
    nextRenewal: "2026-05-12",
    createdAt: "2023-02-10",
    specific: {
      account_mgr: "N. Beltrán",
      devices_active: 21,
      devices_total: 22,
      sla_tier: "Gold · 99.9%",
      cost_center: "CLI-BIO-002",
      last_invoice_status: "Pagada",
    },
  },
];

export function fmtCOP(n: number): string {
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function fmtShortDate(s: string | null | undefined): string {
  if (!s || s === "—") return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function fmtDate(s: string | null | undefined): string {
  if (!s || s === "—") return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function antiquityFor(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date(NOW_REFERENCE);
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 1) return "Nueva";
  if (months < 12) return `${months} mes${months > 1 ? "es" : ""}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}a ${m}m` : `${y} año${y > 1 ? "s" : ""}`;
}

const KEY_LABELS: Record<string, string> = {
  ont_serial: "Serial ONT",
  bw_down_mbps: "Bajada (Mbps)",
  bw_up_mbps: "Subida (Mbps)",
  installation_addr: "Dirección instalación",
  technician: "Técnico asignado",
  signal_dBm: "Señal óptica",
  msisdn: "MSISDN",
  iccid: "ICCID",
  imei: "IMEI",
  data_used_gb: "Consumo datos",
  data_cap_gb: "Cap datos",
  roaming: "Roaming",
  account_mgr: "Account Manager",
  devices_active: "Dispositivos activos",
  devices_total: "Dispositivos totales",
  sla_tier: "Nivel SLA",
  cost_center: "Centro de costo",
  last_invoice_status: "Última factura",
};

export function prettyKey(k: string): string {
  return KEY_LABELS[k] ?? k;
}

export function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") return v.toLocaleString("es-CO");
  return String(v);
}

export function looksMono(k: string): boolean {
  return /serial|msisdn|iccid|imei|cost_center|dBm|mbps/i.test(k);
}

// Reference "now" used by the relative-renewal filter; keeping it stable
// matches the design and avoids snapshot drift in tests/screenshots.
export const NOW_REFERENCE = "2026-04-29";

export function findRecord(id: string): SubscriptionRecord | undefined {
  return DATA.find((r) => r.id === id);
}
