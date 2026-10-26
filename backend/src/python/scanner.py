"""
PrivacyLedger - Local PII & Indian Identifier Scanner
Strictly offline execution using regex heuristics and Verhoeff checksum.
Outputs clean JSON to stdout matching database schema.
Zero external dependencies - uses Python stdlib only (csv, zipfile).
openpyxl used for XLSX only if available.
"""

import sys
import os
import json
import re
import csv
from typing import List, Dict, Any

# ==============================================================================
# Verhoeff Algorithm for 12-Digit Indian Aadhaar Validation
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

    for hint, (category, sensitivity) in HEADER_HINTS.items():
        if hint in header_lower:
            return {'piiCategories': category, 'sensitivityLevel': sensitivity}

    for kw in CHILD_KEYWORDS:
        if kw in header_lower:
            if 'pediatric' in header_lower or 'health' in header_lower:
                return {'piiCategories': 'CHILD_HEALTH_DATA', 'sensitivityLevel': 'CRITICAL'}
            if 'guardian' in header_lower or 'parent' in header_lower:
                return {'piiCategories': 'PARENT_GUARDIAN_CONTACT', 'sensitivityLevel': 'HIGH'}
            return {'piiCategories': 'CHILDREN_DATA', 'sensitivityLevel': 'CRITICAL'}

    for kw in HEALTH_KEYWORDS:
        if kw in header_lower:
            return {'piiCategories': 'HEALTH_DATA', 'sensitivityLevel': 'CRITICAL'}

    phone_matches = 0
    pan_matches = 0
    aadhaar_matches = 0
    email_matches = 0
    health_matches = 0
    non_empty = 0

    for val in values[:200]:
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

        val_lower = s_val.lower()
        if any(kw in val_lower for kw in HEALTH_KEYWORDS):
            health_matches += 1

    if non_empty == 0:
        return {}

    threshold = max(1, int(non_empty * 0.15))

    if aadhaar_matches >= 1:
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


def read_csv_columns(file_path: str) -> Dict[str, List[Any]]:
    """Read a CSV using only stdlib csv module — zero external dependencies."""
    columns: Dict[str, List[Any]] = {}
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 5000:
                break
            for col, val in row.items():
                if col not in columns:
                    columns[col] = []
                columns[col].append(val if val is not None else '')
    return columns


def read_xlsx_columns(file_path: str) -> Dict[str, Dict[str, List[Any]]]:
    """Read XLSX using openpyxl if available, otherwise return empty."""
    sheets: Dict[str, Dict[str, List[Any]]] = {}
    try:
        import openpyxl
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            cols: Dict[str, List[Any]] = {}
            headers: List[str] = []
            for i, row in enumerate(ws.iter_rows(values_only=True)):
                if i == 0:
                    headers = [str(c) if c is not None else f'col_{j}' for j, c in enumerate(row)]
                    for h in headers:
                        cols[h] = []
                else:
                    if i > 5000:
                        break
                    for j, val in enumerate(row):
                        if j < len(headers):
                            cols[headers[j]].append(val if val is not None else '')
            sheets[sheet_name] = cols
        wb.close()
    except ImportError:
        pass
    return sheets


def scan_file(file_path: str) -> Dict[str, Any]:
    """Scans CSV or XLSX file and extracts PII findings and remediation flags."""
    if not os.path.exists(file_path):
        return {'success': False, 'error': f'File not found: {file_path}'}

    ext = os.path.splitext(file_path)[1].lower()
    findings = []
    flags = []

    try:
        if ext == '.csv':
            sheet_name = os.path.basename(file_path)
            columns = read_csv_columns(file_path)
            for col, values in columns.items():
                res = analyze_series(col, values)
                if res:
                    findings.append({
                        'objectName': sheet_name,
                        'fieldName': str(col),
                        'piiCategories': res['piiCategories'],
                        'sensitivityLevel': res['sensitivityLevel']
                    })

        elif ext in ('.xlsx', '.xls'):
            sheets = read_xlsx_columns(file_path)
            for sheet_name, columns in sheets.items():
                for col, values in columns.items():
                    res = analyze_series(col, values)
                    if res:
                        findings.append({
                            'objectName': str(sheet_name),
                            'fieldName': str(col),
                            'piiCategories': res['piiCategories'],
                            'sensitivityLevel': res['sensitivityLevel']
                        })

        else:
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

        has_child_data = any(f.get('piiCategories') in ('CHILDREN_DATA', 'CHILD_HEALTH_DATA') for f in findings)
        has_critical = any(f['sensitivityLevel'] == 'CRITICAL' for f in findings)
        has_high = any(f['sensitivityLevel'] == 'HIGH' for f in findings)

        if has_child_data:
            flags.append({'flagType': 'SECTION_9_CHILD_DATA_SAFEGUARD', 'severity': 'CRITICAL', 'status': 'OPEN'})
        if has_critical:
            flags.append({'flagType': 'UNENCRYPTED_CRITICAL_PII', 'severity': 'CRITICAL', 'status': 'OPEN'})
        if has_high:
            flags.append({'flagType': 'UNPROTECTED_CONTACT_IDENTIFIER', 'severity': 'HIGH', 'status': 'OPEN'})
        if len(findings) > 0 and not has_critical and not has_high and not has_child_data:
            flags.append({'flagType': 'GENERAL_PII_PRESENT', 'severity': 'MEDIUM', 'status': 'OPEN'})

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
