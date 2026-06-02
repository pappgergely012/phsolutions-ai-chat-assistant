from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage

from src.config import AWS_REGION, BEDROCK_MODEL_ID
from src.graph import build_graph
from src.rag.retriever import load_retriever

SEPARATOR = "─" * 60


def run_query(query: str) -> str:
    print(f"\n{SEPARATOR}")
    print(f"Query: {query}")
    print(SEPARATOR)

    llm = ChatBedrockConverse(
        model=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
        temperature=0.3,
        max_tokens=2048,
    )

    retriever = load_retriever(top_k=4)
    graph = build_graph(llm, retriever)

    initial_state = {
        "messages": [HumanMessage(content=query)],
        "next": "",
    }

    final_state = graph.invoke(initial_state)

    # The last message from the writer is the final answer
    final_answer = final_state["messages"][-1].content

    print(f"\n{SEPARATOR}")
    print("Final Answer:")
    print(SEPARATOR)
    print(final_answer)
    print(SEPARATOR)

    return final_answer


if __name__ == "__main__":
    sample_queries = [
        "What is AWS Bedrock and which foundation models does it support?",
        "How does LangGraph differ from LangChain?",
        "What is retrieval-augmented generation and why is it useful?",
    ]

    for query in sample_queries:
        run_query(query)
        print()
