"""
Run this script once to build the FAISS vector store from sample documents.

Usage:
    python scripts/ingest_docs.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from langchain_aws import BedrockEmbeddings
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config import (
    BEDROCK_EMBEDDING_MODEL_ID,
    SAMPLE_DOCS_PATH,
    VECTOR_STORE_PATH,
)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def ingest_documents() -> None:
    print(f"Loading documents from: {SAMPLE_DOCS_PATH}")

    loader = DirectoryLoader(
        SAMPLE_DOCS_PATH,
        glob="**/*.txt",
        loader_cls=TextLoader,
        show_progress=True,
    )
    raw_documents = loader.load()
    print(f"Loaded {len(raw_documents)} document(s)")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(raw_documents)
    print(f"Split into {len(chunks)} chunk(s)")

    print("Creating embeddings with Amazon Titan Embed Text v2...")
    embeddings = BedrockEmbeddings(model_id=BEDROCK_EMBEDDING_MODEL_ID)

    vector_store = FAISS.from_documents(chunks, embeddings)

    os.makedirs(VECTOR_STORE_PATH, exist_ok=True)
    vector_store.save_local(VECTOR_STORE_PATH)

    print(f"Vector store saved to: {VECTOR_STORE_PATH}")
    print("Ingestion complete.")


if __name__ == "__main__":
    ingest_documents()
