"""
Throwaway MCP test server for manually exercising the MCP feature.
Run: python test_mcp_server.py   (listens on :9999)
Then add http://localhost:9999 as a server in Settings > MCP Servers.
"""
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/tools")
def list_tools():
    return [{
        "name": "get_weather",
        "description": "Get the current weather for a city",
        "inputSchema": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
        },
    }]

@app.post("/tools/get_weather")
def call_weather(body: dict):
    city = body.get("city", "unknown")
    return {"result": f"It's sunny and 72F in {city}."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9999)
