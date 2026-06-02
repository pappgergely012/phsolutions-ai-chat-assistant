import os

from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-haiku-20241022-v1:0")
BEDROCK_EMBEDDING_MODEL_ID = os.getenv("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v2:0")

VECTOR_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "vectorstore")
SAMPLE_DOCS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sample_docs")
