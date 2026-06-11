from fastapi import APIRouter, UploadFile, File, HTTPException
from services.extract import extract_text
import base64

router = APIRouter()

ALLOWED = {".jpg",".jpeg",".png",".gif",".webp",".pdf",".doc",".docx",".txt",".csv",".md",".xlsx",".xls"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED:
        raise HTTPException(400, "File type not allowed")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")

    text = extract_text(content, file.content_type or "", file.filename)
    is_image = (file.content_type or "").startswith("image/")
    b64 = base64.b64encode(content).decode() if is_image else None

    return {
        "base64": b64,
        "mimetype": file.content_type,
        "name": file.filename,
        "extractedText": text,
        "isTextExtracted": bool(text),
    }
