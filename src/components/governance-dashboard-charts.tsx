"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Locale } from "@/lib/i18n";

type Item = { key: string; count: number };
const lifecycleFr: Record<string, string> = { IDEA: "Idée", DEVELOPMENT: "Développement", PILOT: "Pilote", PRODUCTION: "Production", RETIRED: "Retiré" };
const lifecycleEn: Record<string, string> = { IDEA: "Idea", DEVELOPMENT: "Development", PILOT: "Pilot", PRODUCTION: "Production", RETIRED: "Retired" };
const riskFr: Record<string, string> = { LOW: "Faible", MODERATE: "Modéré", HIGH: "Élevé", CRITICAL: "Critique" };
const riskEn: Record<string, string> = { LOW: "Low", MODERATE: "Moderate", HIGH: "High", CRITICAL: "Critical" };
const riskColors: Record<string, string> = { LOW: "#237a57", MODERATE: "#1769aa", HIGH: "#b36a00", CRITICAL: "#b42318" };

export function GovernanceDashboardCharts({ lifecycle, risk, locale }: { lifecycle: Item[]; risk: Item[]; locale: Locale }) {
  const isFrench = locale === "fr";
  const lifecycleData = lifecycle.map((item) => ({ name: (isFrench ? lifecycleFr : lifecycleEn)[item.key] ?? item.key, count: item.count }));
  const riskData = risk.map((item) => ({ name: (isFrench ? riskFr : riskEn)[item.key] ?? item.key, count: item.count, color: riskColors[item.key] ?? "#64748b" }));
  return <div className="dashboard-chart-grid"><section className="panel chart-panel"><h2>{isFrench ? "Systèmes par étape du cycle de vie" : "Systems by lifecycle stage"}</h2><p>{isFrench ? "Nombre de systèmes enregistrés dans chaque étape." : "Registered system count in each stage."}</p><div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><BarChart data={lifecycleData} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}><CartesianGrid vertical={false} stroke="#e5e7eb" /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name={isFrench ? "Systèmes" : "Systems"} fill="#165d9e" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section><section className="panel chart-panel"><h2>{isFrench ? "Systèmes par niveau de risque" : "Systems by risk level"}</h2><p>{isFrench ? "Répartition selon le score de risque actuel." : "Distribution by current risk score."}</p><div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskData} dataKey="count" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3}>{riskData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><ul className="chart-legend">{riskData.map((item) => <li key={item.name}><i style={{ background: item.color }} />{item.name}<strong>{item.count}</strong></li>)}</ul></section></div>;
}
