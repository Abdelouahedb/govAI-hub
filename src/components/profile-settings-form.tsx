"use client";

import Image from "next/image";
import { type ChangeEvent, useActionState, useState } from "react";
import { Camera, Key, UserCircle } from "@phosphor-icons/react";
import {
  changePasswordAction,
  updateProfileAvatarAction,
  updateProfileNameAction,
} from "@/app/actions/profile";
import type { Locale } from "@/lib/i18n";

const MAX_AVATAR_BYTES = 512 * 1024;

type ProfileSettingsFormProps = {
  name: string;
  email: string;
  role: string;
  avatarDataUrl: string | null;
  locale: Locale;
};

function Avatar({ name, avatarDataUrl }: Pick<ProfileSettingsFormProps, "name" | "avatarDataUrl">) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <span className="profile-avatar-preview">{avatarDataUrl ? <Image src={avatarDataUrl} alt="" width={92} height={92} unoptimized /> : initials}</span>;
}

export function ProfileSettingsForm({ name, email, role, avatarDataUrl: initialAvatarDataUrl, locale }: ProfileSettingsFormProps) {
  const [nameState, nameAction, namePending] = useActionState(updateProfileNameAction, undefined);
  const [avatarState, avatarAction, avatarPending] = useActionState(updateProfileAvatarAction, undefined);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, undefined);
  const [displayName, setDisplayName] = useState(name);
  const [avatarDataUrl, setAvatarDataUrl] = useState(initialAvatarDataUrl);
  const [avatarError, setAvatarError] = useState<string>();
  const t = (french: string, english: string) => locale === "fr" ? french : english;

  async function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setAvatarError(undefined);

    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setAvatarError(t("Choisissez une image PNG, JPEG ou WebP.", "Choose a PNG, JPEG, or WebP image."));
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("Choisissez une image de moins de 512 Ko.", "Choose an image smaller than 512 KB."));
      event.target.value = "";
      return;
    }

    try {
      setAvatarDataUrl(await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("The image could not be read."));
        reader.readAsDataURL(file);
      }));
    } catch {
      setAvatarError(t("L’image n’a pas pu être lue. Choisissez un autre fichier.", "The image could not be read. Choose a different file."));
    }
  }

  return (
    <div className="profile-settings">
      <section className="profile-section" aria-labelledby="profile-identity-heading">
        <div className="profile-section-heading"><UserCircle size={22} /><div><h2 id="profile-identity-heading">{t("Identité", "Identity")}</h2><p>{t("Utilisez le nom que vos collègues voient dans les dossiers de gouvernance.", "Use the name colleagues see in governance records.")}</p></div></div>
        <form action={nameAction} className="profile-form">
          <label>{t("Nom complet", "Full name")}<input name="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required /></label>
          <label>{t("Adresse e-mail", "Email address")}<input value={email} readOnly aria-readonly="true" /></label>
          <label>{t("Rôle", "Role")}<input value={role} readOnly aria-readonly="true" /></label>
          <div className="profile-form-footer"><p className="form-hint">{t("Votre adresse e-mail et votre rôle sont gérés par un administrateur.", "Your email and role are managed by an administrator.")}</p><button className="primary-button" type="submit" disabled={namePending}>{namePending ? t("Enregistrement…", "Saving…") : t("Enregistrer le nom", "Save name")}</button></div>
          <FormMessage state={nameState} />
        </form>
      </section>

      <section className="profile-section" aria-labelledby="profile-photo-heading">
        <div className="profile-section-heading"><Camera size={22} /><div><h2 id="profile-photo-heading">{t("Photo de profil", "Profile photo")}</h2><p>{t("Ajoutez une photo pour que les personnes puissent identifier qui est responsable d’un dossier.", "Add a photo so people can identify who owns a record.")}</p></div></div>
        <form action={avatarAction} className="profile-photo-form">
          <Avatar name={name} avatarDataUrl={avatarDataUrl} />
          <div className="profile-photo-controls">
            <label className="file-picker"><span>{t("Choisir une photo", "Choose photo")}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectAvatar} /></label>
            <input type="hidden" name="avatarDataUrl" value={avatarDataUrl ?? ""} />
            <p className="form-hint">{t("PNG, JPEG ou WebP. Taille maximale : 512 Ko.", "PNG, JPEG, or WebP. Maximum file size: 512 KB.")}</p>
            {avatarError && <p className="form-error" role="alert">{avatarError}</p>}
            <div className="profile-photo-actions"><button className="primary-button" type="submit" disabled={avatarPending || Boolean(avatarError) || !avatarDataUrl}>{avatarPending ? t("Enregistrement…", "Saving…") : t("Enregistrer la photo", "Save photo")}</button>{(initialAvatarDataUrl || avatarDataUrl) && <button className="secondary-button" type="submit" name="removeAvatar" value="true" onClick={() => setAvatarDataUrl(null)} disabled={avatarPending}>{t("Supprimer la photo", "Remove photo")}</button>}</div>
            <FormMessage state={avatarState} />
          </div>
        </form>
      </section>

      <section className="profile-section" aria-labelledby="profile-password-heading">
        <div className="profile-section-heading"><Key size={22} /><div><h2 id="profile-password-heading">{t("Mot de passe", "Password")}</h2><p>{t("Utilisez un mot de passe unique d’au moins 12 caractères.", "Use a unique password of at least 12 characters.")}</p></div></div>
        <form action={passwordAction} className="profile-form profile-password-form">
          <label>{t("Mot de passe actuel", "Current password")}<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>{t("Nouveau mot de passe", "New password")}<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
          <label>{t("Confirmer le nouveau mot de passe", "Confirm new password")}<input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></label>
          <div className="profile-form-footer"><p className="form-hint">{t("La modification du mot de passe ne vous déconnecte pas de cet appareil.", "Changing your password does not sign you out of this device.")}</p><button className="primary-button" type="submit" disabled={passwordPending}>{passwordPending ? t("Mise à jour…", "Updating…") : t("Modifier le mot de passe", "Change password")}</button></div>
          <FormMessage state={passwordState} />
        </form>
      </section>
    </div>
  );
}

function FormMessage({ state }: { state: { error?: string; success?: string } | undefined }) {
  if (state?.error) return <p className="form-error" role="alert">{state.error}</p>;
  if (state?.success) return <p className="form-success" role="status">{state.success}</p>;
  return null;
}
