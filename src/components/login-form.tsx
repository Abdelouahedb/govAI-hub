"use client";

import { useActionState, useState } from "react";
import { ArrowRight, LockKey, ShieldCheck } from "@phosphor-icons/react";
import { loginAction } from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

export function LoginForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showRecovery, setShowRecovery] = useState(false);
  const isFrench = locale === "fr";
  return <form action={action} className="login-form"><div className="login-field"><label htmlFor="email">{isFrench ? "Adresse e-mail" : "Email"}</label><input id="email" name="email" type="email" autoComplete="username" defaultValue={state?.fields?.email} required /></div><div className="login-field"><div className="login-password-label"><label htmlFor="password">{isFrench ? "Mot de passe" : "Password"}</label><button aria-controls="login-recovery-note" aria-expanded={showRecovery} className="login-recovery-trigger" onClick={() => setShowRecovery((visible) => !visible)} type="button">{isFrench ? "Mot de passe oublié ?" : "Forgot password?"}</button></div><div className="password-input"><LockKey size={18} aria-hidden="true" /><input id="password" name="password" type="password" autoComplete="current-password" required /></div>{showRecovery && <p className="login-recovery-note" id="login-recovery-note" role="status">{isFrench ? "Les réinitialisations de mot de passe sont gérées par l’administrateur de votre espace de travail. Contactez-le pour rétablir votre accès." : "Password resets are managed by your workspace administrator. Contact them to restore access."}</p>}</div>{state?.error && <p className="login-error" role="alert">{state.error}</p>}<button className="login-submit" type="submit" disabled={pending}><ShieldCheck size={19} weight="bold" />{pending ? (isFrench ? "Vérification du compte…" : "Verifying account…") : (isFrench ? "Se connecter" : "Sign in")}{!pending && <ArrowRight size={18} />}</button></form>;
}
