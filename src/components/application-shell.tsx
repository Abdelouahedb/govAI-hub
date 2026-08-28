import Link from "next/link";
import Image from "next/image";
import { Bell, BookOpen } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/app/actions/auth";
import { getRoleLabel } from "@/lib/auth/roles";
import type { UserRole } from "@/generated/prisma/enums";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ApplicationNavigation, type NavigationItem } from "@/components/application-navigation";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n";

type ApplicationShellProps = {
  children: React.ReactNode;
  user: { name: string; role: UserRole; avatarDataUrl: string | null };
  notificationCount: number;
  locale: Locale;
};

function getNavigation(role: UserRole, notificationCount: number, locale: Locale): NavigationItem[] {
  const labels = {
    dashboard: tr(locale, "Vue d’ensemble", "Governance overview"),
    myWork: tr(locale, "Mon espace", "My work"),
    people: tr(locale, "Utilisateurs", "People"),
    register: tr(locale, "Enregistrer un système", "Register system"),
    registry: tr(locale, "Registre", "Registry"),
    reviewQueue: tr(locale, "File de révision", "Review queue"),
    decisionQueue: tr(locale, "File de décision", "Decision queue"),
  };

  const workItem = (label: string): NavigationItem => ({ href: "/", icon: "home", label });
  const registry: NavigationItem = { href: "/systems", icon: "systems", label: labels.registry };
  const dashboard: NavigationItem = { href: "/dashboard", icon: "dashboard", label: labels.dashboard };

  switch (role) {
    case "AI_SYSTEM_OWNER":
      return [workItem(labels.myWork), registry, { href: "/systems/new", icon: "register", label: labels.register, primary: true }];
    case "RISK_COMPLIANCE_AUDITOR":
      return [workItem(labels.reviewQueue), registry, dashboard];
    case "GOVERNANCE_APPROVER":
      return [workItem(labels.decisionQueue), registry, dashboard];
    case "ADMINISTRATOR":
      return [workItem(tr(locale, "Administration", "Administration")), registry, dashboard, { href: "/admin/users", icon: "users", label: tr(locale, "Gérer les utilisateurs", "User management") }];
    case "VIEWER":
      return [workItem(labels.myWork), registry, dashboard];
  }
}

export function ApplicationShell({ children, user, notificationCount, locale }: ApplicationShellProps) {
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const navigation = getNavigation(user.role, notificationCount, locale);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link href="/" className="app-brand" aria-label="GovAI Hub">
          <Image alt="" className="app-brand-image" height={64} priority src="/govai-hub-logo.png" width={160} />
        </Link>
        <ApplicationNavigation items={navigation} />
        <div className="app-account">
          {notificationCount > 0 && <Link href="/notifications" className="notification-link" aria-label={`${notificationCount} ${tr(locale, "éléments demandent votre attention", "items need attention")}`} title={`${notificationCount} ${tr(locale, "éléments demandent votre attention", "items need attention")}`}><Bell size={18} weight="fill" /><span>{notificationCount > 9 ? "9+" : notificationCount}</span></Link>}
          <Link href="/profile" className="app-account-profile" aria-label={`Open profile settings for ${user.name}`}>
            <span className="app-avatar">{user.avatarDataUrl ? <Image src={user.avatarDataUrl} alt="" width={32} height={32} unoptimized /> : initials}</span>
            <span><strong>{user.name}</strong><small>{getRoleLabel(user.role, locale)}</small></span>
          </Link>
          <LanguageSwitcher locale={locale} />
          <form action={logoutAction}><button type="submit">{tr(locale, "Déconnexion", "Sign out")}</button></form>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-brand">
            <Link href="/" aria-label="GovAI Hub">
              <Image alt="GovAI Hub" className="app-footer-logo" height={48} src="/govai-hub-logo.png" width={120} />
            </Link>
            <p>{tr(locale, "Espace de travail pour une gouvernance IA traçable et une décision humaine documentée.", "A workspace for traceable AI governance and documented human decisions.")}</p>
          </div>
          <nav className="app-footer-links" aria-label={tr(locale, "Navigation du pied de page", "Footer navigation")}>
            <h2>{tr(locale, "Espace de travail", "Workspace")}</h2>
            <Link href="/">{tr(locale, "Mon espace", "My work")}</Link>
            <Link href="/systems">{tr(locale, "Registre des systèmes", "System registry")}</Link>
            <Link href="/dashboard">{tr(locale, "Vue d’ensemble", "Governance overview")}</Link>
          </nav>
          <nav className="app-footer-links" aria-label={tr(locale, "Aide et compte", "Help and account")}>
            <h2>{tr(locale, "Aide et compte", "Help and account")}</h2>
            <Link href="/manual" className="app-footer-guide"><BookOpen size={17} aria-hidden="true" />{tr(locale, "Manuel d’utilisation", "User guide")}</Link>
            <Link href="/profile">{tr(locale, "Mon profil", "My profile")}</Link>
            <Link href="/notifications">{tr(locale, "Notifications", "Notifications")}</Link>
          </nav>
        </div>
        <div className="app-footer-meta">
          <p>© 2026 GovAI Hub</p>
        </div>
      </footer>
    </div>
  );
}
