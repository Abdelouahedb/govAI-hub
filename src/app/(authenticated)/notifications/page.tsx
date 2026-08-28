import Link from "next/link";
import { Bell, CheckCircle, ClipboardText, FileMagnifyingGlass, Gavel, Siren } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/permissions";
import { getNotifications, type Notification } from "@/lib/data/notifications";
import { getLocale, tr, type Locale } from "@/lib/i18n";

const actionStatus: Record<string, [string, string]> = { OPEN: ["Ouverte", "Open"], IN_PROGRESS: ["En cours", "In progress"], BLOCKED: ["Bloquée", "Blocked"] };
const incidentStatus: Record<string, [string, string]> = { OPEN: ["Ouvert", "Open"], INVESTIGATING: ["En investigation", "Investigating"] };
const severity: Record<string, [string, string]> = { LOW: ["faible", "low"], MEDIUM: ["moyenne", "medium"], HIGH: ["élevée", "high"], CRITICAL: ["critique", "critical"] };

function copyFor(notification: Notification, locale: Locale) {
  const label = (values: [string, string] | undefined) => values ? tr(locale, values[0], values[1]) : "";
  if (notification.type === "action") return { title: notification.subject, detail: `${notification.referenceId} · ${notification.systemName} · ${label(actionStatus[notification.status ?? ""])}` };
  if (notification.type === "assessment") return { title: tr(locale, "Évaluation des risques à compléter", "Risk assessment to complete"), detail: `${notification.referenceId} · ${notification.systemName}` };
  if (notification.type === "review") return { title: tr(locale, "Évaluation des risques à vérifier", "Risk assessment to verify"), detail: `${notification.referenceId} · ${notification.systemName}` };
  if (notification.type === "decision") return { title: tr(locale, "Décision de gouvernance attendue", "Governance decision required"), detail: `${notification.referenceId} · ${notification.systemName}` };
  const severityLabel = label(severity[notification.severity ?? ""]);
  return { title: tr(locale, `Incident ${severityLabel} à suivre`, `${severityLabel} incident to follow up`), detail: `${notification.referenceId} · ${notification.systemName} · ${notification.subject} · ${label(incidentStatus[notification.status ?? ""])}` };
}

function NotificationIcon({ type }: { type: Notification["type"] }) {
  if (type === "action") return <ClipboardText size={19} />;
  if (type === "assessment" || type === "review") return <FileMagnifyingGlass size={19} />;
  if (type === "decision") return <Gavel size={19} />;
  return <Siren size={19} weight="fill" />;
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, locale] = await Promise.all([getNotifications(user.id, user.role), getLocale()]);

  return <section className="app-page narrow-page notifications-page">
    <header className="page-heading">
      <div><p className="eyebrow">{tr(locale, "Notifications", "Notifications")}</p><h1>{tr(locale, "Éléments demandant votre attention", "Items needing your attention")}</h1><p>{tr(locale, "Cette liste correspond exactement au compteur affiché dans votre barre de navigation.", "This list exactly matches the count shown in your navigation bar.")}</p></div>
    </header>
    {items.length ? <><p className="notification-count"><Bell size={17} weight="fill" /> {tr(locale, `${items.length} élément${items.length > 1 ? "s" : ""} à traiter`, `${items.length} item${items.length > 1 ? "s" : ""} to address`)}</p><ol className="notification-list">{items.map((item) => { const copy = copyFor(item, locale); return <li key={item.id}><Link href={item.href} className={`notification-item ${item.priority}`}><NotificationIcon type={item.type} /><div><strong>{copy.title}</strong><span>{copy.detail}</span></div></Link></li>; })}</ol></> : <div className="empty-state"><CheckCircle size={28}/><h2>{tr(locale, "Aucune notification", "No notifications")}</h2><p>{tr(locale, "Aucune action n’exige votre attention avec votre rôle actuel.", "No action requires your attention with your current role.")}</p></div>}
  </section>;
}
