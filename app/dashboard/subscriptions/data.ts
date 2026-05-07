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
  data_used_gb: "Consumo datos",
  data_cap_gb: "Cap datos",
  roaming: "Roaming",
  account_mgr: "Account Manager",
  devices_active: "Dispositivos activos",
  devices_total: "Dispositivos totales",
  sla_tier: "Nivel SLA",
  cost_center: "Centro de costo",
  last_invoice_status: "Última factura",
  iccid: "ICCID",
  msisdn: "MSISDN",
  imsi: "IMSI",
  imei: "IMEI",
  eid: "EID",
  euiccid: "eUICCID",
  apn: "APN",
  ip_address: "Dirección IP",
  country: "País",
  operator: "Operador",
  rat_type: "Tipo de red",
  last_traffic_at: "Último tráfico",
  last_lu_at: "Última actualización LU",
  last_cdr_at: "Último CDR",
  device_id: "ID dispositivo",
  modem_id: "ID módem",
  sim_model: "Modelo SIM",
  data_limit_mb: "Límite datos (MB)",
  sms_limit: "Límite SMS",
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
  return /serial|msisdn|iccid|imsi|imei|eid|euiccid|cost_center|dBm|mbps|ip_address|device_id|modem_id/i.test(k);
}

export const NOW_REFERENCE = "2026-04-29";
