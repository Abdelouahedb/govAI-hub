"use client";

import { useActionState } from "react";
import { createUserAction } from "@/app/actions/users";
import { getRoleLabel } from "@/lib/auth/roles";
import { UserRole } from "@/generated/prisma/enums";
import type { Locale } from "@/lib/i18n";

type UserCreateFormProps = {
  departments: Array<{ id: string; name: string; code: string }>;
  locale: Locale;
};

export function UserCreateForm({ departments, locale }: UserCreateFormProps) {
  const [state, action, pending] = useActionState(createUserAction, undefined);
  const t = (french: string, english: string) => locale === "fr" ? french : english;

  return (
    <form action={action} className="workspace-form">
      <div className="form-grid">
        <label>{t("Nom complet", "Full name")}<input name="name" required minLength={2} /></label>
        <label>{t("Adresse e-mail", "Email address")}<input name="email" type="email" required /></label>
        <label>{t("Rôle", "Role")}
          <select name="role" required defaultValue={UserRole.AI_SYSTEM_OWNER}>
            {Object.values(UserRole).map((role) => <option key={role} value={role}>{getRoleLabel(role, locale)}</option>)}
          </select>
        </label>
        <label>{t("Département", "Department")}
          <select name="departmentId" defaultValue="">
            <option value="">{t("Aucun département attribué", "No department assigned")}</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}
          </select>
        </label>
        <label className="form-wide">{t("Mot de passe initial", "Initial password")}<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
      </div>
      <p className="form-hint">{t("Définissez un mot de passe initial unique d’au moins 12 caractères et transmettez-le à la personne par un canal sécurisé.", "Set a unique initial password of at least 12 characters and share it with the account holder through a secure channel.")}</p>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      {state?.success && <p className="form-success" role="status">{state.success}</p>}
      <button className="primary-button" type="submit" disabled={pending}>{pending ? t("Création du compte…", "Creating account…") : t("Créer le compte utilisateur", "Create user account")}</button>
    </form>
  );
}
