import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from .config import DB_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        filepath TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_images_file_hash ON images(file_hash);
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_type TEXT NOT NULL,
        query_text TEXT,
        query_image_path TEXT,
        result_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def insert_image(filename: str, original_name: str, filepath: str,
                 width: int, height: int, file_size: int, mime_type: str,
                 file_hash: str, tags: List[str]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO images (filename, original_name, filepath, width, height, file_size, mime_type, file_hash, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (filename, original_name, filepath, width, height, file_size, mime_type, file_hash, json.dumps(tags)))
    image_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return image_id

def find_image_by_hash(file_hash: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE file_hash = ?", (file_hash,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["tags"] = json.loads(d.get("tags") or "[]")
        return d
    return None

def get_image_by_id(image_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE id = ?", (image_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["tags"] = json.loads(d.get("tags") or "[]")
        return d
    return None

def get_images_by_ids(image_ids: List[int]) -> Dict[int, Dict[str, Any]]:
    if not image_ids:
        return {}
    conn = get_db_connection()
    cursor = conn.cursor()
    placeholders = ",".join("?" for _ in image_ids)
    cursor.execute(f"SELECT * FROM images WHERE id IN ({placeholders})", image_ids)
    rows = cursor.fetchall()
    conn.close()
    res = {}
    for r in rows:
        d = dict(r)
        d["tags"] = json.loads(d.get("tags") or "[]")
        res[d["id"]] = d
    return res

def get_all_images(limit: int = 100, offset: int = 0, tag: Optional[str] = None, search: Optional[str] = None) -> (List[Dict[str, Any]], int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    conditions = []
    params = []

    if tag:
        conditions.append("tags LIKE ?")
        params.append(f'%"{tag}"%')

    if search:
        conditions.append("(original_name LIKE ? OR filename LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    count_cursor = conn.cursor()
    count_cursor.execute(f"SELECT COUNT(*) FROM images {where_clause}", params)
    total = count_cursor.fetchone()[0]

    cursor.execute(f"""
        SELECT * FROM images {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, params + [limit, offset])
    
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        d = dict(r)
        d["tags"] = json.loads(d.get("tags") or "[]")
        items.append(d)
    return items, total

def delete_image(image_id: int) -> Optional[Dict[str, Any]]:
    img = get_image_by_id(image_id)
    if not img:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM images WHERE id = ?", (image_id,))
    conn.commit()
    conn.close()
    return img

def update_image_tags(image_id: int, tags: List[str]) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE images SET tags = ? WHERE id = ?", (json.dumps(tags), image_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def insert_search_history(query_type: str, query_text: Optional[str] = None,
                          query_image_path: Optional[str] = None, result_count: int = 0) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO search_history (query_type, query_text, query_image_path, result_count)
        VALUES (?, ?, ?, ?)
    """, (query_type, query_text, query_image_path, result_count))
    hid = cursor.lastrowid
    conn.commit()
    conn.close()
    return hid

def get_search_history(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM search_history
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_search_history() -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM search_history")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return count

def get_all_unique_tags() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT tags FROM images")
    rows = cursor.fetchall()
    conn.close()
    
    tag_counts: Dict[str, int] = {}
    for r in rows:
        try:
            tags = json.loads(r[0] or "[]")
            for t in tags:
                tag_counts[t] = tag_counts.get(t, 0) + 1
        except Exception:
            continue
    
    sorted_tags = sorted(
        [{"tag": k, "count": v} for k, v in tag_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )
    return sorted_tags

def get_db_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM images")
    total_images = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM search_history")
    total_searches = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(file_size) FROM images")
    total_size = cursor.fetchone()[0] or 0

    conn.close()

    unique_tags = get_all_unique_tags()

    return {
        "total_images": total_images,
        "total_searches": total_searches,
        "total_tags": len(unique_tags),
        "total_storage_bytes": total_size
    }
