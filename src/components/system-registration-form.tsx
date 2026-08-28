"use client";

import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { createAiSystemAction } from "@/app/actions/systems";
import type { Locale } from "@/lib/i18n";

type FormValues = {
  name: string;
  description: string;
  purpose: string;
  intendedUsers: string;
  dataCategories: string;
  lifecycleStage: "IDEA" | "DEVELOPMENT" | "PILOT" | "PRODUCTION" | "RETIRED";
  autonomyLevel: "ASSISTIVE" | "HUMAN_IN_THE_LOOP" | "HUMAN_ON_THE_LOOP" | "AUTONOMOUS";
  departmentId: string;
  modelProvider: string;
  modelName: string;
  usesPersonalData: boolean;
  usesSensitiveData: boolean;
  hasMaterialImpact: boolean;
};

type SystemRegistrationFormProps = {
  departments: Array<{ id: string; name: string; code: string }>;
  defaultDepartmentId?: string | null;
  canChooseDepartment: boolean;
  locale: Locale;
};

const steps = ["System", "Data & impact", "Review"] as const;

function toFormData(values: FormValues) {
  const formData = new FormData();
  formData.set("name", values.name ?? "");
  formData.set("description", values.description ?? "");
  formData.set("purpose", values.purpose ?? "");
  formData.set("intendedUsers", values.intendedUsers ?? "");
  formData.set("dataCategories", values.dataCategories ?? "");
  formData.set("lifecycleStage", values.lifecycleStage);
  formData.set("autonomyLevel", values.autonomyLevel);
  formData.set("departmentId", values.departmentId ?? "");
  formData.set("modelProvider", values.modelProvider ?? "");
  formData.set("modelName", values.modelName ?? "");
  if (values.usesPersonalData) formData.set("usesPersonalData", "on");
  if (values.usesSensitiveData) formData.set("usesSensitiveData", "on");
  if (values.hasMaterialImpact) formData.set("hasMaterialImpact", "on");
  return formData;
}

export function SystemRegistrationForm({
  departments,
  defaultDepartmentId,
  canChooseDepartment,
  locale,
}: SystemRegistrationFormProps) {
  const fr = locale === "fr";
  const t = (french: string, english: string) => fr ? french : english;
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(createAiSystemAction, undefined);
  const { register, trigger, getValues, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      departmentId: defaultDepartmentId ?? "",
      lifecycleStage: "DEVELOPMENT",
      autonomyLevel: "HUMAN_IN_THE_LOOP",
    },
  });

  async function next() {
  const fields = step === 0
      ? ["name", "description", "purpose", "intendedUsers", "lifecycleStage", "autonomyLevel", "departmentId"] as const
      : ["dataCategories"] as const;
    if (await trigger(fields)) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <form
      className="workspace-form registration-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = toFormData(getValues());
        if (!(await trigger())) return;
        startTransition(() => action(formData));
      }}
      noValidate
    >
      <ol className="stepper" aria-label={t("Progression de l’enregistrement", "Registration progress")}>
        {steps.map((label, index) => <li key={label} className={index === step ? "active" : index < step ? "complete" : ""}>{index < step ? <CheckCircle size={17} weight="fill" /> : index + 1}<span>{index === 0 ? t("Système", "System") : index === 1 ? t("Données et impact", "Data & impact") : t("Vérification", "Review")}</span></li>)}
      </ol>

      {step === 0 && (
        <div className="form-grid">
          <label>{t("Nom du système", "System name")}<input {...register("name", { required: t("Saisissez le nom du système.", "Enter the system name."), minLength: 3 })} /><small>{errors.name?.message}</small></label>
          <label>{t("Étape du cycle de vie", "Lifecycle stage")}<select {...register("lifecycleStage")}><option value="IDEA">{t("Idée", "Idea")}</option><option value="DEVELOPMENT">{t("Développement", "Development")}</option><option value="PILOT">{t("Pilote", "Pilot")}</option><option value="PRODUCTION">{t("Production", "Production")}</option><option value="RETIRED">{t("Retiré", "Retired")}</option></select></label>
          <label>{t("Département", "Department")}<select {...register("departmentId", { required: t("Sélectionnez un département.", "Select a department.") })} disabled={!canChooseDepartment}><option value="">{t("Sélectionnez un département", "Select department")}</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select><small>{errors.departmentId?.message}</small></label>
          <label>{t("Niveau d’autonomie", "Autonomy level")}<select {...register("autonomyLevel")}><option value="ASSISTIVE">{t("Assistée", "Assistive")}</option><option value="HUMAN_IN_THE_LOOP">{t("Humain dans la boucle", "Human in the loop")}</option><option value="HUMAN_ON_THE_LOOP">{t("Humain superviseur", "Human on the loop")}</option><option value="AUTONOMOUS">{t("Autonome", "Autonomous")}</option></select></label>
          <label className="form-wide">{t("Objectif", "Purpose")}<textarea {...register("purpose", { required: t("Expliquez l’objectif.", "Explain the purpose."), minLength: 10 })} /><small>{errors.purpose?.message}</small></label>
          <label className="form-wide">{t("Description", "Description")}<textarea {...register("description", { required: t("Décrivez le système.", "Describe the system."), minLength: 20 })} /><small>{errors.description?.message}</small></label>
          <label className="form-wide">{t("Utilisateurs prévus", "Intended users")}<input {...register("intendedUsers", { required: t("Indiquez les utilisateurs prévus.", "Specify the intended users."), minLength: 3 })} /><small>{errors.intendedUsers?.message}</small></label>
        </div>
      )}

      {step === 1 && (
        <div className="form-grid">
          <label className="form-wide">{t("Catégories de données", "Data categories")}<textarea {...register("dataCategories", { required: t("Ajoutez au moins une catégorie de données.", "Add at least one data category.") })} placeholder={t("Un élément par ligne, par exemple :\nInformations de compte client\nConversations d’assistance", "One item per line, for example:\nCustomer account information\nSupport conversations")} /><small>{errors.dataCategories?.message}</small></label>
          <label>{t("Fournisseur du modèle", "Model provider")}<input {...register("modelProvider")} placeholder={t("Par exemple : modèle interne", "For example: Internal model")} /></label>
          <label>{t("Nom du modèle", "Model name")}<input {...register("modelName")} placeholder={t("Par exemple : DemandRank 1.0", "For example: DemandRank 1.0")} /></label>
          <fieldset className="form-wide checkbox-group"><legend>{t("Impact potentiel", "Potential impact")}</legend>
            <label><input type="checkbox" {...register("usesPersonalData")} /> {t("Traite des données personnelles", "Processes personal data")}</label>
            <label><input type="checkbox" {...register("usesSensitiveData")} /> {t("Traite des données sensibles", "Processes sensitive data")}</label>
            <label><input type="checkbox" {...register("hasMaterialImpact")} /> {t("Peut avoir un impact significatif sur les personnes", "May materially affect individuals")}</label>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="review-card">
          <h2>{t("Confirmer l’enregistrement", "Confirm registration")}</h2>
          <dl>
            <div><dt>{t("Nom", "Name")}</dt><dd>{getValues("name") || t("Non renseigné", "Not provided")}</dd></div>
            <div><dt>{t("Département", "Department")}</dt><dd>{departments.find((department) => department.id === getValues("departmentId"))?.name ?? t("Non renseigné", "Not provided")}</dd></div>
            <div><dt>{t("Cycle de vie", "Lifecycle")}</dt><dd>{{ IDEA: t("Idée", "Idea"), DEVELOPMENT: t("Développement", "Development"), PILOT: t("Pilote", "Pilot"), PRODUCTION: t("Production", "Production"), RETIRED: t("Retiré", "Retired") }[getValues("lifecycleStage")]}</dd></div>
            <div><dt>{t("Autonomie", "Autonomy")}</dt><dd>{{ ASSISTIVE: t("Assistée", "Assistive"), HUMAN_IN_THE_LOOP: t("Humain dans la boucle", "Human in the loop"), HUMAN_ON_THE_LOOP: t("Humain superviseur", "Human on the loop"), AUTONOMOUS: t("Autonome", "Autonomous") }[getValues("autonomyLevel")]}</dd></div>
          </dl>
          <p>{t("L’enregistrement crée un dossier brouillon et un événement d’audit. L’évaluation des risques et la revue de gouvernance interviennent aux étapes suivantes.", "Registration creates a Draft record and an audit event. Risk assessment and governance review happen in the next workflow steps.")}</p>
        </div>
      )}

      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="form-actions">
        {step > 0 && <button type="button" className="secondary-button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={17} /> {t("Retour", "Back")}</button>}
        {step < steps.length - 1 ? <button type="button" className="primary-button" onClick={next}>{t("Continuer", "Continue")} <ArrowRight size={17} /></button> : <button className="primary-button" type="submit" disabled={pending}>{pending ? t("Enregistrement…", "Registering…") : t("Créer le dossier système", "Create system record")}</button>}
      </div>
    </form>
  );
}
