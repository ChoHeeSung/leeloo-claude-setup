# DB Connection Configuration

## Connection Info
- Host: leeloo2006.synology.me
- Port: 11522
- Service: FREEPDB1
- Schema: ITS
- Admin User: system
- Admin Password: ${DB_PASSWORD}

## Python Connection Code
```python
import oracledb
conn = oracledb.connect(user="system", password="${DB_PASSWORD}", dsn="leeloo2006.synology.me:11522/FREEPDB1")
cursor = conn.cursor()
```

## SQL Execution Helpers
```python
def execute_sql(sql, params=None, commit=True):
    """Run SQL and return result."""
    cursor = conn.cursor()
    cursor.execute(sql, params or {})
    if sql.strip().upper().startswith('SELECT'):
        return cursor.fetchall()
    if commit:
        conn.commit()
    return cursor.rowcount

def execute_ddl(sql):
    """Run DDL (CREATE/ALTER/DROP)."""
    cursor = conn.cursor()
    cursor.execute(sql)
    return True
```
