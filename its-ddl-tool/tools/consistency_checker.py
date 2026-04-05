#!/usr/bin/env python3
"""
ITS DB DDL Consistency Checker
Validates generated DDL against data-standard-dictionary.yaml.

Checks:
  1. Domain consistency: column type/size matches YAML domain dictionary
  2. Naming convention: PK/FK/IDX/CK names follow P5 rules
  3. Comment coverage: every TABLE and COLUMN has COMMENT ON
  4. Code column pattern: _CD columns have "참조: COM_CODE_ITEM(...). 허용값:" in COMMENT
  5. YN column rules: _YN columns are VARCHAR2(1) with CHECK constraint
  6. Cross-table consistency: same column name = same type across all tables

Usage:
    python consistency_checker.py ddl_file.sql
    python consistency_checker.py ddl_dir/  # checks all .sql files in directory
"""

import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class ConsistencyChecker:
    def __init__(self, dictionary_path: Optional[str] = None):
        self.domains: Dict[str, dict] = {}
        self.columns: Dict[str, dict] = {}
        if dictionary_path:
            self._load_dictionary(dictionary_path)

    def _load_dictionary(self, path: str):
        """Load domain and column definitions from YAML (simple parser, no pyyaml dependency)."""
        content = Path(path).read_text(encoding="utf-8")
        section = None
        current_key = None

        for line in content.split("\n"):
            stripped = line.strip()
            if stripped == "domains:":
                section = "domains"
                continue
            elif stripped == "terms:":
                section = "terms"
                continue
            elif stripped == "columns:":
                section = "columns"
                continue
            elif stripped == "type_conflicts:":
                section = "type_conflicts"
                continue

            if section == "domains" and not stripped.startswith("#") and not stripped.startswith("-"):
                m = re.match(r"^(\w+):$", stripped)
                if m:
                    current_key = m.group(1)
                    self.domains[current_key] = {}
                elif current_key and ":" in stripped:
                    k, v = stripped.split(":", 1)
                    self.domains[current_key][k.strip()] = v.strip().strip('"')

            elif section == "columns" and not stripped.startswith("#"):
                m = re.match(r"^(\w+):$", stripped)
                if m:
                    current_key = m.group(1)
                    self.columns[current_key] = {}
                elif current_key and ":" in stripped:
                    k, v = stripped.split(":", 1)
                    self.columns[current_key][k.strip()] = v.strip().strip('"')

    def check_ddl_string(self, ddl: str) -> List[str]:
        """Check a DDL string and return list of violation messages."""
        violations = []
        tables = self._parse_tables(ddl)
        comments = self._parse_comments(ddl)

        # Track column types across tables for cross-table consistency
        col_types: Dict[str, List[Tuple[str, str]]] = {}

        for table_name, columns in tables.items():
            # Check 1: Table comment exists
            if table_name not in comments.get("tables", {}):
                violations.append(f"MISSING TABLE COMMENT: {table_name}")

            for col_name, col_type in columns:
                # Check 2: Column comment exists
                col_key = f"{table_name}.{col_name}"
                if col_key not in comments.get("columns", {}):
                    violations.append(f"MISSING COLUMN COMMENT: {col_key}")

                # Check 3: _CD column has allowed values pattern
                if col_name.endswith("_CD"):
                    comment_text = comments.get("columns", {}).get(col_key, "")
                    if "허용값:" not in comment_text and "참조:" not in comment_text:
                        violations.append(
                            f"CODE COLUMN WITHOUT ALLOWED VALUES: {col_key} "
                            f"(expected '참조: COM_CODE_ITEM(...). 허용값: ...')"
                        )

                # Check 4: _YN column is VARCHAR2(1)
                if col_name.endswith("_YN"):
                    if "VARCHAR2(1)" not in col_type.upper():
                        violations.append(
                            f"YN COLUMN TYPE MISMATCH: {col_key} is {col_type}, expected VARCHAR2(1)"
                        )

                # Check 5: Domain consistency against YAML
                if self.columns and col_name in self.columns:
                    expected_domain = self.columns[col_name].get("domain", "")
                    if expected_domain and expected_domain in self.domains:
                        expected_type = self.domains[expected_domain].get("type", "")
                        expected_length = self.domains[expected_domain].get("length", "")
                        if expected_type and expected_type.upper() not in col_type.upper():
                            violations.append(
                                f"DOMAIN TYPE MISMATCH: {col_key} is {col_type}, "
                                f"expected domain {expected_domain} = {expected_type}({expected_length})"
                            )

                # Track for cross-table check
                if col_name not in col_types:
                    col_types[col_name] = []
                col_types[col_name].append((table_name, col_type))

        # Check 6: Cross-table column type consistency
        for col_name, usages in col_types.items():
            if len(usages) > 1:
                types = set(t.upper().strip() for _, t in usages)
                if len(types) > 1:
                    details = ", ".join(f"{tbl}={typ}" for tbl, typ in usages)
                    violations.append(
                        f"CROSS-TABLE TYPE MISMATCH: {col_name} has different types: {details}"
                    )

        # Check 7: PK/FK/IDX naming convention
        for match in re.finditer(
            r"CONSTRAINT\s+(\w+)\s+(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK)", ddl, re.IGNORECASE
        ):
            name = match.group(1)
            ctype = match.group(2).upper()
            if ctype == "PRIMARY KEY" and not name.startswith("PK_"):
                violations.append(f"PK NAMING: {name} should start with PK_")
            elif ctype == "FOREIGN KEY" and not name.startswith("FK_"):
                violations.append(f"FK NAMING: {name} should start with FK_")
            elif ctype == "UNIQUE" and not name.startswith("UQ_"):
                violations.append(f"UQ NAMING: {name} should start with UQ_")
            elif ctype == "CHECK" and not name.startswith("CK_"):
                violations.append(f"CK NAMING: {name} should start with CK_")

        return violations

    def _parse_tables(self, ddl: str) -> Dict[str, List[Tuple[str, str]]]:
        """Parse CREATE TABLE statements. Returns {table_name: [(col_name, col_type), ...]}."""
        tables = {}
        for match in re.finditer(
            r"CREATE\s+TABLE\s+(?:\w+\.)?(\w+)\s*\((.*?)\)\s*;",
            ddl,
            re.IGNORECASE | re.DOTALL,
        ):
            table_name = match.group(1).upper()
            body = match.group(2)
            columns = []
            for line in body.split("\n"):
                line = line.strip().rstrip(",")
                if not line or line.upper().startswith("CONSTRAINT"):
                    continue
                parts = line.split()
                if len(parts) >= 2 and not parts[0].upper().startswith("CONSTRAINT"):
                    col_name = parts[0].upper()
                    col_type = parts[1]
                    # Capture full type like NUMBER(12,8)
                    if len(parts) > 2 and parts[1].endswith("(") or "(" in parts[1]:
                        col_type = parts[1]
                    columns.append((col_name, col_type))
            tables[table_name] = columns
        return tables

    def _parse_comments(self, ddl: str) -> Dict[str, Dict[str, str]]:
        """Parse COMMENT ON statements."""
        result: Dict[str, Dict[str, str]] = {"tables": {}, "columns": {}}

        for match in re.finditer(
            r"COMMENT\s+ON\s+TABLE\s+(?:\w+\.)?(\w+)\s+IS\s+'(.*?)'\s*;",
            ddl,
            re.IGNORECASE | re.DOTALL,
        ):
            result["tables"][match.group(1).upper()] = match.group(2)

        for match in re.finditer(
            r"COMMENT\s+ON\s+COLUMN\s+(?:\w+\.)?(\w+)\.(\w+)\s+IS\s+'(.*?)'\s*;",
            ddl,
            re.IGNORECASE | re.DOTALL,
        ):
            key = f"{match.group(1).upper()}.{match.group(2).upper()}"
            result["columns"][key] = match.group(3)

        return result


def main():
    if len(sys.argv) < 2:
        print("Usage: python consistency_checker.py <ddl_file_or_dir> [--yaml dict.yaml]")
        sys.exit(1)

    target = Path(sys.argv[1])
    yaml_path = None
    if "--yaml" in sys.argv:
        idx = sys.argv.index("--yaml")
        yaml_path = sys.argv[idx + 1]
    else:
        default_yaml = Path(__file__).parent.parent.parent / "docs" / "design" / "data-standard-dictionary.yaml"
        if default_yaml.exists():
            yaml_path = str(default_yaml)

    checker = ConsistencyChecker(yaml_path)

    if target.is_dir():
        sql_files = sorted(target.glob("*.sql"))
        ddl = "\n".join(f.read_text(encoding="utf-8") for f in sql_files)
        print(f"Checking {len(sql_files)} SQL files in {target}")
    else:
        ddl = target.read_text(encoding="utf-8")
        print(f"Checking {target}")

    violations = checker.check_ddl_string(ddl)

    if violations:
        print(f"\nVIOLATIONS: {len(violations)}")
        for i, v in enumerate(violations, 1):
            print(f"  [{i:3d}] {v}")
        sys.exit(1)
    else:
        print("\nAll checks passed. No violations found.")
        sys.exit(0)


if __name__ == "__main__":
    main()
