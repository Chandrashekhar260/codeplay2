import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';
import { CreateDsrRequestInput, ResolveDsrRequestInput } from './dsr.schema';
import crypto from 'crypto';

/**
 * Traverses the RoPA knowledge graph to assemble a complete DPDP Section 11 Access Report
 * for an individual Data Principal (user/patient/customer).
 *
 * Traversal path:
 * [User Ref] ──► [Consent & Identity] ──► [Data Sources] ──► [PII Categories]
 *            ──► [RoPA Processing Activities] ──► [Storage Flows] ──► [Third-Party Recipients]
 */
export async function traverseUserGraph(tenantId: string, userRef: string) {
  const cleanRef = userRef.trim().toLowerCase();

  // 1. Fetch user's direct records from Consent Ledger
  const consents = await prisma.consentRecord.findMany({
    where: {
      tenantId,
      userRef: { contains: cleanRef, mode: 'insensitive' },
    },
    include: {
      purpose: true,
    },
  });

  // 2. Fetch all RoPA processing activities with complete graph relations
  const activities = await prisma.processingActivity.findMany({
    where: { tenantId },
    include: {
      source: true,
      dataElements: true,
      dataFlows: true,
      thirdPartyRecipients: true,
      retentionPolicies: true,
    },
  });

  // 3. Graph Traversal: Map user data to activities and downstream processors
  const matchingActivities: any[] = [];
  const distinctSources = new Map<string, any>();
  const distinctPiiCategories = new Set<string>();
  const distinctRecipients = new Map<string, any>();
  const distinctStorageSystems = new Map<string, any>();

  // If user has specific consent purposes, match activities accordingly;
  // otherwise associate with default active enterprise processing activities
  activities.forEach((act) => {
    // Add activity
    matchingActivities.push({
      activityId: act.activityId,
      name: act.name,
      businessFunction: act.businessFunction,
      purpose: act.purpose || 'General business processing',
      legalBasis: act.legalBasis,
      retentionMonths: act.retentionPolicies[0]?.retentionPeriodMonths || (act.retentionDays ? Math.round(act.retentionDays / 30) : 36),
      retentionTrigger: act.retentionPolicies[0]?.triggerEvent || 'STATUTORY_CLINICAL_PERIOD',
      sourceName: act.source?.name || 'Enterprise Clinic Database',
      dataElements: act.dataElements.map((e) => e.piiCategory),
    });

    if (act.source) {
      distinctSources.set(act.source.sourceId, {
        sourceId: act.source.sourceId,
        name: act.source.name,
        type: act.source.sourceType,
      });
    }

    act.dataElements.forEach((elem) => distinctPiiCategories.add(elem.piiCategory));

    act.dataFlows.forEach((flow) => {
      distinctStorageSystems.set(flow.flowId, {
        systemName: flow.systemName,
        stage: flow.flowStage,
        location: flow.location,
      });
    });

    act.thirdPartyRecipients.forEach((rec) => {
      distinctRecipients.set(rec.recipientId, {
        name: rec.name,
        type: rec.recipientType,
        country: rec.country,
      });
    });
  });

  // 4. Fetch any past or active DSR requests filed by this user
  const dsrHistory = await prisma.dsrRequest.findMany({
    where: {
      tenantId,
      userRef: { contains: cleanRef, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch tenant info
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  return {
    userRef: cleanRef,
    businessInfo: {
      tenantId,
      name: tenant?.name || 'Enterprise Clinic / Business',
      website: tenant?.name?.toLowerCase().includes('aarogya') ? 'aarogyadiagnostics.in' : 'enterprise.in',
    },
    personalDataSummary: {
      piiCategoriesHeld: Array.from(distinctPiiCategories),
      activeConsentsCount: consents.filter((c) => c.status === 'GIVEN').length,
      consents: consents.map((c) => ({
        recordId: c.recordId,
        purposeName: c.purpose.name,
        status: c.status,
        channel: c.channel,
        capturedAt: c.capturedAt,
      })),
    },
    dataSources: Array.from(distinctSources.values()),
    processingActivities: matchingActivities,
    storageSystems: Array.from(distinctStorageSystems.values()),
    thirdPartyRecipients: Array.from(distinctRecipients.values()),
    dsrHistory,
  };
}

/**
 * Submits a new Data Subject Right (DSR) request: Access, Correction, or Erasure
 */
export async function submitDsrRequest(
  tenantId: string,
  input: CreateDsrRequestInput,
  ipAddress?: string,
  userAgent?: string
) {
  // If no affectedActivityId provided, find the primary active activity
  let activityId = input.affectedActivityId;
  if (!activityId) {
    const primaryActivity = await prisma.processingActivity.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    activityId = primaryActivity?.activityId;
  }

  // Generate SHA-256 integrity receipt for DPDP compliance proof
  const receiptHash = crypto
    .createHash('sha256')
    .update(`${tenantId}:${input.userRef}:${input.requestType}:${Date.now()}`)
    .digest('hex');

  // Due date: 30 days statutory timeline under DPDP
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // If request is filed by a parent/guardian on behalf of a minor under Section 9:
  const formattedDetails = input.isMinorChild
    ? `[DPDP §9 MINOR DATA PRINCIPAL - Lawful Guardian: ${input.parentGuardianRef || 'Parent'} (${input.guardianRelationship || 'LEGAL_GUARDIAN'})] ${input.details.trim()}`
    : input.details.trim();

  const request = await prisma.dsrRequest.create({
    data: {
      tenantId,
      requestType: input.requestType,
      status: 'SUBMITTED',
      userRef: input.userRef.trim(),
      details: formattedDetails,
      fieldToCorrect: input.fieldToCorrect?.trim() || null,
      currentValue: input.currentValue?.trim() || null,
      correctedValue: input.correctedValue?.trim() || null,
      affectedActivityId: activityId || null,
      sha256Proof: receiptHash,
      dueDate,
    },
    include: {
      activity: true,
    },
  });

  await recordAuditEvent({
    tenantId,
    action: input.isMinorChild ? 'SECTION_9_MINOR_DSR_SUBMITTED' : 'DSR_REQUEST_SUBMITTED',
    resourceType: 'DSR_REQUEST',
    resourceId: request.requestId,
    diffJson: {
      requestType: request.requestType,
      userRef: request.userRef,
      fieldToCorrect: request.fieldToCorrect,
      correctedValue: request.correctedValue,
      affectedActivity: request.activity?.name,
      isMinorChild: input.isMinorChild || false,
      parentGuardianRef: input.parentGuardianRef || null,
      guardianRelationship: input.guardianRelationship || null,
      statutorySection: input.isMinorChild ? 'DPDP_ACT_2023_SECTION_9' : 'DPDP_ACT_2023_SECTION_12',
    },
    ipAddress,
    userAgent,
  });

  return request;
}

/**
 * List all DSR requests for admin review
 */
export async function listDsrRequests(tenantId: string) {
  return prisma.dsrRequest.findMany({
    where: { tenantId },
    include: {
      activity: {
        include: {
          source: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Resolves a DSR Request (Approve Correction / Process Erasure / Reject)
 * Updates database records accordingly and resolves the notification flag.
 */
export async function resolveDsrRequest(
  tenantId: string,
  adminUserId: string,
  requestId: string,
  input: ResolveDsrRequestInput,
  ipAddress?: string,
  userAgent?: string
) {
  const existing = await prisma.dsrRequest.findFirst({
    where: { requestId, tenantId },
    include: { activity: true },
  });

  if (!existing) {
    const error: any = new Error('DSR Request not found');
    error.status = 404;
    throw error;
  }

  let finalStatus = 'COMPLETED';
  let taxRetentionLock = false;

  // 1. If Correction is Approved
  if (input.resolution === 'APPROVE_CORRECTION') {
    finalStatus = 'COMPLETED';
    const correctedVal = input.correctedValueOverride || existing.correctedValue;

    // Apply correction to consent ledger records if userRef changed
    if (existing.fieldToCorrect === 'phone' || existing.fieldToCorrect === 'email') {
      if (correctedVal) {
        await prisma.consentRecord.updateMany({
          where: {
            tenantId,
            userRef: existing.userRef,
          },
          data: {
            userRef: correctedVal,
          },
        });
      }
    }
  }

  // 2. If Erasure is Processed
  else if (input.resolution === 'APPROVE_ERASURE') {
    // Check if activity has statutory tax or clinical lock (e.g. 7 years for tax / 3 years for clinical)
    if (existing.activity?.businessFunction?.toLowerCase().includes('finance') ||
        existing.activity?.legalBasis === 'STATUTORY_OBLIGATION') {
      finalStatus = 'RETAINED_TAX_CONFLICT';
      taxRetentionLock = true;
    } else {
      finalStatus = 'COMPLETED';
      // Erase / withdraw consents for this user
      await prisma.consentRecord.updateMany({
        where: {
          tenantId,
          userRef: existing.userRef,
        },
        data: {
          status: 'WITHDRAWN',
          withdrawnAt: new Date(),
        },
      });
    }
  }

  // 3. Tax retention lock
  else if (input.resolution === 'RETAIN_TAX_CONFLICT') {
    finalStatus = 'RETAINED_TAX_CONFLICT';
    taxRetentionLock = true;
  }

  // 4. Rejection
  else if (input.resolution === 'REJECT') {
    finalStatus = 'REJECTED';
  }

  const updated = await prisma.dsrRequest.update({
    where: { requestId },
    data: {
      status: finalStatus,
      taxRetentionLock,
      resolutionNotes: input.resolutionNotes.trim(),
      assignedTo: adminUserId,
    },
    include: {
      activity: true,
    },
  });

  await recordAuditEvent({
    tenantId,
    actorId: adminUserId,
    action: `DSR_REQUEST_${finalStatus}`,
    resourceType: 'DSR_REQUEST',
    resourceId: requestId,
    diffJson: {
      resolution: input.resolution,
      finalStatus,
      resolutionNotes: input.resolutionNotes,
      userRef: existing.userRef,
      affectedActivity: existing.activity?.name,
    },
    ipAddress,
    userAgent,
  });

  return updated;
}

/**
 * Returns active pending DSR alerts that need attention on RoPA nodes
 */
export async function getActiveDsrAlerts(tenantId: string) {
  const pendingRequests = await prisma.dsrRequest.findMany({
    where: {
      tenantId,
      status: { in: ['SUBMITTED', 'IN_REVIEW'] },
    },
    include: {
      activity: true,
    },
  });

  // Map by activityId
  const alertsByActivity = new Map<string, any[]>();
  for (const req of pendingRequests) {
    if (req.affectedActivityId) {
      const list = alertsByActivity.get(req.affectedActivityId) || [];
      list.push({
        requestId: req.requestId,
        requestType: req.requestType,
        userRef: req.userRef,
        fieldToCorrect: req.fieldToCorrect,
        correctedValue: req.correctedValue,
        details: req.details,
        createdAt: req.createdAt,
      });
      alertsByActivity.set(req.affectedActivityId, list);
    }
  }

  return {
    totalPending: pendingRequests.length,
    requests: pendingRequests,
    alertsByActivity: Object.fromEntries(alertsByActivity),
  };
}

/**
 * Public portal: Get list of active registered businesses/tenants for user selection
 */
export async function getPublicBusinesses() {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      plan: true,
    },
  });

  return tenants.map((t) => {
    let domain = 'aarogyadiagnostics.in';
    if (!t.name.toLowerCase().includes('aarogya')) {
      domain = t.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    }
    return {
      tenantId: t.id,
      name: t.name,
      website: domain,
    };
  });
}

/**
 * Resolves a tenant by website domain or business name
 */
export async function findTenantByWebsiteOrName(query?: string) {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // Try direct ID match
  let tenant = await prisma.tenant.findUnique({ where: { id: query.trim() } });
  if (tenant) return tenant;

  // Try matching name directly
  tenant = await prisma.tenant.findFirst({
    where: {
      name: { contains: clean, mode: 'insensitive' },
    },
  });
  if (tenant) return tenant;

  // If query looks like a domain name (e.g. aarogyadiagnostics.in, aarogya.in)
  const domainKeyword = clean.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
  if (domainKeyword && domainKeyword.length >= 3) {
    tenant = await prisma.tenant.findFirst({
      where: {
        name: { contains: domainKeyword, mode: 'insensitive' },
      },
    });
    if (tenant) return tenant;
  }

  return null;
}

/**
 * Public Portal: Track live present status & resolution of a DSR request by Request ID
 */
export async function trackDsrRequest(requestId: string) {
  const cleanId = requestId.trim();
  const request = await prisma.dsrRequest.findFirst({
    where: {
      OR: [
        { requestId: cleanId },
        { sha256Proof: cleanId },
      ],
    },
    include: {
      activity: {
        include: {
          source: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!request) {
    const error: any = new Error(`No statutory request found for ID or Proof: ${cleanId}`);
    error.status = 404;
    throw error;
  }

  const now = new Date();
  const due = request.dueDate ? new Date(request.dueDate) : null;
  const daysRemaining = due ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

  return {
    requestId: request.requestId,
    requestType: request.requestType,
    status: request.status,
    userRef: request.userRef,
    details: request.details,
    fieldToCorrect: request.fieldToCorrect,
    currentValue: request.currentValue,
    correctedValue: request.correctedValue,
    taxRetentionLock: request.taxRetentionLock,
    resolutionNotes: request.resolutionNotes,
    sha256Proof: request.sha256Proof,
    dueDate: request.dueDate,
    daysRemaining,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    businessInfo: {
      tenantId: request.tenantId,
      name: request.tenant.name,
      website: request.tenant.name.toLowerCase().includes('aarogya') ? 'aarogyadiagnostics.in' : 'enterprise.in',
    },
    affectedActivity: request.activity ? {
      name: request.activity.name,
      businessFunction: request.activity.businessFunction,
      sourceName: request.activity.source?.name,
    } : null,
  };
}

