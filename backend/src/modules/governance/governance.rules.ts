/**
 * Governance Service — India DPDP compliance starter rules
 *
 * Legal references:
 * - Digital Personal Data Protection Act, 2023
 * - Digital Personal Data Protection Rules, 2025
 * - Other applicable laws, where relevant
 *
 * IMPORTANT:
 * PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED are
 * organization-defined security classifications, not DPDP labels.
 *
 * Review commencement dates and applicable legal requirements
 * before enabling enforcement in production.
 */

export type Classification =
  | "RESTRICTED"
  | "CONFIDENTIAL"
  | "INTERNAL"
  | "PUBLIC";

export type ClassificationRule = {
  classification: Classification;
  reason: string;
  legalReferences: string[];
  controls: string[];
};

export type RetentionRule = {
  retentionMonths: number | null;
  retentionDays?: number | null;
  statutoryLaw: string[];
  triggerEvent: string;
  description: string;
  requiresLegalReview: boolean;
};

export type GovernanceRule = {
  legalReferences: string[];
  requirement: string;
  controls: string[];
  enabled: boolean;
};

// 1. CLASSIFICATION POLICIES
// Security labels selected by the organization.

export const CLASSIFICATION_RULES: Record<string, ClassificationRule> = {
  AADHAAR: {
    classification: "RESTRICTED",
    reason:
      "Highly sensitive identity information; apply appropriate safeguards.",
    legalReferences: [
      "DPDP Act Section 8(5)",
      "Aadhaar Act, 2016, where applicable",
    ],
    controls: [
      "Restrict access to authorized personnel",
      "Mask Aadhaar numbers in displays and logs",
      "Encrypt stored and transmitted data",
    ],
  },

  HEALTH_DATA: {
    classification: "RESTRICTED",
    reason:
      "Medical information can cause significant harm if disclosed.",
    legalReferences: [
      "DPDP Act Section 8(5)",
      "Applicable healthcare laws and professional rules",
    ],
    controls: [
      "Role-based access control",
      "Encryption and access logging",
      "Review applicable medical-record retention requirements",
    ],
  },

  PAN: {
    classification: "CONFIDENTIAL",
    reason:
      "Personal tax identifier requiring appropriate protection.",
    legalReferences: [
      "DPDP Act Section 8(5)",
      "Applicable Income-tax legislation",
    ],
    controls: [
      "Mask PAN in user interfaces",
      "Restrict access",
      "Prevent unnecessary disclosure",
    ],
  },

  PHONE_NUMBER: {
    classification: "CONFIDENTIAL",
    reason: "Personal contact information.",
    legalReferences: ["DPDP Act Sections 4, 5, 6 and 8"],
    controls: [
      "Collect for a specified purpose",
      "Limit access",
      "Support applicable correction and erasure requests",
    ],
  },

  EMAIL: {
    classification: "CONFIDENTIAL",
    reason: "Personal contact information.",
    legalReferences: ["DPDP Act Sections 4, 5, 6 and 8"],
    controls: [
      "Collect for a specified purpose",
      "Limit access",
      "Protect against unauthorized disclosure",
    ],
  },

  FULL_NAME: {
    classification: "CONFIDENTIAL",
    reason: "Personal identifier of data subject.",
    legalReferences: ["DPDP Act Section 4"],
    controls: [
      "Collect for specified purpose",
      "Restrict broad public indexing",
    ],
  },

  PATIENT_IDENTITY: {
    classification: "RESTRICTED",
    reason: "Patient clinical identity linked to medical records.",
    legalReferences: ["DPDP Act Section 8(5)", "Healthcare Regulations"],
    controls: [
      "Strict role-based access",
      "Secure patient pseudonymization",
    ],
  },

  EMPLOYEE_ID: {
    classification: "INTERNAL",
    reason:
      "Organizational identifier; classification depends on context.",
    legalReferences: ["DPDP Act Section 8, where personal data is involved"],
    controls: [
      "Restrict administrative access",
      "Avoid exposing unnecessary employee information",
    ],
  },

  PUBLIC_CONTENT: {
    classification: "PUBLIC",
    reason:
      "Information explicitly approved for public disclosure.",
    legalReferences: ["Organization's approved disclosure policy"],
    controls: [
      "Obtain approval before publication",
      "Check for embedded personal or confidential information",
    ],
  },

  CHILDREN_DATA: {
    classification: "RESTRICTED",
    reason:
      "Personal data belonging to an individual under 18 years of age. Section 9 mandates Verifiable Parental Consent, prohibits tracking/profiling, and bans harmful processing.",
    legalReferences: [
      "DPDP Act, 2023, Section 9(1) - Verifiable Parental Consent requirement",
      "DPDP Act, 2023, Section 9(2) - Prohibition on processing detrimental to well-being",
      "DPDP Act, 2023, Section 9(3) - Absolute ban on behavioral tracking and targeted advertising",
      "DPDP Act, 2023, Section 33 Schedule - Fine up to ₹200 Crore for breach of Section 9",
    ],
    controls: [
      "Mandatory Verifiable Parental Consent (VPC) before collection",
      "Strict prohibition on behavioral tracking, monitoring, or profiling",
      "Strict prohibition on targeted advertising directed at children",
      "Age-assurance checks prior to processing",
      "Prompt erasure upon request by parent or legal guardian",
    ],
  },

  PARENT_GUARDIAN_CONTACT: {
    classification: "CONFIDENTIAL",
    reason:
      "Contact and identity information of parent or legal guardian executing Section 9 consent.",
    legalReferences: ["DPDP Act, 2023, Section 9(1)"],
    controls: [
      "Link with minor child profile only for verifiable consent verification",
      "Restrict access to authorized compliance personnel",
      "Support parental revocation of consent",
    ],
  },

  CHILD_HEALTH_DATA: {
    classification: "RESTRICTED",
    reason:
      "Pediatric and health records of a minor child requiring heightened security and guardian consent.",
    legalReferences: [
      "DPDP Act, 2023, Section 9",
      "DPDP Act, 2023, Section 8(5)",
      "Digital Personal Data Protection Act, 2023, Section 33 Schedule",
    ],
    controls: [
      "Parental verification for all clinical access",
      "Restricted end-to-end encryption",
      "Prohibition on commercial profiling or research without verified statutory consent",
    ],
  },
};


// 2. RETENTION SCHEDULES
// Null means no fixed duration is configured.
// It does NOT mean data can be kept forever.

export const RETENTION_RULES: Record<string, RetentionRule> = {
  FINANCE_BILLING: {
    retentionMonths: 72,
    retentionDays: 72 * 30, // 2160 days
    statutoryLaw: [
      "CGST Act, 2017, Section 36, where applicable",
    ],
    triggerEvent: "ANNUAL_RETURN_DUE_DATE",
    description:
      "GST accounts and records generally must be retained " +
      "until 72 months from the due date of the relevant annual return. " +
      "Proceedings may require longer retention.",
    requiresLegalReview: true,
  },

  CLINICAL_DIAGNOSTICS: {
    retentionMonths: null,
    retentionDays: null,
    statutoryLaw: [
      "Applicable healthcare and medical-record requirements",
    ],
    triggerEvent: "RECORD_SPECIFIC_RETENTION_START",
    description:
      "Determine the retention period for the particular record, " +
      "record type, and applicable jurisdiction. Do not assume " +
      "a universal three-year period.",
    requiresLegalReview: true,
  },

  MARKETING_LEADS: {
    retentionMonths: null,
    retentionDays: null,
    statutoryLaw: [
      "DPDP Act Sections 4, 6, 8 and 12, as applicable",
    ],
    triggerEvent: "PURPOSE_END_OR_OTHER_VALID_ERASURE_TRIGGER",
    description:
      "Retain only while justified by the specified purpose or " +
      "another applicable legal ground. Handle consent withdrawal " +
      "and erasure obligations as applicable. No universal " +
      "90-day DPDP retention period is prescribed.",
    requiresLegalReview: true,
  },

  SECURITY_LOGS: {
    retentionMonths: 12,
    retentionDays: 365,
    statutoryLaw: [
      "DPDP Rules, 2025, Rule 6(1)(e), when in force",
      "DPDP Rules, 2025, Seventh Schedule, when applicable",
    ],
    triggerEvent: "PROCESSING_DATE",
    description:
      "The applicable security-safeguard rule specifies one-year " +
      "retention for relevant logs and personal data. The Seventh " +
      "Schedule separately specifies minimum one-year retention " +
      "for covered processing logs and associated data, subject " +
      "to applicable commencement and legal exceptions.",
    requiresLegalReview: true,
  },

  GENERAL_PERSONAL_DATA: {
    retentionMonths: null,
    retentionDays: null,
    statutoryLaw: [
      "DPDP Act Section 8(7), when in force",
      "DPDP Rules, 2025, Rule 8 and applicable provisions",
    ],
    triggerEvent: "PURPOSE_FULFILMENT_OR_OTHER_VALID_TRIGGER",
    description:
      "Define a purpose-specific retention period. Check statutory " +
      "retention duties, exceptions, and applicable Rules before " +
      "scheduling erasure.",
    requiresLegalReview: true,
  },
};


// 3. CONSENT AND PURPOSE RULES

export const CONSENT_RULES: Record<string, GovernanceRule> = {
  VALID_CONSENT: {
    legalReferences: ["DPDP Act Section 6"],
    requirement:
      "Where consent is the basis for processing, it must satisfy " +
      "the Act's requirements, including being free, specific, " +
      "informed, unconditional and unambiguous, with clear " +
      "affirmative action.",
    controls: [
      "Record the consent event and its timestamp",
      "Record the notice version and stated purpose",
      "Provide a way to withdraw consent",
      "Do not treat silence as consent",
    ],
    enabled: true,
  },

  NOTICE: {
    legalReferences: [
      "DPDP Act Section 5",
      "DPDP Rules, 2025, Rule 3, when applicable",
    ],
    requirement:
      "Provide the required notice describing personal data, " +
      "the purpose of processing, and the applicable means " +
      "for exercising rights and withdrawing consent.",
    controls: [
      "Store notice versions",
      "Link notices to processing purposes",
      "Record when notice is presented",
    ],
    enabled: true,
  },

  PURPOSE_LIMITATION: {
    legalReferences: ["DPDP Act Sections 4, 5 and 6"],
    requirement:
      "Process personal data for a lawful purpose and only " +
      "within the applicable legal basis and stated purpose.",
    controls: [
      "Register each processing purpose",
      "Reject unapproved purposes",
      "Review changes to intended use",
    ],
    enabled: true,
  },

  DATA_MINIMIZATION: {
    legalReferences: ["DPDP Act Sections 4, 5 and 8"],
    requirement:
      "Collect only personal data necessary for the relevant purpose.",
    controls: [
      "Document why each field is required",
      "Review unnecessary fields",
      "Restrict secondary use",
    ],
    enabled: true,
  },
};


// 4. DATA PRINCIPAL RIGHTS

export const DATA_RIGHTS_RULES: Record<string, GovernanceRule> = {
  ACCESS_INFORMATION: {
    legalReferences: ["DPDP Act Section 11"],
    requirement:
      "Support applicable rights to obtain information about " +
      "personal data and its processing.",
    controls: [
      "Verify the requester's identity",
      "Locate relevant records",
      "Apply statutory limitations and exceptions",
      "Record the response",
    ],
    enabled: true,
  },

  CORRECTION_AND_ERASURE: {
    legalReferences: ["DPDP Act Section 12"],
    requirement:
      "Provide mechanisms for applicable correction, completion, " +
      "updating and erasure requests, subject to legal retention duties.",
    controls: [
      "Verify the request",
      "Correct inaccurate data when required",
      "Check legal holds before erasure",
      "Record the action and outcome",
    ],
    enabled: true,
  },

  GRIEVANCE_REDRESSAL: {
    legalReferences: ["DPDP Act Section 13"],
    requirement:
      "Provide a grievance-redressal mechanism as required by law.",
    controls: [
      "Create a grievance case",
      "Track submission and resolution",
      "Apply the prescribed response timelines",
    ],
    enabled: true,
  },

  NOMINATION: {
    legalReferences: ["DPDP Act Section 14"],
    requirement:
      "Support the applicable right to nominate another person.",
    controls: [
      "Record nominations securely",
      "Verify nomination requests",
      "Restrict access to authorized staff",
    ],
    enabled: true,
  },
};


// 5. SECURITY AND INCIDENT MANAGEMENT

export const SECURITY_RULES: Record<string, GovernanceRule> = {
  SECURITY_SAFEGUARDS: {
    legalReferences: [
      "DPDP Act Section 8(5)",
      "DPDP Rules, 2025, Rule 6, when in force",
    ],
    requirement:
      "Implement appropriate technical and organizational " +
      "measures to protect personal data.",
    controls: [
      "Encryption and masking where appropriate",
      "Access control and least privilege",
      "Access logs and monitoring",
      "Backups and recovery measures",
      "Security reviews",
    ],
    enabled: true,
  },

  PERSONAL_DATA_BREACH: {
    legalReferences: [
      "DPDP Act Section 8(6)",
      "DPDP Rules, 2025, Rule 7, when applicable",
    ],
    requirement:
      "Detect and handle personal data breaches and provide " +
      "required notifications in the prescribed manner.",
    controls: [
      "Create an incident record",
      "Assess the scope and impact",
      "Preserve evidence",
      "Notify affected persons and the Board as required",
      "Document remediation",
    ],
    enabled: true,
  },

  PROCESSOR_SECURITY: {
    legalReferences: [
      "DPDP Act Section 8(2)",
      "DPDP Act Section 8(5)",
    ],
    requirement:
      "Apply appropriate contractual and security controls " +
      "to processing performed by a Data Processor.",
    controls: [
      "Maintain a processor register",
      "Document contractual obligations",
      "Review processor security",
      "Define incident notification procedures",
    ],
    enabled: true,
  },
};


// 6. CHILDREN'S PERSONAL DATA

export const CHILD_DATA_RULES: Record<string, GovernanceRule> = {
  CHILD_DATA: {
    legalReferences: [
      "DPDP Act Section 9",
      "DPDP Rules, 2025, Rules 10 and 11, when applicable",
    ],
    requirement:
      "A child is generally a person under 18. Apply the Act's " +
      "requirements concerning verifiable parental consent and " +
      "restrictions on specified processing, subject to applicable " +
      "exceptions and notified exemptions.",
    controls: [
      "Determine whether child-specific requirements apply",
      "Implement appropriate parental verification",
      "Apply applicable restrictions on tracking and targeted advertising",
      "Check exemptions before processing",
    ],
    enabled: true,
  },
};


// 7. SIGNIFICANT DATA FIDUCIARIES

export const SDF_RULES: Record<string, GovernanceRule> = {
  SIGNIFICANT_DATA_FIDUCIARY: {
    legalReferences: [
      "DPDP Act Section 10",
      "DPDP Rules, 2025, Rule 13, when applicable",
    ],
    requirement:
      "If formally classified as a Significant Data Fiduciary, " +
      "implement the additional duties applicable to that designation.",
    controls: [
      "Maintain a compliance register",
      "Arrange required impact assessments and audits",
      "Review prescribed technical and organizational measures",
      "Verify applicable India-based data and related requirements",
    ],
    enabled: true,
  },
};


// 8. CROSS-BORDER DATA TRANSFERS

export const TRANSFER_RULES: Record<string, GovernanceRule> = {
  CROSS_BORDER_TRANSFER: {
    legalReferences: [
      "DPDP Act Section 16",
      "Applicable government notifications and other laws",
    ],
    requirement:
      "Assess transfers outside India against applicable " +
      "government restrictions and other legal requirements.",
    controls: [
      "Record destination countries",
      "Identify receiving processors and entities",
      "Check current restrictions before transfer",
      "Apply additional sector-specific requirements where relevant",
    ],
    enabled: true,
  },
};


// 9. DUTIES OF DATA PRINCIPALS

export const DATA_PRINCIPAL_DUTY_RULES: Record<string, GovernanceRule> = {
  DATA_PRINCIPAL_DUTIES: {
    legalReferences: ["DPDP Act Section 15"],
    requirement:
      "Support applicable statutory processes without treating " +
      "individuals' duties as a substitute for the organization's duties.",
    controls: [
      "Publish clear request instructions",
      "Apply identity verification proportionately",
      "Document relevant request handling",
    ],
    enabled: true,
  },
};


// 10. RETENTION AND ERASURE OPERATIONS

export const RETENTION_ENFORCEMENT_RULES: Record<string, GovernanceRule> = {
  RETENTION_REVIEW: {
    legalReferences: [
      "DPDP Act Section 8(7), when in force",
      "DPDP Rules, 2025, Rule 8, when applicable",
      "Other applicable statutory retention laws",
    ],
    requirement:
      "Review whether the specified purpose continues to justify " +
      "retention. Apply the appropriate erasure trigger and any " +
      "applicable notice, exception or legal hold.",
    controls: [
      "Calculate deadlines from the correct trigger event",
      "Check statutory retention duties and legal holds",
      "Notify users when required by the applicable rule",
      "Erase data when legally required",
      "Record erasure completion",
    ],
    enabled: true,
  },
};


// 11. PENALTY REFERENCE
// These are statutory maximums, not automatic fines.

export const PENALTY_REFERENCES = {
  SECURITY_SAFEGUARDS: {
    section: "DPDP Act Section 8(5)",
    maximum: "Up to ₹250 crore",
    basis: "Schedule, entry relating to Section 8(5)",
  },

  BREACH_NOTIFICATION: {
    section: "DPDP Act Section 8(6)",
    maximum: "Up to ₹200 crore",
    basis: "Schedule, entry relating to Section 8(6)",
  },

  CHILD_OBLIGATIONS: {
    section: "DPDP Act Section 9",
    maximum: "Up to ₹200 crore",
    basis: "Schedule, entry relating to Section 9",
  },

  SIGNIFICANT_FIDUCIARY: {
    section: "DPDP Act Section 10",
    maximum: "Up to ₹150 crore",
    basis: "Schedule, entry relating to Section 10",
  },

  OTHER_ACTUAL_BREACHES: {
    section: "DPDP Act Schedule",
    maximum: "Depends on the applicable contravention",
    basis: "Check the exact statutory entry",
  },
} as const;

// ==============================================================================
// Helper Functions to Automatically Classify & Resolve Retention
// ==============================================================================

/**
 * Evaluates a PII category and returns its exact classification and security controls.
 */
export function resolveClassification(piiCategory: string): ClassificationRule {
  const normalized = piiCategory.toUpperCase().trim();
  if (CLASSIFICATION_RULES[normalized]) {
    return CLASSIFICATION_RULES[normalized];
  }

  // Fallback checks
  if (/child|minor|student|pediatric|pupil|infant/i.test(normalized)) {
    return /health|clinical|diagnostic|pediatric/i.test(normalized)
      ? CLASSIFICATION_RULES.CHILD_HEALTH_DATA
      : CLASSIFICATION_RULES.CHILDREN_DATA;
  }
  if (/guardian|parent/i.test(normalized)) {
    return CLASSIFICATION_RULES.PARENT_GUARDIAN_CONTACT;
  }
  if (/aadhaar|uidai|biometric/i.test(normalized)) {
    return CLASSIFICATION_RULES.AADHAAR;
  }
  if (/health|clinical|diagnostic|medical|prescription/i.test(normalized)) {
    return CLASSIFICATION_RULES.HEALTH_DATA;
  }
  if (/pan|tax|gstin/i.test(normalized)) {
    return CLASSIFICATION_RULES.PAN;
  }
  if (/phone|mobile|contact/i.test(normalized)) {
    return CLASSIFICATION_RULES.PHONE_NUMBER;
  }
  if (/email/i.test(normalized)) {
    return CLASSIFICATION_RULES.EMAIL;
  }

  return {
    classification: "CONFIDENTIAL",
    reason: "Personal identifier requiring appropriate protection under DPDP Act.",
    legalReferences: ["DPDP Act Section 8(5)"],
    controls: ["Access control", "Encrypt stored data"],
  };
}

/**
 * Resolves retention schedule based on business function and discovered categories.
 */
export function resolveRetentionSchedule(
  businessFunction: string,
  categories: string[] = []
): RetentionRule {
  const fnLower = businessFunction.toLowerCase();

  if (/finance|billing|invoice|tax|accounts/i.test(fnLower) || categories.includes("PAN")) {
    return RETENTION_RULES.FINANCE_BILLING;
  }

  if (/clinical|diagnostic|health|patient|dental|medical/i.test(fnLower) || categories.includes("HEALTH_DATA")) {
    return RETENTION_RULES.CLINICAL_DIAGNOSTICS;
  }

  if (/marketing|lead|promot|advert/i.test(fnLower)) {
    return RETENTION_RULES.MARKETING_LEADS;
  }

  if (/security|log|audit|access/i.test(fnLower)) {
    return RETENTION_RULES.SECURITY_LOGS;
  }

  return RETENTION_RULES.GENERAL_PERSONAL_DATA;
}
