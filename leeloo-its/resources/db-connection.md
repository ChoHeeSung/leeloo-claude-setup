# DB 접속 설정

## 접속 정보
- Host: leeloo2006.synology.me
- Port: 11522
- Service: FREEPDB1
- Schema: ITS
- Admin User: system
- Admin Password: ${DB_PASSWORD}

## Python 접속 코드
```python
import oracledb
conn = oracledb.connect(user="system", password="${DB_PASSWORD}", dsn="leeloo2006.synology.me:11522/FREEPDB1")
cursor = conn.cursor()
```

## SQL 실행 헬퍼
```python
def execute_sql(sql, params=None, commit=True):
    """SQL 실행 + 결과 반환"""
    cursor = conn.cursor()
    cursor.execute(sql, params or {})
    if sql.strip().upper().startswith('SELECT'):
        return cursor.fetchall()
    if commit:
        conn.commit()
    return cursor.rowcount

def execute_ddl(sql):
    """DDL 실행 (CREATE/ALTER/DROP)"""
    cursor = conn.cursor()
    cursor.execute(sql)
    return True
```
