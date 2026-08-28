INSERT INTO "Control" ("id", "code", "title", "description", "category", "evidenceGuidance", "active", "updatedAt")
VALUES
  ('control-security', 'SEC-01', 'Security safeguards', 'Define access restrictions, secure development practices, vulnerability testing, incident response, and remediation ownership.', 'Security', 'Access-control review, security test results, incident procedure, remediation record.', true, CURRENT_TIMESTAMP),
  ('control-monitoring', 'MON-01', 'Ongoing monitoring and escalation', 'Monitor performance, drift, misuse, incidents, and material changes with clear escalation responsibilities.', 'Monitoring', 'Monitoring plan, thresholds, review cadence, incident and escalation log.', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
