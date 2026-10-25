import { z } from 'zod';

export const createDsrRequestSchema = z.object({
  requestType: z.enum(['ACCESS', 'CORRECTION', 'ERASURE', 'GRIEVANCE']),
  userRef: z.string().min(3, 'User reference (email or phone) is required'),
  details: z.string().min(3, 'Request details must be at least 3 characters'),
  fieldToCorrect: z.string().optional(),
  currentValue: z.string().optional(),
  correctedValue: z.string().optional(),
  affectedActivityId: z.string().uuid().optional(),
  tenantId: z.string().optional(),
  businessWebsite: z.string().optional(),
  // DPDP Section 9 Verifiable Parental Consent & Representation
  isMinorChild: z.boolean().optional(),
  parentGuardianRef: z.string().optional(),
  guardianRelationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'SELF']).optional(),
});

export const resolveDsrRequestSchema = z.object({
  resolution: z.enum(['APPROVE_CORRECTION', 'APPROVE_ERASURE', 'RETAIN_TAX_CONFLICT', 'REJECT']),
  resolutionNotes: z.string().min(2, 'Resolution notes are required'),
  correctedValueOverride: z.string().optional(),
});

export const portalAccessQuerySchema = z.object({
  userRef: z.string().min(3, 'User reference (email or phone) is required'),
  tenantId: z.string().optional(),
  businessWebsite: z.string().optional(),
});

export const trackRequestSchema = z.object({
  requestId: z.string().min(3, 'Request ID is required'),
});

export type CreateDsrRequestInput = z.infer<typeof createDsrRequestSchema>;
export type ResolveDsrRequestInput = z.infer<typeof resolveDsrRequestSchema>;

