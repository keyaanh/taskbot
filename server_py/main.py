from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
import os

load_dotenv()

from routes import chat, memory, files, analytics

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chats")
app.include_router(memory.router, prefix="/api/memory")
app.include_router(files.router, prefix="/api/files")
app.include_router(analytics.router, prefix="/api/analytics")

@app.get("/api/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
