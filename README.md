# PH Solutions AI Chat Widget

A multi-agent AI chat assistant for [phsolutions.hu](https://phsolutions.hu). FastAPI + LangGraph backend powered by AWS Bedrock, with an embeddable React widget served via S3 + CloudFront.

```
Visitor
  └─> Chat Widget (widget.phsolutions.hu)
        └─> POST /api/chat/stream (ai.api.phsolutions.hu)
              └─> Supervisor ──> Researcher ──> FAISS Vector Store
                            └─> Writer    ──> SSE streamed response
```

## Architecture

| Component | Description |
|-----------|-------------|
| **Frontend widget** | React + Vite IIFE bundle, embeddable via a single `<script>` tag |
| **FastAPI backend** | SSE streaming `/api/chat/stream` endpoint |
| **Supervisor agent** | Analyzes the query and routes to researcher or writer |
| **Researcher agent** | FAISS vector search + summarization from the knowledge base |
| **Writer agent** | Synthesizes the final answer from the full message history |
| **RAG / Vector Store** | FAISS index with Amazon Titan embeddings |
| **LLM** | AWS Bedrock – Claude Haiku 4.5 (`eu.anthropic.claude-haiku-4-5-20251001-v1:0`) |

## Project Structure

```
phsolutions-ai-chat-assistant/
├── src/                          # Python backend
│   ├── api.py                    # FastAPI app — /api/chat/stream endpoint
│   ├── graph.py                  # LangGraph state machine
│   ├── state.py                  # GraphState TypedDict
│   ├── config.py                 # Configuration from env variables
│   ├── agents/
│   │   ├── supervisor.py         # Routing logic (Pydantic structured output)
│   │   ├── researcher.py         # Vector store retrieval + summarization
│   │   └── writer.py             # Final answer synthesis
│   └── rag/
│       └── retriever.py          # FAISS loader, top-k retriever
├── frontend/                     # React chat widget
│   ├── src/
│   │   ├── widget.tsx            # Entry point — mounts the widget into the DOM
│   │   ├── App.tsx               # Chat UI (bubble button + chat panel)
│   │   ├── api.ts                # SSE stream client
│   │   ├── types.ts              # TypeScript types
│   │   └── components/
│   │       ├── ChatMessage.tsx   # Message bubble (ReactMarkdown)
│   │       └── TypingIndicator.tsx # Animated loading indicator
│   └── vite.config.ts            # IIFE build → chat-widget.js (CSS inlined)
├── scripts/
│   └── ingest_docs.py            # One-time script to build the vector store
├── data/
│   ├── sample_docs/              # Knowledge base (.txt files)
│   └── vectorstore/              # Generated FAISS index
├── deploy/
│   └── setup_ec2.sh              # EC2 server setup (Nginx + systemd + SSL)
├── .github/workflows/
│   ├── deploy-frontend.yml       # S3 + CloudFront deploy
│   └── deploy-backend.yml        # EC2 deploy via SSH
└── requirements.txt
```

## Infrastructure

| Component | Where |
|-----------|-------|
| Backend API | AWS EC2 — `https://ai.api.phsolutions.hu` |
| Frontend widget | AWS S3 + CloudFront — `https://widget.phsolutions.hu/chat-widget.js` |
| Embedded on | `https://phsolutions.hu` (`<script defer>` at end of `<body>`) |

## Local Development

### Backend

**Prerequisites:** Python 3.11+, AWS Bedrock access (eu-north-1 region)

```bash
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Fill in your AWS credentials
```

Build the vector store (first time only):

```bash
python scripts/ingest_docs.py
```

Start the API:

```bash
uvicorn src.api:app --reload
# Available at http://localhost:8000
```

### Frontend widget

```bash
cd frontend
npm install
npm run dev
# Available at http://localhost:5174
```

The dev server proxies `/api` requests to `localhost:8000`.

### Environment variables (`.env`)

```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

BEDROCK_MODEL_ID=eu.anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
```

## Deploy

### Frontend (automatic CI/CD)

Any push to `main` that touches `frontend/**` will automatically:
1. Build the `chat-widget.js` IIFE bundle (CSS inlined)
2. Upload to S3 (`phsolutions-chat-widget` bucket)
3. Invalidate the CloudFront cache (`/*`)

Manual build and upload:

```bash
cd frontend
VITE_API_URL=https://ai.api.phsolutions.hu npm run build
aws s3 cp dist/chat-widget.js s3://phsolutions-chat-widget/chat-widget.js \
  --content-type "application/javascript" --cache-control "max-age=3600"
aws cloudfront create-invalidation --distribution-id E2L1AZK7X682A3 --paths "/*"
```

### Backend (automatic CI/CD)

Any push to `main` that touches `src/**` triggers an SSH pull + restart on EC2.

First-time EC2 setup:

```bash
bash deploy/setup_ec2.sh
```

## Extending the Knowledge Base

Add `.txt` files to `data/sample_docs/` and re-run the ingest script:

```bash
python scripts/ingest_docs.py
```

## GitHub Actions Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | S3 + CloudFront deploy access |
| `AWS_SECRET_ACCESS_KEY` | S3 + CloudFront deploy access |
| `VITE_API_URL` | Backend URL baked into the widget build |
| `EC2_HOST` | EC2 instance IP or hostname |
| `EC2_SSH_KEY` | Private SSH key for EC2 access |
