from semantic_router import Route
from semantic_router.routers import SemanticRouter
from semantic_router.encoders import HuggingFaceEncoder

encoder = HuggingFaceEncoder(
    name="sentence-transformers/all-MiniLM-L6-v2"
)

# FAQ Route - General questions about the CashSwap service
faq = Route(
    name='faq',
    utterances=[
        "What is CashSwap?",
        "what can i do with CashSwap?",
        "How does CashSwap work?",
        "How it works?",
        "Is the money exchange safe?",
        "What is the process to exchange money?",
        "How do I verify the other person?",
        "What are the terms and conditions?",
        "Is there any fee for using CashSwap?",
        "How can I trust the person exchanging money?",
        "What should I do if there's a problem with exchange?",
        "How do I report a fraudulent user?",
        "Can I cancel an exchange request?",
        "What are the payment security measures?",
    ],
    score_threshold=0.2
)

# SQL Route - Questions requiring database queries about users and money exchange
sql = Route(
    name='sql',
    utterances=[
        "i need to exchange 400 cash to upi",
        "Find people near me who can exchange money",
        "Is there anyone with cash available?",
        "Show me users who have UPI",
        "Find people with at least 500 rupees cash",
        "Who can exchange 1000 rupees nearby?",
        "Are there people with cash within 5 km?",
        "Show me users with UPI amount above 2000",
        "Find someone who can give me cash for UPI",
        "Is there anyone near me with money to exchange?",
        "Show people who have both cash and UPI",
        "Find users within 10 km with cash",
        "Who has the most cash available?",
        "List all users with money near my location",
        "Find people who can exchange 300 rupees",
        "Show me nearby users with at least 100 rupees",
    ],
    score_threshold=0.2
)

# Small Talk Route - Casual conversations
small_talk = Route(
    name='small_talk',
    utterances=[
        "How are you?",
        "What is your name?",
        "Are you a robot?",
        "Hi",
        "Hello",
        "Hey there",
        "Good morning",
        "What are you?",
        "What do you do?",
        "Nice to meet you",
        "How's it going?",
        "What's up?",
        "Thanks",
        "Thank you for your help!",
        "Bye",
        "Goodbye",
        "See you later",
    ],
    score_threshold=0.2
)


router = SemanticRouter(routes=[faq, sql, small_talk], encoder=encoder, auto_sync="local")

if __name__ == "__main__":
    # Test cases for CashSwap
    print("=" * 80)
    print("TESTING CASHSWAP SEMANTIC ROUTER")
    print("=" * 80)
    
    # FAQ Tests
    print("\n📋 FAQ TESTS:")
    print("-" * 80)
    test1 = "How does money exchange work on this platform?"
    print(f"Query: {test1}")
    print(f"Route: {router(test1).name}")
    print()
    
    test2 = "Is it safe to exchange money with strangers?"
    print(f"Query: {test2}")
    print(f"Route: {router(test2).name}")
    print()
    
    # SQL Tests
    print("\n🔍 SQL DATABASE QUERY TESTS:")
    print("-" * 80)
    test3 = "Find people near me who have cash"
    print(f"Query: {test3}")
    print(f"Route: {router(test3).name}")
    print()
    
    test4 = "Show me users within 5km with at least 1000 rupees"
    print(f"Query: {test4}")
    print(f"Route: {router(test4).name}")
    print()
    
    test5 = "Is there anyone nearby who can do UPI exchange?"
    print(f"Query: {test5}")
    print(f"Route: {router(test5).name}")
    print()
    
    test6 = "Who has money available for exchange?"
    print(f"Query: {test6}")
    print(f"Route: {router(test6).name}")
    print()
    
    # Small Talk Tests
    print("\n💬 SMALL TALK TESTS:")
    print("-" * 80)
    test7 = "Hey, how are you doing?"
    print(f"Query: {test7}")
    print(f"Route: {router(test7).name}")
    print()
    
    test8 = "My name is Rakesh, nice to meet you"
    print(f"Query: {test8}")
    print(f"Route: {router(test8).name}")
    print()
    
    test9 = "Thank you for your help!"
    print(f"Query: {test9}")
    print(f"Route: {router(test9).name}")
    print()
    
    print("=" * 80)