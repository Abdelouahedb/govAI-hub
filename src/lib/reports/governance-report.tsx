import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";

export type GovernanceReportData = {
  generatedAt: Date;
  totalSystems: number;
  pendingApprovals: number;
  overdueActions: number;
  openIncidents: number;
  lifecycle: Array<{ key: string; count: number }>;
  risk: Array<{ key: string; count: number }>;
  systems: Array<{
    referenceId: string;
    name: string;
    lifecycleStage: string;
    riskScore: number;
    riskLevel: string;
    status: string;
    updatedAt: Date;
    department: { name: string };
  }>;
  featuredIncident: {
    title: string;
    severity: string;
    status: string;
    occurredAt: Date;
    aiSystem: { name: string; referenceId: string };
  } | null;
};

type Locale = "fr" | "en";
type TranslationKey = keyof typeof copy.en;

const colors = {
  navy: "#0E1C2E",
  ink: "#1F2937",
  muted: "#66717D",
  blue: "#0861B9",
  cyan: "#1593B8",
  blueSoft: "#EAF3FC",
  line: "#D5DEE7",
  surface: "#F7F9FC",
  green: "#23784F",
  greenSoft: "#EAF7F0",
  amber: "#B86A0A",
  amberSoft: "#FFF5E5",
  red: "#AD2422",
  redSoft: "#FDEDEC",
  plum: "#551F59",
  white: "#FFFFFF",
};

const riskOrder = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
const lifecycleOrder = ["IDEA", "DEVELOPMENT", "PILOT", "PRODUCTION", "RETIRED"];

const riskColors: Record<string, string> = {
  LOW: colors.green,
  MODERATE: colors.amber,
  HIGH: "#D54C3F",
  CRITICAL: colors.plum,
};

const lifecycleColors: Record<string, string> = {
  IDEA: "#7593B2",
  DEVELOPMENT: colors.cyan,
  PILOT: colors.blue,
  PRODUCTION: colors.green,
  RETIRED: colors.muted,
};

const copy = {
  en: {
    reportTitle: "AI governance report",
    decisionBrief: "DECISION BRIEF",
    internalReport: "Internal governance report",
    issued: "Issued",
    scope: "Scope: active registry and current governance work",
    purposeTitle: "A decision-ready view of the AI portfolio.",
    purposeBody:
      "This report highlights the signals that need attention, summarizes portfolio exposure, and provides a traceable registry extract for human review.",
    systems: "SYSTEMS",
    systemsHint: "in the registry",
    review: "TO REVIEW",
    reviewHint: "decisions pending",
    overdue: "OVERDUE ACTIONS",
    overdueHint: "follow-up required",
    incidents: "OPEN INCIDENTS",
    incidentsHint: "active monitoring",
    decisionLens: "DECISION LENS",
    attentionClear: "No urgent governance signal is open in this snapshot.",
    attentionRequired: "governance signals require attention in this snapshot.",
    priority: "FIRST ITEM TO REVIEW",
    noIncident: "No open incident in the registry",
    noIncidentHint: "Confirm monitoring coverage during the next governance review.",
    affectedSystem: "Affected system",
    occurred: "occurred",
    portfolio: "PORTFOLIO READING",
    riskLevels: "Risk levels",
    lifecycle: "Lifecycle",
    useLimitation: "USE LIMITATION",
    limitation:
      "Internal report generated from GovAI Hub. It is not certification, legal advice, or an official regulatory assessment.",
    registryEyebrow: "REGISTRY EXTRACT",
    registryTitle: "Recently updated AI systems",
    registrySubtitle: "Latest records ordered by their most recent update.",
    reference: "Reference",
    system: "System",
    department: "Department",
    risk: "Risk",
    status: "Status",
    updated: "Updated",
    noSystems: "No AI system was registered when this report was generated.",
    generated: "Generated",
    reportId: "Snapshot",
    page: "Page",
    of: "of",
    internal: "GovAI Hub - Internal document",
    dataFreshness: "DATA FRESHNESS",
    liveSnapshot: "Point-in-time snapshot from the active governance registry",
  },
  fr: {
    reportTitle: "Rapport de gouvernance IA",
    decisionBrief: "SYNTHÈSE DÉCISIONNELLE",
    internalReport: "Rapport interne de gouvernance",
    issued: "Édité le",
    scope: "Périmètre : registre actif et travaux de gouvernance en cours",
    purposeTitle: "Une vue du portefeuille prête à la décision.",
    purposeBody:
      "Ce rapport met en évidence les signaux qui demandent une attention, résume l'exposition du portefeuille et fournit un extrait traçable du registre pour revue humaine.",
    systems: "SYSTÈMES",
    systemsHint: "dans le registre",
    review: "À REVOIR",
    reviewHint: "decisions attendues",
    overdue: "ACTIONS EN RETARD",
    overdueHint: "suivi requis",
    incidents: "INCIDENTS OUVERTS",
    incidentsHint: "surveillance active",
    decisionLens: "LECTURE DECISIONNELLE",
    attentionClear: "Aucun signal de gouvernance urgent n'est ouvert dans cet instantané.",
    attentionRequired: "signaux de gouvernance demandent une attention dans cet instantané.",
    priority: "PREMIER ÉLÉMENT À EXAMINER",
    noIncident: "Aucun incident ouvert dans le registre",
    noIncidentHint: "Confirmer la couverture de surveillance lors de la prochaine revue.",
    affectedSystem: "Système concerné",
    occurred: "survenu le",
    portfolio: "LECTURE DU PORTEFEUILLE",
    riskLevels: "Niveaux de risque",
    lifecycle: "Cycle de vie",
    useLimitation: "LIMITE D'UTILISATION",
    limitation:
      "Rapport interne généré depuis GovAI Hub. Il ne constitue ni une certification, ni un avis juridique, ni une évaluation réglementaire officielle.",
    registryEyebrow: "EXTRAIT DU REGISTRE",
    registryTitle: "Systèmes IA récemment mis à jour",
    registrySubtitle: "Derniers dossiers classés selon leur mise à jour la plus récente.",
    reference: "Référence",
    system: "Système",
    department: "Département",
    risk: "Risque",
    status: "Statut",
    updated: "Mis à jour",
    noSystems: "Aucun système IA n'était enregistré lors de la génération du rapport.",
    generated: "Généré",
    reportId: "Instantané",
    page: "Page",
    of: "sur",
    internal: "GovAI Hub - Document interne",
    dataFreshness: "FRAÎCHEUR DES DONNÉES",
    liveSnapshot: "Instantané du registre actif de gouvernance",
  },
} as const;

const enumLabels: Record<Locale, Record<string, string>> = {
  en: {
    LOW: "Low",
    MEDIUM: "Medium",
    MODERATE: "Moderate",
    HIGH: "High",
    CRITICAL: "Critical",
    IDEA: "Idea",
    DEVELOPMENT: "Development",
    PILOT: "Pilot",
    PRODUCTION: "Production",
    RETIRED: "Retired",
    DRAFT: "Draft",
    IN_REVIEW: "In review",
    ACTION_REQUIRED: "Action required",
    APPROVED: "Approved",
    CONDITIONALLY_APPROVED: "Conditionally approved",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
    OPEN: "Open",
    INVESTIGATING: "Investigating",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  },
  fr: {
    LOW: "Faible",
    MEDIUM: "Moyenne",
    MODERATE: "Modéré",
    HIGH: "Élevé",
    CRITICAL: "Critique",
    IDEA: "Idée",
    DEVELOPMENT: "Développement",
    PILOT: "Pilote",
    PRODUCTION: "Production",
    RETIRED: "Retiré",
    DRAFT: "Brouillon",
    IN_REVIEW: "En revue",
    ACTION_REQUIRED: "Action requise",
    APPROVED: "Approuvé",
    CONDITIONALLY_APPROVED: "Approuvé sous conditions",
    REJECTED: "Rejeté",
    SUSPENDED: "Suspendu",
    OPEN: "Ouvert",
    INVESTIGATING: "En investigation",
    RESOLVED: "Résolu",
    CLOSED: "Fermé",
  },
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingHorizontal: 44,
    paddingBottom: 58,
  },
  overviewPage: { paddingTop: 38 },
  registryPage: { paddingTop: 84 },
  runningHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    paddingHorizontal: 44,
    backgroundColor: colors.navy,
    color: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  runningBrand: { flexDirection: "row", alignItems: "center" },
  runningMarkBox: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  runningMark: { width: 26, height: 26 },
  runningBrandName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  runningTitle: { color: "#DDEBFA", fontSize: 8 },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 22,
    borderTopWidth: 0.7,
    borderTopColor: colors.line,
    paddingTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.muted,
    fontSize: 7,
  },
  footerLeft: { width: "75%" },
  footerPage: { width: "25%", textAlign: "right" },
  coverTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 145, height: 48, objectFit: "contain" },
  snapshotPill: {
    backgroundColor: colors.blueSoft,
    borderRadius: 12,
    color: colors.blue,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  hero: { marginTop: 24, flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: colors.line, paddingBottom: 23 },
  heroLeft: { width: "49%", paddingRight: 22 },
  heroRight: { width: "51%", paddingLeft: 22, paddingTop: 25 },
  eyebrow: { color: colors.blue, fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 1.2 },
  heroTitle: { color: colors.navy, fontFamily: "Times-Bold", fontSize: 29, lineHeight: 1.05, marginTop: 11 },
  meta: { color: colors.muted, fontSize: 8, marginTop: 13, lineHeight: 1.45 },
  purposeTitle: { color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 12, lineHeight: 1.3 },
  purposeBody: { color: colors.muted, fontSize: 9, lineHeight: 1.52, marginTop: 8 },
  metrics: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  metric: { width: "23.5%", height: 76, backgroundColor: colors.surface, borderRadius: 4, padding: 11, borderTopWidth: 3 },
  metricLabel: { color: colors.muted, fontFamily: "Helvetica-Bold", fontSize: 6.5, letterSpacing: 0.45 },
  metricValue: { color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 23, marginTop: 7 },
  metricHint: { color: colors.muted, fontSize: 6.8, marginTop: 2 },
  section: { marginTop: 18 },
  sectionLabel: { color: colors.blue, fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 1 },
  sectionRule: { borderTopWidth: 0.7, borderTopColor: colors.line, marginTop: 6, marginBottom: 10 },
  decisionLens: { flexDirection: "row", alignItems: "center", backgroundColor: colors.navy, borderRadius: 5, padding: 12 },
  decisionNumber: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 20, width: 35 },
  decisionText: { color: "#E6EEF7", fontSize: 9, lineHeight: 1.4, flex: 1 },
  incident: { flexDirection: "row", alignItems: "center", borderRadius: 5, padding: 12 },
  incidentDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  incidentBody: { flex: 1 },
  incidentTitle: { color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  incidentMeta: { fontFamily: "Helvetica-Bold", fontSize: 7.5, marginTop: 5 },
  incidentDetail: { color: colors.muted, fontSize: 7.5, marginTop: 4 },
  distributions: { flexDirection: "row", justifyContent: "space-between" },
  distribution: { width: "47%" },
  distributionTitle: { color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 7 },
  barRow: { flexDirection: "row", alignItems: "center", height: 17 },
  barLabel: { width: 76, color: colors.ink, fontSize: 7 },
  barTrack: { flex: 1, height: 7, backgroundColor: "#E8EDF2", borderRadius: 3.5, overflow: "hidden" },
  barFill: { height: 7, borderRadius: 3.5 },
  barCount: { width: 20, textAlign: "right", color: colors.ink, fontFamily: "Helvetica-Bold", fontSize: 7 },
  limitation: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 4, padding: 10, marginTop: 16 },
  limitationLabel: { color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 7, width: 92 },
  limitationText: { color: colors.muted, fontSize: 7, lineHeight: 1.35, flex: 1 },
  registryHeading: { marginBottom: 17 },
  registryTitle: { color: colors.navy, fontFamily: "Times-Bold", fontSize: 22, marginTop: 8 },
  registrySubtitle: { color: colors.muted, fontSize: 8, marginTop: 7 },
  freshness: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.blueSoft, borderRadius: 4, padding: 10, marginBottom: 15 },
  freshnessLabel: { color: colors.blue, fontFamily: "Helvetica-Bold", fontSize: 7 },
  freshnessText: { color: colors.ink, fontSize: 7 },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", backgroundColor: colors.navy, color: colors.white, paddingVertical: 8, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", minHeight: 38, borderBottomWidth: 0.6, borderBottomColor: colors.line, paddingVertical: 8, paddingHorizontal: 6, alignItems: "center" },
  tableRowAlt: { backgroundColor: colors.surface },
  cellReference: { width: "13%" },
  cellSystem: { width: "27%", paddingRight: 6 },
  cellDepartment: { width: "18%", paddingRight: 6 },
  cellRisk: { width: "14%" },
  cellStatus: { width: "16%", paddingRight: 4 },
  cellUpdated: { width: "12%", textAlign: "right" },
  tableHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 6.5 },
  primaryCell: { color: colors.ink, fontFamily: "Helvetica-Bold", fontSize: 7.2 },
  bodyCell: { color: colors.ink, fontSize: 7.2, lineHeight: 1.25 },
  secondaryCell: { color: colors.muted, fontSize: 6.5, marginTop: 3 },
  riskBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 6.3 },
  emptyState: { backgroundColor: colors.surface, borderRadius: 4, color: colors.muted, fontSize: 9, padding: 18 },
});

function translate(locale: Locale, key: TranslationKey) {
  return copy[locale][key];
}

function enumLabel(locale: Locale, value: string) {
  return enumLabels[locale][value] ?? value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (character) => character.toUpperCase());
}

function formatDate(locale: Locale, value: Date, includeTime = false) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: includeTime ? "long" : "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  }).format(value);
}

function snapshotId(value: Date) {
  const compact = value.toISOString().replace(/[-:]/g, "").slice(0, 13);
  return `GOV-${compact}`;
}

function normalizeDistribution(items: Array<{ key: string; count: number }>, order: string[]) {
  const counts = new Map(items.map((item) => [item.key, item.count]));
  return order.map((key) => ({ key, count: counts.get(key) ?? 0 }));
}

function Footer({ locale, generatedAt }: { locale: Locale; generatedAt: Date }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>{translate(locale, "internal")} - {snapshotId(generatedAt)}</Text>
      <Text style={styles.footerPage} fixed render={({ pageNumber, totalPages }) => `${translate(locale, "page")} ${pageNumber} ${translate(locale, "of")} ${totalPages}`} />
    </View>
  );
}

function RunningHeader({ locale, mark }: { locale: Locale; mark: Buffer }) {
  return (
    <View style={styles.runningHeader} fixed>
      <View style={styles.runningBrand}>
        <View style={styles.runningMarkBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not expose an HTML alt prop */}
          <Image src={mark} style={styles.runningMark} />
        </View>
        <Text style={styles.runningBrandName}>GovAI Hub</Text>
      </View>
      <Text style={styles.runningTitle}>{translate(locale, "internalReport")}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>{children}</Text>
      <View style={styles.sectionRule} />
    </View>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return (
    <View style={[styles.metric, { borderTopColor: tone }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

function Distribution({ locale, title, items, toneByKey }: { locale: Locale; title: string; items: Array<{ key: string; count: number }>; toneByKey: Record<string, string> }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <View style={styles.distribution}>
      <Text style={styles.distributionTitle}>{title}</Text>
      {items.map((item) => (
        <View style={styles.barRow} key={item.key}>
          <Text style={styles.barLabel}>{enumLabel(locale, item.key)}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.max(item.count > 0 ? 6 : 0, (item.count / max) * 100)}%`, backgroundColor: toneByKey[item.key] ?? colors.blue }]} />
          </View>
          <Text style={styles.barCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  );
}

function OverviewPage({ data, locale, logo }: { data: GovernanceReportData; locale: Locale; logo: Buffer }) {
  const attentionCount = data.pendingApprovals + data.overdueActions + data.openIncidents;
  const incident = data.featuredIncident;
  const incidentTone = incident ? riskColors[incident.severity] ?? colors.red : colors.green;
  return (
    <Page size="A4" style={[styles.page, styles.overviewPage]}>
      <View style={styles.coverTop}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not expose an HTML alt prop */}
        <Image src={logo} style={styles.logo} />
        <Text style={styles.snapshotPill}>{translate(locale, "reportId")} {snapshotId(data.generatedAt)}</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.eyebrow}>{translate(locale, "decisionBrief")}</Text>
          <Text style={styles.heroTitle} hyphenationCallback={(word) => [word]}>{translate(locale, "reportTitle")}</Text>
          <Text style={styles.meta}>{translate(locale, "issued")} {formatDate(locale, data.generatedAt, true)}{"\n"}{translate(locale, "scope")}</Text>
        </View>
        <View style={styles.heroRight}>
          <Text style={styles.purposeTitle}>{translate(locale, "purposeTitle")}</Text>
          <Text style={styles.purposeBody}>{translate(locale, "purposeBody")}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricCard label={translate(locale, "systems")} value={data.totalSystems} hint={translate(locale, "systemsHint")} tone={colors.blue} />
        <MetricCard label={translate(locale, "review")} value={data.pendingApprovals} hint={translate(locale, "reviewHint")} tone={colors.amber} />
        <MetricCard label={translate(locale, "overdue")} value={data.overdueActions} hint={translate(locale, "overdueHint")} tone={data.overdueActions > 0 ? colors.red : colors.green} />
        <MetricCard label={translate(locale, "incidents")} value={data.openIncidents} hint={translate(locale, "incidentsHint")} tone={data.openIncidents > 0 ? colors.red : colors.green} />
      </View>

      <View style={styles.section}>
        <SectionLabel>{translate(locale, "decisionLens")}</SectionLabel>
        <View style={styles.decisionLens}>
          {attentionCount > 0 && <Text style={styles.decisionNumber}>{attentionCount}</Text>}
          <Text style={styles.decisionText}>{attentionCount > 0 ? translate(locale, "attentionRequired") : translate(locale, "attentionClear")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>{translate(locale, "priority")}</SectionLabel>
        <View style={[styles.incident, { backgroundColor: incident ? colors.redSoft : colors.greenSoft }]}>
          <View style={[styles.incidentDot, { backgroundColor: incidentTone }]} />
          <View style={styles.incidentBody}>
            <Text style={styles.incidentTitle}>{incident?.title ?? translate(locale, "noIncident")}</Text>
            {incident ? (
              <>
                <Text style={[styles.incidentMeta, { color: incidentTone }]}>{enumLabel(locale, incident.severity)} - {enumLabel(locale, incident.status)} - {incident.aiSystem.referenceId}</Text>
                <Text style={styles.incidentDetail}>{translate(locale, "affectedSystem")}: {incident.aiSystem.name} - {translate(locale, "occurred")} {formatDate(locale, incident.occurredAt)}</Text>
              </>
            ) : <Text style={styles.incidentDetail}>{translate(locale, "noIncidentHint")}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>{translate(locale, "portfolio")}</SectionLabel>
        <View style={styles.distributions}>
          <Distribution locale={locale} title={translate(locale, "riskLevels")} items={normalizeDistribution(data.risk, riskOrder)} toneByKey={riskColors} />
          <Distribution locale={locale} title={translate(locale, "lifecycle")} items={normalizeDistribution(data.lifecycle, lifecycleOrder)} toneByKey={lifecycleColors} />
        </View>
      </View>

      <View style={styles.limitation}>
        <Text style={styles.limitationLabel}>{translate(locale, "useLimitation")}</Text>
        <Text style={styles.limitationText}>{translate(locale, "limitation")}</Text>
      </View>
      <Footer locale={locale} generatedAt={data.generatedAt} />
    </Page>
  );
}

function RegistryPage({ data, locale, mark }: { data: GovernanceReportData; locale: Locale; mark: Buffer }) {
  return (
    <Page size="A4" style={[styles.page, styles.registryPage]} wrap={false}>
      <RunningHeader locale={locale} mark={mark} />
      <View style={styles.registryHeading}>
        <Text style={styles.eyebrow}>{translate(locale, "registryEyebrow")}</Text>
        <Text style={styles.registryTitle}>{translate(locale, "registryTitle")}</Text>
        <Text style={styles.registrySubtitle}>{translate(locale, "registrySubtitle")}</Text>
      </View>
      <View style={styles.freshness}>
        <Text style={styles.freshnessLabel}>{translate(locale, "dataFreshness")}</Text>
        <Text style={styles.freshnessText}>{translate(locale, "liveSnapshot")} - {formatDate(locale, data.generatedAt, true)}</Text>
      </View>
      {data.systems.length ? (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cellReference]}>{translate(locale, "reference")}</Text>
            <Text style={[styles.tableHeaderText, styles.cellSystem]}>{translate(locale, "system")}</Text>
            <Text style={[styles.tableHeaderText, styles.cellDepartment]}>{translate(locale, "department")}</Text>
            <Text style={[styles.tableHeaderText, styles.cellRisk]}>{translate(locale, "risk")}</Text>
            <Text style={[styles.tableHeaderText, styles.cellStatus]}>{translate(locale, "status")}</Text>
            <Text style={[styles.tableHeaderText, styles.cellUpdated]}>{translate(locale, "updated")}</Text>
          </View>
          {data.systems.map((system, index) => (
            <View key={system.referenceId} style={[styles.tableRow, ...(index % 2 ? [styles.tableRowAlt] : [])]} wrap={false}>
              <Text style={[styles.primaryCell, styles.cellReference]}>{system.referenceId}</Text>
              <View style={styles.cellSystem}><Text style={styles.primaryCell}>{system.name}</Text></View>
              <Text style={[styles.bodyCell, styles.cellDepartment]}>{system.department.name}</Text>
              <View style={styles.cellRisk}>
                <Text style={[styles.riskBadge, { backgroundColor: riskColors[system.riskLevel] ?? colors.blue }]}>{system.riskScore}/100</Text>
                <Text style={styles.secondaryCell}>{enumLabel(locale, system.riskLevel)}</Text>
              </View>
              <View style={styles.cellStatus}>
                <Text style={styles.bodyCell}>{enumLabel(locale, system.status)}</Text>
                <Text style={styles.secondaryCell}>{enumLabel(locale, system.lifecycleStage)}</Text>
              </View>
              <Text style={[styles.bodyCell, styles.cellUpdated]}>{formatDate(locale, system.updatedAt)}</Text>
            </View>
          ))}
        </View>
      ) : <Text style={styles.emptyState}>{translate(locale, "noSystems")}</Text>}
      <Footer locale={locale} generatedAt={data.generatedAt} />
    </Page>
  );
}

function GovernanceReport({ data, locale, logo, mark }: { data: GovernanceReportData; locale: Locale; logo: Buffer; mark: Buffer }) {
  return (
    <Document
      title={translate(locale, "reportTitle")}
      author="GovAI Hub"
      subject={locale === "fr" ? "Synthese de gouvernance interne" : "Internal governance summary"}
      creator="GovAI Hub"
      language={locale}
    >
      <OverviewPage data={data} locale={locale} logo={logo} />
      <RegistryPage data={data} locale={locale} mark={mark} />
    </Document>
  );
}

export async function createGovernanceReport(data: GovernanceReportData, locale: Locale) {
  const [logo, mark] = await Promise.all([
    readFile(join(process.cwd(), "public", "govai-hub-report-logo.png")),
    readFile(join(process.cwd(), "public", "govai-hub-report-mark.png")),
  ]);
  return renderToBuffer(<GovernanceReport data={data} locale={locale} logo={logo} mark={mark} /> as React.ReactElement<DocumentProps>);
}
