from langchain_aws import ChatBedrockConverse
from langchain_core.messages import AIMessage, SystemMessage
from pydantic import BaseModel

from src.state import AGENT_NAMES, GraphState

SUPERVISOR_SYSTEM_PROMPT = """You are a supervisor orchestrating a team of AI agents for PH Solutions, a Hungarian software development company.
Your job is to route user questions to the right specialist agent.

Your team:
- **researcher**: Searches the PH Solutions knowledge base for relevant information. Use this when the question is about PH Solutions services, pricing, tech stack, references, or company info.
- **writer**: Synthesizes all gathered information into a clear, final answer. Use this after the researcher has retrieved relevant context, or for simple greetings and questions that don't need research.
- **FINISH**: Signal that the task is fully complete and the final answer has been written.

Workflow:
1. Evaluate the latest user message and conversation history.
2. If the question needs knowledge base lookup → route to "researcher".
3. Once research is available or the question is straightforward → route to "writer".
4. After the writer has produced the final answer → return "FINISH".

Never route to the same agent twice in a row. Always move the task forward."""


class RouteDecision(BaseModel):
    next: AGENT_NAMES
    reasoning: str


def create_supervisor_node(llm: ChatBedrockConverse):
    structured_llm = llm.with_structured_output(RouteDecision)

    def supervisor_node(state: GraphState) -> dict:
        last_message = state["messages"][-1] if state["messages"] else None
        if isinstance(last_message, AIMessage) and getattr(last_message, "name", None) == "writer":
            print("\n[Supervisor] → writer just finished, routing to: FINISH")
            return {"next": "FINISH"}

        messages = [SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT)] + state["messages"]
        decision: RouteDecision = structured_llm.invoke(messages)

        print(f"\n[Supervisor] → routing to: {decision.next} | reason: {decision.reasoning}")

        return {"next": decision.next}

    return supervisor_node
