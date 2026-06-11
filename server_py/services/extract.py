from typing import Optional
import pdfplumber
import docx
import pandas as pd
import io

def extract_text(content: bytes, mimetype: str, filename: str) -> Optional[str]:
    try:
        if mimetype == "application/pdf" or filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages = [p.extract_text() or "" for p in pdf.pages]
            return "\n".join(pages).strip() or None

        if filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs).strip() or None

        if filename.endswith((".xlsx", ".xls")):
            return _analyze_spreadsheet(pd.read_excel(io.BytesIO(content), sheet_name=None))

        if filename.endswith(".csv") or mimetype == "text/csv":
            return _analyze_spreadsheet({"Sheet1": pd.read_csv(io.BytesIO(content))})

        if mimetype.startswith("text/") or filename.endswith((".txt", ".md")):
            return content.decode("utf-8", errors="ignore").strip() or None

    except Exception as e:
        print(f"[extract] failed for {filename}: {e}")
    return None

def _analyze_spreadsheet(sheets: dict) -> str:
    parts = []
    for sheet_name, df in sheets.items():
        parts.append(f"=== Sheet: {sheet_name} ===")
        parts.append(f"Rows: {len(df)} | Columns: {len(df.columns)}")
        parts.append(f"Columns: {', '.join(df.columns.tolist())}")

        # column types
        type_info = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            nulls = int(df[col].isna().sum())
            type_info.append(f"  {col}: {dtype} ({nulls} nulls)")
        parts.append("Column details:\n" + "\n".join(type_info))

        # numeric stats
        num_cols = df.select_dtypes(include="number")
        if not num_cols.empty:
            stats = num_cols.describe().round(2).to_string()
            parts.append(f"Numeric statistics:\n{stats}")

        # sample rows
        sample = df.head(5).to_string(index=False)
        parts.append(f"First 5 rows:\n{sample}")

    return "\n\n".join(parts)
