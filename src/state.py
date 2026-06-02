from typing import Annotated, Literal

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict

# All valid agent names + terminal signal
AGENT_NAMES = Literal["researcher", "writer", "FINISH"]


class GraphState(TypedDict):
    # Full message history — add_messages merges new messages instead of overwriting
    messages: Annotated[list[BaseMessage], add_messages]
    # Which agent the supervisor wants to invoke next
    next: str
