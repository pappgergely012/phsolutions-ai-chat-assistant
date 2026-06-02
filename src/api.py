import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage
from pydantic import BaseModel

from src.config import AWS_REGION, BEDROCK_MODEL_ID
from src.graph import build_graph
from src.rag.retriever import load_retriever

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatBedrockConverse(
    model=BEDROCK_MODEL_ID,
    region_name=AWS_REGION,
    temperature=0.3,
    max_tokens=2048,
)

retriever = load_retriever(top_k=4)
graph = build_graph(llm, retriever)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


def build_message_history(history: list[dict]) -> list:
    messages = []
    for entry in history:
        if entry["role"] == "user":
            messages.append(HumanMessage(content=entry["content"]))
        elif entry["role"] == "assistant":
            messages.append(AIMessage(content=entry["content"]))
    return messages


NODE_STATUS_LABELS = {
    "supervisor": "Elemzés...",
    "researcher": "Tudásbázis keresése...",
    "writer": "Válasz írása...",
}


async def stream_response(message: str, history: list[dict]):
    messages = build_message_history(history)
    messages.append(HumanMessage(content=message))

    initial_state = {"messages": messages, "next": ""}

    current_node = None

    for chunk, metadata in graph.stream(initial_state, stream_mode="messages"):
        node = metadata.get("langgraph_node")

        if node != current_node:
            current_node = node
            label = NODE_STATUS_LABELS.get(node)
            if label:
                yield f"data: {json.dumps({'status': label})}\n\n"

        if node != "writer" or not isinstance(chunk, AIMessageChunk):
            continue

        content = getattr(chunk, "content", None)
        if not content:
            continue

        if isinstance(content, str):
            delta = content
        elif isinstance(content, list):
            delta = "".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in content
            )
        else:
            continue

        if delta:
            yield f"data: {json.dumps({'delta': delta})}\n\n"

    yield f"data: {json.dumps({'done': True})}\n\n"


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_response(request.message, request.history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
