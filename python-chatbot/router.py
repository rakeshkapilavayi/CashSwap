from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

class RouteChoice:
    def __init__(self, name):
        self.name = name

ROUTING_PROMPT = """You are a router for a money exchange chatbot called CashSwap.
Classify the user query into exactly one of these 4 categories:

1. faq
   Questions about CashSwap service, policies, safety, fees, how it works.
   Examples:
   - "What is CashSwap?"
   - "How does CashSwap work?"
   - "Is the money exchange safe?"
   - "What is the process to exchange money?"
   - "How do I verify the other person?"
   - "What are the terms and conditions?"
   - "Is there any fee for using CashSwap?"
   - "How can I trust the person exchanging money?"
   - "What should I do if there's a problem with exchange?"
   - "How do I report a fraudulent user?"
   - "Can I cancel an exchange request?"
   - "What are the payment security measures?"

2. sql
   Requests to find/search for nearby people to exchange cash or UPI money.
   Examples:
   - "i need to exchange 400 cash to upi"
   - "Find people near me who can exchange money"
   - "Is there anyone with cash available?"
   - "Show me users who have UPI"
   - "Find people with at least 500 rupees cash"
   - "Who can exchange 1000 rupees nearby?"
   - "Are there people with cash within 5 km?"
   - "Show me users with UPI amount above 2000"
   - "Find someone who can give me cash for UPI"
   - "Is there anyone near me with money to exchange?"
   - "Who has the most cash available?"
   - "List all users with money near my location"

3. radius_change
   Requests to expand search area, increase radius, or show more users from a previous search.
   Examples:
   - "increase the radius"
   - "expand the search radius"
   - "show more users"
   - "show more people"
   - "show users in 25 km"
   - "show more users in 30 km"
   - "find people within 40 km"
   - "search within 50 km"
   - "expand to 20 km"
   - "wider search"
   - "increase distance"
   - "more results please"
   - "look further away"
   - "extend search to 30 km"

4. small_talk
   Greetings, casual conversation, compliments, goodbye.
   Examples:
   - "Hi", "Hello", "Hey there", "Good morning"
   - "How are you?", "What is your name?", "Are you a robot?"
   - "What are you?", "What do you do?"
   - "Nice to meet you", "How's it going?", "What's up?"
   - "Thanks", "Thank you for your help!"
   - "Bye", "Goodbye", "See you later"

Reply with ONLY one word: faq, sql, radius_change, or small_talk

User query: {query}"""


class GroqRouter:
    def __call__(self, query):
        response = get_client().chat.completions.create(
            messages=[{"role": "user", "content": ROUTING_PROMPT.format(query=query)}],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0,
            max_tokens=10
        )
        route = response.choices[0].message.content.strip().lower()
        if route not in ['faq', 'sql', 'radius_change', 'small_talk']:
            route = 'small_talk'
        return RouteChoice(route)


def get_router():
    return GroqRouter()
