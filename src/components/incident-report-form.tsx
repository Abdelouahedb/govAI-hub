import { reportIncidentAction } from "@/app/actions/incidents";

export function IncidentReportForm({ aiSystemId }: { aiSystemId: string }) {
  return (
    <form action={reportIncidentAction} className="action-update-form incident-form">
      <input type="hidden" name="aiSystemId" value={aiSystemId} />
      <label><span>Titre</span><input name="title" required minLength={5} placeholder="Ex. Recommandation potentiellement biaisée" /></label>
      <label><span>Gravité</span><select name="severity" defaultValue="MEDIUM"><option value="LOW">Faible</option><option value="MEDIUM">Moyenne</option><option value="HIGH">Élevée</option><option value="CRITICAL">Critique</option></select></label>
      <label><span>Date et heure de survenue</span><input name="occurredAt" type="datetime-local" required /></label>
      <label><span>Description</span><textarea name="description" required minLength={20} placeholder="Décrivez les faits, les personnes potentiellement touchées et la première mesure prise." /></label>
      <button className="secondary-button" type="submit">Déclarer l’incident</button>
    </form>
  );
}
