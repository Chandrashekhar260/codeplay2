"""
PrivacyLedger - Local PII & Indian Identifier Scanner
Strictly offline execution using regex heuristics and Verhoeff checksum.
Outputs clean JSON to stdout matching Photo 2 database schema.
"""

import sys
import os
import json
import re
from typing import List, Dict, Any

# ==============================================================================
# Verhoeff Algorithm for 12-Digit Indian Aadhaar Validation
# Eliminates false positives by validating the check digit.
# ==============================================================================
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

def validate_verhoeff_aadhaar(number_str: str) -> bool:
    """Validates 12-digit Indian Aadhaar number using Verhoeff algorithm."""
    clean = re.sub(r'[\s\-]', '', str(number_str))
    if not re.match(r'^[2-9]\d{11}$', clean):
        return False
    
    c = 0
    reversed_digits = [int(x) for x in reversed(clean)]
    for i, digit in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]]
    return c == 0

# ==============================================================================
# Heuristic Pattern Definitions
# ==============================================================================
RE_PHONE = re.compile(r'^(?:\+91[\-\s]?)?[6-9]\d{9}$')
RE_PAN = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]$')
RE_EMAIL = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

HEALTH_KEYWORDS = {
    'prescription', 'diagnosis', 'diagnostic', 'blood', 'patient', 'doctor',
    'hospital', 'clinic', 'tsh', 'glucose', 'insulin', 'cbc', 'lipid', 'urine',
    'biopsy', 'test report', 'medication', 'dosage', 'symptoms', 'treatment'
}

CHILD_KEYWORDS = {
    'child', 'minor', 'student', 'pediatric', 'pediatry', 'kindergarten', 'infant',
    'pupil', 'dob_minor', 'age_minor', 'guardian', 'parent_consent', 'parental_consent'
}

HEADER_HINTS = {
    'phone': ('PHONE_NUMBER', 'HIGH'),
    'mobile': ('PHONE_NUMBER', 'HIGH'),
    'contact': ('PHONE_NUMBER', 'HIGH'),
    'cell': ('PHONE_NUMBER', 'HIGH'),
    'pan': ('PAN', 'HIGH'),
    'aadhaar': ('AADHAAR', 'CRITICAL'),
    'adhar': ('AADHAAR', 'CRITICAL'),
    'uidai': ('AADHAAR', 'CRITICAL'),
    'email': ('EMAIL', 'MEDIUM'),
    'e-mail': ('EMAIL', 'MEDIUM'),
    'name': ('FULL_NAME', 'MEDIUM'),
    'patient': ('PATIENT_IDENTITY', 'HIGH'),
    'address': ('PHYSICAL_ADDRESS', 'MEDIUM'),
    'city': ('LOCATION', 'LOW'),
    'pincode': ('POSTAL_CODE', 'LOW'),
    'pin': ('POSTAL_CODE', 'LOW'),
    # Section 9 Children's Data Protection Hints
    'child': ('CHILDREN_DATA', 'CRITICAL'),
    'minor': ('CHILDREN_DATA', 'CRITICAL'),
    'student': ('CHILDREN_DATA', 'CRITICAL'),
    'pediatric': ('CHILD_HEALTH_DATA', 'CRITICAL'),
    'guardian': ('PARENT_GUARDIAN_CONTACT', 'HIGH'),
    'parent': ('PARENT_GUARDIAN_CONTACT', 'HIGH'),
    'parental': ('PARENT_GUARDIAN_CONTACT', 'HIGH'),
}

def analyze_series(series_name: str, values: List[Any]) -> Dict[str, str]:
    """Analyzes a list of values in a column to determine PII category and sensitivity level."""
    header_lower = str(series_name).lower().strip()

    # 1. Header hints
    for hint, (category, sensitivity) in HEADER_HINTS.items():
        if hint in header_lower:
            return {'piiCategories': category, 'sensitivityLevel': sensitivity}

    # Check child / minor keywords in header
    for kw in CHILD_KEYWORDS:
        if kw in header_lower:
            if 'pediatric' in header_lower or 'health' in header_lower:
                return {'piiCategories': 'CHILD_HEALTH_DATA', 'sensitivityLevel': 'CRITICAL'}
            if 'guardian' in header_lower or 'parent' in header_lower:
                return {'piiCategories': 'PARENT_GUARDIAN_CONTACT', 'sensitivityLevel': 'HIGH'}
            return {'piiCategories': 'CHILDREN_DATA', 'sensitivityLevel': 'CRITICAL'}

    # Check health keywords in header
    for kw in HEALTH_KEYWORDS:
        if kw in header_lower:
            return {'piiCategories': 'HEALTH_DATA', 'sensitivityLevel': 'CRITICAL'}

    # 2. Inspect sample values
    phone_matches = 0
    pan_matches = 0
    aadhaar_matches = 0
    email_matches = 0
    health_matches = 0
    non_empty = 0

    for val in values[:200]:  # Sample up to 200 rows for high throughput
        if val is None or val == '':
            continue
        s_val = str(val).strip()
        non_empty += 1

        if RE_PHONE.match(s_val):
            phone_matches += 1
        elif RE_PAN.match(s_val):
            pan_matches += 1
        elif RE_EMAIL.match(s_val):
            email_matches += 1
        elif validate_verhoeff_aadhaar(s_val):
            aadhaar_matches += 1

        # Check medical/health terms in cell
        val_lower = s_val.lower()
        if any(kw in val_lower for kw in HEALTH_KEYWORDS):
            health_matches += 1

    if non_empty == 0:
        return {}

    threshold = max(1, int(non_empty * 0.15))

    if aadhaar_matches >= 1:  # Even 1 valid Verhoeff Aadhaar is critical
        return {'piiCategories': 'AADHAAR', 'sensitivityLevel': 'CRITICAL'}
    if health_matches >= threshold:
        return {'piiCategories': 'HEALTH_DATA', 'sensitivityLevel': 'CRITICAL'}
    if pan_matches >= threshold:
        return {'piiCategories': 'PAN', 'sensitivityLevel': 'HIGH'}
    if phone_matches >= threshold:
        return {'piiCategories': 'PHONE_NUMBER', 'sensitivityLevel': 'HIGH'}
    if email_matches >= threshold:
        return {'piiCategories': 'EMAIL', 'sensitivityLevel': 'MEDIUM'}

    return {}


def scan_file(file_path: str) -> Dict[str, Any]:
    """Scans CSV or XLSX file and extracts findings and flags."""
    if not os.path.exists(file_path):
        return {'success': False, 'error': f'File not found: {file_path}'}

    ext = os.path.splitext(file_path)[1].lower()
    findings = []
    flags = []

    try:
        import pandas as pd

        if ext == '.csv':
            # Read CSV
            df = pd.read_csv(file_path, low_memory=False, nrows=5000)
            sheet_name = os.path.basename(file_path)
            for col in df.columns:
                res = analyze_series(col, df[col].dropna().tolist())
                if res:
                    findings.append({
                        'objectName': sheet_name,
                        'fieldName': str(col),
                        'piiCategories': res['piiCategories'],
                        'sensitivityLevel': res['sensitivityLevel']
                    })

        elif ext in ('.xlsx', '.xls'):
            excel_file = pd.ExcelFile(file_path)
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet, nrows=5000)
                for col in df.columns:
                    res = analyze_series(col, df[col].dropna().tolist())
                    if res:
                        findings.append({
                            'objectName': str(sheet),
                            'fieldName': str(col),
                            'piiCategories': res['piiCategories'],
                            'sensitivityLevel': res['sensitivityLevel']
                        })
        else:
            # Fallback for plain text or unknown
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = [line.strip() for line in f.readlines()[:1000]]
            sheet_name = os.path.basename(file_path)
            res = analyze_series('text_content', lines)
            if res:
                findings.append({
                    'objectName': sheet_name,
                    'fieldName': 'text_content',
                    'piiCategories': res['piiCategories'],
                    'sensitivityLevel': res['sensitivityLevel']
                })

        # Generate Remediation Flags matching Photo 2 schema:
        # remediation_flags (flag_id, source_id, flag_type, severity, status)
        has_child_data = any(f.get('piiCategories') in ('CHILDREN_DATA', 'CHILD_HEALTH_DATA') for f in findings)
        has_critical = any(f['sensitivityLevel'] == 'CRITICAL' for f in findings)
        has_high = any(f['sensitivityLevel'] == 'HIGH' for f in findings)

        if has_child_data:
            flags.append({
                'flagType': 'SECTION_9_CHILD_DATA_SAFEGUARD',
                'severity': 'CRITICAL',
                'status': 'OPEN'
            })
        if has_critical:
            flags.append({
                'flagType': 'UNENCRYPTED_CRITICAL_PII',
                'severity': 'CRITICAL',
                'status': 'OPEN'
            })
        if has_high:
            flags.append({
                'flagType': 'UNPROTECTED_CONTACT_IDENTIFIER',
                'severity': 'HIGH',
                'status': 'OPEN'
            })
        if len(findings) > 0 and not has_critical and not has_high and not has_child_data:
            flags.append({
                'flagType': 'GENERAL_PII_PRESENT',
                'severity': 'MEDIUM',
                'status': 'OPEN'
            })

        return {
            'success': True,
            'findings': findings,
            'flags': flags,
            'findingsCount': len(findings)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No file path provided'}))
        sys.exit(1)

    target_file = sys.argv[1]
    result = scan_file(target_file)
    print(json.dumps(result))
