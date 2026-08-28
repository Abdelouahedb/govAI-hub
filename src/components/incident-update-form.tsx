import { updateIncidentAction } from "@/app/actions/incidents";

export function IncidentUpdateForm({ incident }: { incident: { id: string; status: string; resolutionNote: string | null } }) {
  return (
    <form action={updateIncidentAction} className="action-update-form incident-form">
      <input type="hidden" name="incidentId" value={incident.id} />
      <label><span>Statut</span><select name="status" defaultValue={incident.status}><option value="OPEN">Ouvert</option><option value="INVESTIGATING">En investigation</option><option value="RESOLVED">Résolu</option><option value="CLOSED">Clôturé</option></select></label>
      <label><span>Note de suivi ou de résolution</span><textarea name="resolutionNote" defaultValue={incident.resolutionNote ?? ""} placeholder="Mesures prises, analyse, décision et preuve de résolution." /></label>
      <button className="secondary-button" type="submit">Mettre à jour l’incident</button>
    </form>
  );
}
