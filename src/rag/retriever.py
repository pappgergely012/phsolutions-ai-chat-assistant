import os

from langchain_aws import BedrockEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.vectorstores import VectorStoreRetriever

from src.config import BEDROCK_EMBEDDING_MODEL_ID, VECTOR_STORE_PATH


def load_retriever(
    top_k: int = 4,
) -> VectorStoreRetriever:
    if not os.path.exists(VECTOR_STORE_PATH):
        raise FileNotFoundError(
            f"Vector store not found at '{VECTOR_STORE_PATH}'. "
            "Run `python scripts/ingest_docs.py` first to build it."
        )

    embeddings = BedrockEmbeddings(model_id=BEDROCK_EMBEDDING_MODEL_ID)
    vector_store = FAISS.load_local(
        VECTOR_STORE_PATH,
        embeddings,
        allow_dangerous_deserialization=True,
    )

    return vector_store.as_retriever(search_kwargs={"k": top_k})
