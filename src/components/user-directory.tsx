"use client";

import { useActionState } from "react";
import { CaretDown, FloppyDisk, Key, UserCircle } from "@phosphor-icons/react";
import { resetUserPasswordAction, updateUserAction } from "@/app/actions/users";
import { getRoleLabel } from "@/lib/auth/roles";
import { UserRole } from "@/generated/prisma/enums";
import type { Locale } from "@/lib/i18n";

type Department = { id: string; name: string; code: string };
type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  departmentId: string | null;
  department: { name: string; code: string } | null;
  createdAt: Date;
};

export function UserDirectory({ departments, users, locale }: { departments: Department[]; users: DirectoryUser[]; locale: Locale }) {
  const activeUsers = users.filter((user) => user.active).length;
  const administrators = users.filter((user) => user.active && user.role === UserRole.ADMINISTRATOR).length;
  const t = (french: string, english: string) => locale === "fr" ? french : english;

  return (
    <section className="user-directory" aria-labelledby="directory-title">
      <div className="directory-summary">
        <div><span>{t("Comptes", "Accounts")}</span><strong>{users.length}</strong></div>
        <div><span>{t("Actifs", "Active")}</span><strong>{activeUsers}</strong></div>
        <div><span>{t("Administrateurs", "Administrators")}</span><strong>{administrators}</strong></div>
      </div>
      <div className="directory-heading"><div><h2 id="directory-title">{t("Annuaire des personnes", "People directory")}</h2><p>{t("Ouvrez une personne pour mettre à jour ses responsabilités ou son statut d’accès.", "Open a person to update their responsibilities or access status.")}</p></div><span>{t(`${users.length} compte${users.length === 1 ? "" : "s"}`, `${users.length} account${users.length === 1 ? "" : "s"}`)}</span></div>
      <div className="directory-list">
        {users.map((user) => <UserDirectoryRow key={user.id} departments={departments} user={user} locale={locale} />)}
      </div>
    </section>
  );
}

function UserDirectoryRow({ departments, user, locale }: { departments: Department[]; user: DirectoryUser; locale: Locale }) {
  const [state, action, pending] = useActionState(updateUserAction, undefined);
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const t = (french: string, english: string) => locale === "fr" ? french : english;

  return (
    <details className="directory-person">
      <summary>
        <span className="directory-avatar" aria-hidden="true">{initials || <UserCircle size={18} />}</span>
        <span className="directory-identity"><strong>{user.name}</strong><small>{user.email}</small></span>
        <span className="directory-assignment"><strong>{getRoleLabel(user.role, locale)}</strong><small>{user.department?.name ?? t("Aucun département", "No department")}</small></span>
        <span className={user.active ? "account-status active" : "account-status inactive"}>{user.active ? t("Actif", "Active") : t("Inactif", "Inactive")}</span>
        <CaretDown className="directory-caret" size={16} aria-hidden="true" />
      </summary>
      <form action={action} className="directory-editor">
        <input type="hidden" name="userId" value={user.id} />
        <label>{t("Nom complet", "Full name")}<input name="name" defaultValue={user.name} minLength={2} maxLength={100} autoComplete="name" required /></label>
        <label>{t("Adresse e-mail", "Email address")}<input name="email" type="email" defaultValue={user.email} autoComplete="email" required /></label>
        <label>{t("Rôle de gouvernance", "Governance role")}<select name="role" defaultValue={user.role}>{Object.values(UserRole).map((role) => <option key={role} value={role}>{getRoleLabel(role, locale)}</option>)}</select></label>
        <label>{t("Département", "Department")}<select name="departmentId" defaultValue={user.departmentId ?? ""}><option value="">{t("Aucun département attribué", "No department assigned")}</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label>
        <label className="access-switch"><input name="active" type="checkbox" value="true" defaultChecked={user.active} /><span><strong>{t("Accès au compte", "Account access")}</strong><small>{user.active ? t("Cette personne peut se connecter et recevoir des attributions.", "This person can sign in and receive assignments.") : t("Cette personne ne peut pas se connecter ni recevoir de nouvelles attributions.", "This person cannot sign in or receive new assignments.")}</small></span></label>
        <div className="directory-editor-footer"><p>{t("Créé le", "Created")} {new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en", { day: "numeric", month: "short", year: "numeric" }).format(user.createdAt)}</p><button className="primary-button" type="submit" disabled={pending}><FloppyDisk size={16} /> {pending ? t("Enregistrement…", "Saving…") : t("Enregistrer le compte", "Save account")}</button></div>
        {state?.error && <p className="form-error directory-message" role="alert">{state.error}</p>}
        {state?.success && <p className="form-success directory-message" role="status">{state.success}</p>}
      </form>
      <PasswordResetForm locale={locale} userId={user.id} />
    </details>
  );
}

function PasswordResetForm({ locale, userId }: { locale: Locale; userId: string }) {
  const [state, action, pending] = useActionState(resetUserPasswordAction, undefined);
  const t = (french: string, english: string) => locale === "fr" ? french : english;

  return <form action={action} className="directory-password-reset"><input name="userId" type="hidden" value={userId} /><div><h3>{t("Réinitialiser le mot de passe", "Reset password")}</h3><p>{t("Définissez un mot de passe temporaire, puis transmettez-le à la personne par un canal sécurisé.", "Set a temporary password, then share it with the account holder through a secure channel.")}</p></div><div className="directory-password-fields"><label>{t("Mot de passe temporaire", "Temporary password")}<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label><label>{t("Confirmer le mot de passe", "Confirm password")}<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label></div><div className="directory-password-footer"><span>{t("Au moins 12 caractères.", "At least 12 characters.")}</span><button className="secondary-button" disabled={pending} type="submit"><Key size={16} /> {pending ? t("Réinitialisation…", "Resetting…") : t("Enregistrer le mot de passe temporaire", "Save temporary password")}</button></div>{state?.error && <p className="form-error directory-message" role="alert">{state.error}</p>}{state?.success && <p className="form-success directory-message" role="status">{state.success}</p>}</form>;
}
