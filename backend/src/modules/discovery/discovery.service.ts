import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';

export interface FileUploadInfo {
  filename: string;
  originalname: string;
  path: string;
  size: number;
  mimetype: string;
}

export async function registerDataSource(
  tenantId: string,
  userId: string,
  fileInfo: FileUploadInfo,
  ipAddress?: string,
  userAgent?: string
) {
  const ext = path.extname(fileInfo.originalname).replace('.', '').toUpperCase();
  const sourceType = ext === 'XLSX' || ext === 'XLS' ? 'XLSX' : ext === 'CSV' ? 'CSV' : 'TXT';

  const configJson = JSON.stringify({
    filePath: fileInfo.path,
    originalName: fileInfo.originalname,
    fileSizeBytes: fileInfo.size,
    mimeType: fileInfo.mimetype,
    storageType: 'LOCAL',
  });

  const dataSource = await prisma.dataSource.create({
    data: {
      tenantId,
      name: fileInfo.originalname,
      sourceType,
      config: configJson,
      status: 'REGISTERED',
    },
  });

  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'DATA_SOURCE_REGISTERED',
    resourceType: 'DATA_SOURCE',
    resourceId: dataSource.sourceId,
    diffJson: { filename: fileInfo.originalname, size: fileInfo.size, sourceType },
    ipAddress,
    userAgent,
  });

  return dataSource;
}

export async function runScan(sourceId: string, tenantId: string, userId?: string): Promise<any> {
  const dataSource = await prisma.dataSource.findFirst({
    where: {
      sourceId,
      tenantId, // Tenant isolation
    },
  });

  if (!dataSource) {
    const error: any = new Error('Data source not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const config = dataSource.config ? JSON.parse(dataSource.config) : {};
  const filePath = config.filePath;

  if (!filePath) {
    const error: any = new Error('Data source has no local file path configured');
    error.status = 400;
    error.code = 'INVALID_CONFIG';
    throw error;
  }

  // 1. Create ScanJob record
  const scanJob = await prisma.scanJob.create({
    data: {
      sourceId: dataSource.sourceId,
      tenantId,
      status: 'IN_PROGRESS',
    },
  });

  // 2. Update DataSource status
  await prisma.dataSource.update({
    where: { sourceId },
    data: { status: 'SCANNING' },
  });

  // 3. Execute Python PII Scanner via Child Process
  const candidatePaths = [
    path.resolve(__dirname, '../../python/scanner.py'),
    path.resolve(__dirname, '../../../src/python/scanner.py'),
    path.resolve(process.cwd(), 'src/python/scanner.py'),
    path.resolve(process.cwd(), 'dist/python/scanner.py'),
    path.resolve(process.cwd(), 'backend/src/python/scanner.py'),
    path.resolve(process.cwd(), 'backend/dist/python/scanner.py'),
  ];
  const scriptPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';

  return new Promise((resolve, reject) => {
    const py = spawn(pythonExecutable, [scriptPath, filePath]);
    let stdoutData = '';
    let stderrData = '';

    py.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    py.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    py.on('close', async (code) => {
      if (code !== 0) {
        console.error(`[Scanner] Python script error: ${stderrData}`);
        await prisma.scanJob.update({
          where: { jobId: scanJob.jobId },
          data: { status: 'FAILED' },
        });
        await prisma.dataSource.update({
          where: { sourceId },
          data: { status: 'FAILED' },
        });
        reject(new Error(`Scanner exited with error: ${stderrData || 'Unknown python error'}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (!parsed.success) {
          throw new Error(parsed.error || 'Scanner returned failure');
        }

        const findings = parsed.findings || [];
        const flags = parsed.flags || [];

        // Save findings and flags in database transaction
        await prisma.$transaction(async (tx) => {
          // Create Scan Findings matching Photo 2:
          // scan_findings (finding_id, job_id, object_name, field_name, pii_categories, sensitivity_level)
          if (findings.length > 0) {
            await tx.scanFinding.createMany({
              data: findings.map((f: any) => ({
                jobId: scanJob.jobId,
                objectName: f.objectName,
                fieldName: f.fieldName,
                piiCategories: f.piiCategories,
                sensitivityLevel: f.sensitivityLevel,
              })),
            });
          }

          // Create Remediation Flags matching Photo 2:
          // remediation_flags (flag_id, source_id, flag_type, severity, status)
          if (flags.length > 0) {
            await tx.remediationFlag.createMany({
              data: flags.map((fl: any) => ({
                sourceId: dataSource.sourceId,
                flagType: fl.flagType,
                severity: fl.severity,
                status: fl.status || 'OPEN',
              })),
            });
          }

          // Complete ScanJob
          await tx.scanJob.update({
            where: { jobId: scanJob.jobId },
            data: {
              status: 'COMPLETED',
              findingsCount: findings.length,
            },
          });

          // Complete DataSource
          await tx.dataSource.update({
            where: { sourceId },
            data: {
              status: 'SCANNED',
              lastScannedAt: new Date(),
            },
          });
        });

        // Record Audit Event
        await recordAuditEvent({
          tenantId,
          actorId: userId,
          action: 'DATA_SOURCE_SCANNED',
          resourceType: 'DATA_SOURCE',
          resourceId: dataSource.sourceId,
          diffJson: { findingsCount: findings.length, flagsCount: flags.length },
        });

        const updatedJob = await prisma.scanJob.findUnique({
          where: { jobId: scanJob.jobId },
          include: {
            scanFindings: true,
          },
        });

        const activeFlags = await prisma.remediationFlag.findMany({
          where: { sourceId },
        });

        resolve({
          job: updatedJob,
          findings,
          flags: activeFlags,
        });
      } catch (err) {
        console.error('[Scanner] Failed to parse scanner output:', err);
        await prisma.scanJob.update({
          where: { jobId: scanJob.jobId },
          data: { status: 'FAILED' },
        });
        await prisma.dataSource.update({
          where: { sourceId },
          data: { status: 'FAILED' },
        });
        reject(err);
      }
    });
  });
}

export async function listDataSources(tenantId: string) {
  return prisma.dataSource.findMany({
    where: { tenantId },
    include: {
      scanJobs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
      remediationFlags: {
        where: { status: 'OPEN' },
      },
    },
    orderBy: { lastScannedAt: 'desc' },
  });
}

export async function getDataSource(sourceId: string, tenantId: string) {
  const source = await prisma.dataSource.findFirst({
    where: {
      sourceId,
      tenantId, // Tenant isolation
    },
    include: {
      scanJobs: {
        orderBy: { startedAt: 'desc' },
        include: { scanFindings: true },
      },
      remediationFlags: true,
    },
  });

  if (!source) {
    const error: any = new Error('Data source not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return source;
}

export async function getFindings(sourceId: string, tenantId: string) {
  const source = await prisma.dataSource.findFirst({
    where: { sourceId, tenantId },
    select: { sourceId: true },
  });

  if (!source) {
    const error: any = new Error('Data source not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const latestJob = await prisma.scanJob.findFirst({
    where: { sourceId, tenantId },
    orderBy: { startedAt: 'desc' },
    include: { scanFindings: true },
  });

  return {
    sourceId,
    job: latestJob,
    findings: latestJob?.scanFindings || [],
  };
}

export async function getFlags(sourceId: string, tenantId: string) {
  const source = await prisma.dataSource.findFirst({
    where: { sourceId, tenantId },
    select: { sourceId: true },
  });

  if (!source) {
    const error: any = new Error('Data source not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return prisma.remediationFlag.findMany({
    where: { sourceId },
    orderBy: { flagId: 'desc' },
  });
}
