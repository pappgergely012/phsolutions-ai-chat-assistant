from langchain_aws import ChatBedrockConverse
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.vectorstores import VectorStoreRetriever

from src.state import GraphState

RESEARCHER_SYSTEM_PROMPT = """You are a research specialist with access to the PH Solutions knowledge base.
You have been given retrieved context from the knowledge base about PH Solutions' services, tech stack, pricing, and references.
Summarize the most relevant information clearly and concisely so the writer agent can use it to answer the user's question.
If the context doesn't contain relevant information, say so explicitly."""


def extract_latest_user_question(messages: list) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return message.content
    return ""


def create_researcher_node(llm: ChatBedrockConverse, retriever: VectorStoreRetriever):
    def researcher_node(state: GraphState) -> dict:
        query = extract_latest_user_question(state["messages"])

        print(f"\n[Researcher] Retrieving docs for: '{query}'")

        retrieved_docs = retriever.invoke(query)
        context = "\n\n---\n\n".join(
            f"[Doc {index + 1}] {doc.page_content}"
            for index, doc in enumerate(retrieved_docs)
        )

        print(f"[Researcher] Found {len(retrieved_docs)} document(s)")

        research_prompt = f"User question: {query}\n\nRetrieved context:\n{context}"
        messages = [SystemMessage(content=RESEARCHER_SYSTEM_PROMPT), HumanMessage(content=research_prompt)]

        response = llm.invoke(messages)

        research_summary = AIMessage(
            content=f"[Research findings]\n{response.content}",
            name="researcher",
        )

        return {"messages": [research_summary]}

    return researcher_node
