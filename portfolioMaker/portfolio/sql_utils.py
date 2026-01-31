"""Generic raw-SQL utilities for the `portfolio` app.

This module provides safe, reusable helpers for executing parameterized raw
SQL across different database backends, and helpers to build WHERE and JOIN
clauses programmatically.

Design goals:
- Keep helpers generic (not analytics-specific).
- Use parameterized execution; never format user input into SQL directly.
- Prefer model._meta.db_table for table names.
- Support simple cross-database differences (SQLite vs others) when needed.
"""
from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple
from pathlib import Path
from contextlib import contextmanager
from django.db import connection
from django.db.backends.base.base import BaseDatabaseWrapper


def _dict_from_cursor(cursor) -> List[Dict[str, Any]]:
    cols = [col[0] for col in cursor.description] if cursor.description else []
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_connection() -> BaseDatabaseWrapper:
    """Return Django's DB connection object (convenience alias)."""
    return connection


@contextmanager
def get_cursor():
    """Context manager yielding a DB cursor and ensuring it's closed.

    Use like:
        with get_cursor() as cur:
            cur.execute(sql, params)
            rows = _dict_from_cursor(cur)
    """
    conn = get_connection()
    with conn.cursor() as cur:
        yield cur


def execute_select(sql: str, params: Optional[Iterable[Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SELECT query and return results as list of dicts.

    Parameters
    - sql: parameterized SQL string. Use placeholder style appropriate for the
      DB backend (this helper accepts whichever placeholder style the DB expects).
    - params: sequence of parameters.
    """
    with get_cursor() as cur:
        cur.execute(sql, params or [])
        return _dict_from_cursor(cur)


def execute_scalar(sql: str, params: Optional[Iterable[Any]] = None) -> Any:
    """Execute a query and return the first column of the first row (or None)."""
    with get_cursor() as cur:
        cur.execute(sql, params or [])
        row = cur.fetchone()
        return row[0] if row else None


def execute_non_query(sql: str, params: Optional[Iterable[Any]] = None) -> int:
    """Execute INSERT/UPDATE/DELETE; return affected rowcount."""
    with get_cursor() as cur:
        cur.execute(sql, params or [])
        return cur.rowcount


def execute_script_file(path: Path) -> None:
    """Execute multiple SQL statements from a file.

    Note: behavior differs by backend. For SQLite we can use executescript;
    for others we split on semicolons and execute sequentially.
    """
    p = Path(path)
    sql_text = p.read_text(encoding="utf-8")
    conn = get_connection()
    if conn.vendor == "sqlite":
        # sqlite3 supports executescript
        with conn.cursor() as cur:
            cur.executescript(sql_text)
    else:
        # naive split on semicolon for other DBs; avoid for complex scripts
        statements = [s.strip() for s in sql_text.split(";") if s.strip()]
        with conn.cursor() as cur:
            for stmt in statements:
                cur.execute(stmt)


# --- Helpers to build SQL fragments ---
def table_name(model_or_table: Any) -> str:
    """Return a table name for a Django model or accept a raw table string."""
    if hasattr(model_or_table, "_meta"):
        return model_or_table._meta.db_table
    return str(model_or_table)


def _placeholder_for_vendor(vendor: str) -> str:
    """Return single-parameter placeholder for the DB vendor.

    - sqlite -> '?'
    - others (psycopg2/mysqlclient) -> '%s'
    """
    if vendor == "sqlite":
        return "?"
    return "%s"


def build_where_clause(filters: Dict[str, Any], vendor: Optional[str] = None) -> Tuple[str, List[Any]]:
    """Build a WHERE clause from a dict of column->value.

    Returns tuple (sql_fragment, params). For example:
        build_where_clause({'u.id': 1, 'p.is_public': True}) ->
        ("WHERE u.id = %s AND p.is_public = %s", [1, True])

    The placeholder style is chosen based on `vendor` (default: current DB).
    """
    vendor = vendor or get_connection().vendor
    ph = _placeholder_for_vendor(vendor)
    clauses: List[str] = []
    params: List[Any] = []
    for col, val in filters.items():
        if val is None:
            clauses.append(f"{col} IS NULL")
        elif isinstance(val, (list, tuple)):
            # IN clause
            placeholders = ", ".join([ph] * len(val))
            clauses.append(f"{col} IN ({placeholders})")
            params.extend(list(val))
        else:
            clauses.append(f"{col} = {ph}")
            params.append(val)
    if not clauses:
        return "", []
    return "WHERE " + " AND ".join(clauses), params


def build_join_clause(joins: Iterable[Dict[str, str]]) -> str:
    """Build JOIN clauses from an iterable of dicts.

    Each join dict should contain:
      - type: 'INNER', 'LEFT', etc. (optional, defaults to 'INNER')
      - table: table name (or model)
      - on: join condition (e.g. 'a.id = b.a_id')

    Example:
      build_join_clause([{'type': 'LEFT', 'table': 'portfolio_project', 'on': 'p.id = pr.portfolio_id'}])
    -> " LEFT JOIN portfolio_project ON p.id = pr.portfolio_id"
    """
    parts: List[str] = []
    for j in joins:
        jtype = j.get("type", "INNER").upper()
        tbl = table_name(j["table"]) if j.get("table") else ""
        on = j.get("on", "")
        if not tbl or not on:
            continue
        parts.append(f" {jtype} JOIN {tbl} ON {on}")
    return "".join(parts)


def execute_db_function(name: str, params: Optional[Iterable[Any]] = None, is_procedure: bool = False) -> Optional[List[Dict[str, Any]]]:
    """Execute a DB function or procedure and return rows when applicable.

    Behavior varies by backend:
    - SQLite: functions are called via `SELECT name(?, ?)`
    - PostgreSQL: use `SELECT name(%s, %s)`
    - MySQL procedures: use `CALL name(%s, %s)` when `is_procedure=True`

    Returns list[dict] for queries that return result sets, or None for no result.
    """
    vendor = get_connection().vendor
    params = list(params or [])
    ph = _placeholder_for_vendor(vendor)
    placeholders = ", ".join([ph] * len(params)) if params else ""

    if is_procedure and vendor == "mysql":
        sql = f"CALL {name}({placeholders})"
    else:
        sql = f"SELECT {name}({placeholders})" if placeholders or vendor == "sqlite" else f"SELECT {name}()"

    # Some DB functions return scalar; attempt to fetch rows; if none, return scalar
    with get_cursor() as cur:
        cur.execute(sql, params)
        if cur.description:
            return _dict_from_cursor(cur)
        row = cur.fetchone()
        return [row] if row else None


def execute_sql(sql: str, params: Optional[Iterable[Any]] = None) -> List[Dict[str, Any]]:
    """Backward-compatible alias for execute_select."""
    return execute_select(sql, params)
