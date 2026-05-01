# leeloo-its

Interactive ITS (Intelligent Transport System) Oracle DB management plugin.
Generates/modifies table DDL, manages codes, and registers field equipment, executing directly against Oracle DB.

## Architecture

- `plugin.json` — Plugin manifest (name: "leeloo-its", version: "1.0.1").
- `skills/` — 3 skills (lk-its- prefix):
  - `lk-its-ddl/` — DDL create/modify (create, alter, show, check, dict).
  - `lk-its-code/` — Code/pattern code management (add-group, add-item, add-pattern, add-holiday, list, search).
  - `lk-its-equip/` — Field equipment register/modify/lookup (add, modify, list, show, status, move, delete).
- `resources/` — Reference resources:
  - `system-prompt.md` — P1–P10 DDL generation principles + domain/column dictionary + few-shot.
  - `domain-dictionary.yaml` — Data standard dictionary (Single Source of Truth).
  - `db-connection.md` — Oracle DB connection info + Python helpers.
- `tools/` — `consistency_checker.py` (automatic DDL consistency verification).

## Key Design Decisions

- **Claude generates DDL itself**: No separate API calls needed. Based on system-prompt.md rules.
- **Reference data standard dictionary**: domain-dictionary.yaml is the Single Source of Truth for every column type/size.
- **Direct Oracle DB execution**: python3 + oracledb runs CREATE/ALTER/INSERT immediately.
- **Skill chaining**: Automatic chaining suggestions across its-code ↔ its-equip ↔ its-ddl.

## Dependencies

- Python 3 + oracledb package
- Oracle DB connection (see resources/db-connection.md)
