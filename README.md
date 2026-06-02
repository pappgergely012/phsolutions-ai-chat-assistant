# LangGraph Bedrock Demo

A multi-agent AI system demonstrating how to build a question-answering application using AWS Bedrock foundation models, LangGraph orchestration, and Retrieval-Augmented Generation (RAG).

## Overview

This project implements a **supervisor orchestration pattern** where a central supervisor agent routes queries to specialized sub-agents (researcher and writer) that collaborate to produce well-grounded answers. A local FAISS vector store provides the knowledge base for retrieval.

```
User Query
    └─> Supervisor ──> Researcher ──> FAISS Vector Store
                  └─> Writer    ──> Final Answer
```

## Architecture

| Component | Description |
|-----------|-------------|
| **Supervisor** | Analyzes the task and routes to researcher, writer, or finish |
| **Researcher** | Retrieves relevant documents from the vector store and summarizes them |
| **Writer** | Synthesizes a final answer from the full message history |
| **RAG / Vector Store** | FAISS index with Amazon Titan embeddings over sample `.txt` documents |
| **LLM** | AWS Bedrock via `ChatBedrockConverse` (default: Claude 3.5 Haiku) |

State is managed by a `GraphState` TypedDict with an append-only message history and a routing field. Agents communicate exclusively through this shared state.

## Project Structure

```
langgraph-bedrock-demo/
├── src/
│   ├── main.py               # Entry point — runs sample queries
│   ├── graph.py              # LangGraph state machine definition
│   ├── state.py              # GraphState TypedDict
│   ├── config.py             # Configuration from environment variables
│   ├── agents/
│   │   ├── supervisor.py     # Routing logic with structured Pydantic output
│   │   ├── researcher.py     # Vector store retrieval + summarization
│   │   └── writer.py         # Final answer synthesis
│   └── rag/
│       └── retriever.py      # FAISS loader and top-k retriever
├── scripts/
│   └── ingest_docs.py        # One-time script to build the vector store
├── data/
│   ├── sample_docs/          # Source knowledge base (.txt files)
│   └── vectorstore/          # Generated FAISS index (created by ingest script)
├── .env.example
└── requirements.txt
```

## Prerequisites

- Python 3.10+
- An AWS account with access to Amazon Bedrock
- Bedrock model access enabled for:
  - `anthropic.claude-3-5-haiku-20241022-v1:0` (or another Claude model)
  - `amazon.titan-embed-text-v2:0`

## Setup

**1. Clone and create a virtual environment**

```bash
git clone <repo-url>
cd langgraph-bedrock-demo

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional — override the default models
BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
```

**4. Build the vector store**

```bash
python scripts/ingest_docs.py
```

This chunks the documents in `data/sample_docs/`, creates embeddings with Amazon Titan, and saves a FAISS index to `data/vectorstore/`.

**5. Run the demo**

```bash
python -m src.main
```

Three sample queries are executed and printed to stdout:

1. *What is AWS Bedrock and which foundation models does it support?*
2. *How does LangGraph differ from LangChain?*
3. *What is retrieval-augmented generation and why is it useful?*

## Dependencies

| Package | Purpose |
|---------|---------|
| `langgraph` | Multi-agent orchestration and state graph |
| `langchain` | LLM framework and abstractions |
| `langchain-aws` | AWS Bedrock integration |
| `langchain-community` | Document loaders, FAISS wrapper |
| `faiss-cpu` | Local vector similarity search |
| `pydantic` | Structured output for routing decisions |
| `boto3` | AWS SDK (authentication) |
| `python-dotenv` | `.env` file loading |

## Extending the Knowledge Base

Add `.txt` files to `data/sample_docs/` and re-run the ingest script:

```bash
python scripts/ingest_docs.py
```

The vector store will be rebuilt automatically.

## Key Concepts Demonstrated

- **Supervisor pattern** — a dedicated agent decides which specialist to invoke next
- **Structured routing** — Pydantic models ensure deterministic routing decisions
- **RAG** — retrieved context is injected into the message history before the writer responds
- **LangGraph state management** — `add_messages` reducer accumulates the full conversation history across agent hops
