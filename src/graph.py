from langchain_aws import BedrockEmbeddings, ChatBedrockConverse
from langchain_core.vectorstores import VectorStoreRetriever
from langgraph.graph import END, START, StateGraph

from src.agents.researcher import create_researcher_node
from src.agents.supervisor import create_supervisor_node
from src.agents.writer import create_writer_node
from src.state import GraphState


def route_from_supervisor(state: GraphState) -> str:
    next_agent = state.get("next", "FINISH")
    
    if next_agent == "FINISH":
        return END
    return next_agent


def build_graph(llm: ChatBedrockConverse, retriever: VectorStoreRetriever):
    supervisor_node = create_supervisor_node(llm)
    researcher_node = create_researcher_node(llm, retriever)
    writer_node = create_writer_node(llm)

    graph = StateGraph(GraphState)

    graph.add_node("supervisor", supervisor_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("writer", writer_node)

    # Entry point → supervisor always decides first
    graph.add_edge(START, "supervisor")

    # Supervisor routes conditionally
    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "researcher": "researcher",
            "writer": "writer",
            END: END,
        },
    )

    # After each agent finishes, return to supervisor for next decision
    graph.add_edge("researcher", "supervisor")
    graph.add_edge("writer", "supervisor")

    return graph.compile()
