from groq import Groq
import os
import re
import sqlite3
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from pandas import DataFrame
from geopy.distance import geodesic

# Load environment variables
load_dotenv()

# Groq model name from .env
GROQ_MODEL = os.getenv('GROQ_MODEL')

# Initialize Groq client
client_sql = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- Intent Detection Prompt ---
intent_prompt = """You are an expert at analyzing user questions about money exchange to determine what information is missing.

Analyze the user's question and determine:
1. What does the user HAVE? (what they want to give)
2. What does the user WANT? (what they want to receive)
3. Is the amount mentioned?

IMPORTANT: 
- "cash to UPI" means: user HAS cash, WANTS UPI (so find people with UPI available)
- "UPI to cash" means: user HAS UPI, WANTS cash (so find people with cash available)
- "I want cash" means: user WANTS cash (find people with cash)
- "I have UPI" means: user HAS UPI, WANTS cash (find people with cash)

Respond ONLY in this exact format:
USER_HAS: [cash/upi/not_specified]
USER_WANTS: [cash/upi/both/not_specified]
AMOUNT: [number or not_specified]
NEEDS_CLARIFICATION: [yes/no]

Examples:
Question: "Find people near me"
USER_HAS: not_specified
USER_WANTS: not_specified
AMOUNT: not_specified
NEEDS_CLARIFICATION: yes

Question: "I want to exchange cash to UPI"
USER_HAS: cash
USER_WANTS: upi
AMOUNT: not_specified
NEEDS_CLARIFICATION: yes

Question: "I need cash, I have UPI"
USER_HAS: upi
USER_WANTS: cash
AMOUNT: not_specified
NEEDS_CLARIFICATION: yes

Question: "Find people with 500 rupees cash to UPI"
USER_HAS: cash
USER_WANTS: upi
AMOUNT: 500
NEEDS_CLARIFICATION: no

Question: "I want to convert 1000 UPI to cash"
USER_HAS: upi
USER_WANTS: cash
AMOUNT: 1000
NEEDS_CLARIFICATION: no

Question: "Find people with cash"
USER_HAS: not_specified
USER_WANTS: cash
AMOUNT: not_specified
NEEDS_CLARIFICATION: yes

Question: "Show me people with UPI available"
USER_HAS: not_specified
USER_WANTS: upi
AMOUNT: not_specified
NEEDS_CLARIFICATION: yes
"""

# --- SQL Generation Prompt ---
sql_prompt = """You are an expert in understanding the database schema and generating SQL queries for a natural language question asked
pertaining to the data you have. The schema is provided in the schema tags. 

<schema> 
table: users
fields: 
id - integer (primary key, user id)
name - string (name of the user)
email - string (email of the user)
phone - string (phone number of the user)
password_hash - string (hashed password)
latitude - float (latitude coordinate of user location)
longitude - float (longitude coordinate of user location)
profile_photo - string (path to profile photo)
created_at - datetime (account creation timestamp)

table: wallets
fields:
id - integer (primary key, wallet id)
user_id - integer (foreign key to users table)
cash_amount - float (amount of cash the user has available for exchange)
upi_amount - float (amount the user can exchange via UPI)
updated_at - datetime (last update timestamp)

</schema>

Important notes:
- When searching for users with cash, check: cash_amount > 0 (or cash_amount >= specified_amount)
- When searching for users with UPI, check: upi_amount > 0 (or upi_amount >= specified_amount)
- When searching for both cash AND UPI, check: (cash_amount > 0 OR upi_amount > 0)
- Always JOIN users and wallets tables using users.id = wallets.user_id
- For location-based queries, select all users with their coordinates
- Always exclude the current user if user_id is mentioned: WHERE users.id != user_id
- The query should have all relevant fields: users.id, users.name, users.email, users.phone, users.latitude, users.longitude, wallets.cash_amount, wallets.upi_amount

Just the SQL query is needed, nothing more. Always provide the SQL in between the <SQL></SQL> tags.
"""

# --- Comprehension Prompt ---
comprehension_prompt = """You are an expert in understanding the context of money exchange questions and replying based on the user data provided. 

You will be provided with Question: and Data:. The data contains user information with their available cash/UPI amounts and distance from the requester.

Reply in natural, friendly language without technical jargon. Do not say "Based on the data" or similar phrases.

When listing users available for money exchange, format the response as:

Here are the people near you who can exchange money:

1. **[Name]**
   - Phone: [phone]
   - Available Cash: Rs. [cash_amount]
   - Available UPI: Rs. [upi_amount]
   - Distance: [distance] km away

2. **[Name]**
   - Phone: [phone]
   - Available Cash: Rs. [cash_amount]
   - Available UPI: Rs. [upi_amount]
   - Distance: [distance] km away

If no users are found, reply: "Sorry, there are no users available near you for money exchange at the moment."

Be conversational and helpful in your response.
"""

# --- Function to detect intent and missing information ---
def detect_intent(question):
    chat_completion = client_sql.chat.completions.create(
        messages=[
            {"role": "system", "content": intent_prompt},
            {"role": "user", "content": question},
        ],
        model=GROQ_MODEL,
        temperature=0.1,
        max_tokens=256
    )
    
    response = chat_completion.choices[0].message.content
    
    # Parse response
    user_has = "not_specified"
    user_wants = "not_specified"
    amount = "not_specified"
    needs_clarification = "yes"
    
    for line in response.split('\n'):
        if 'USER_HAS:' in line:
            user_has = line.split(':')[1].strip()
        elif 'USER_WANTS:' in line:
            user_wants = line.split(':')[1].strip()
        elif 'AMOUNT:' in line:
            amount = line.split(':')[1].strip()
        elif 'NEEDS_CLARIFICATION:' in line:
            needs_clarification = line.split(':')[1].strip()
    
    return {
        'user_has': user_has,
        'user_wants': user_wants,
        'amount': amount,
        'needs_clarification': needs_clarification == 'yes'
    }


# --- Function to ask clarifying questions ---
def ask_clarification(intent_info):
    """Ask user for missing information"""
    messages = []
    
    # First ask what they WANT (more important for finding matches)
    if intent_info['user_wants'] == 'not_specified':
        messages.append("What do you want to receive?")
        messages.append("1. Cash (find people with cash)")
        messages.append("2. UPI (find people with UPI)")
        messages.append("3. Either (cash or UPI)")
        print("\n".join(messages))
        
        choice = input("\nEnter your choice (1/2/3): ").strip()
        if choice == '1':
            intent_info['user_wants'] = 'cash'
        elif choice == '2':
            intent_info['user_wants'] = 'upi'
        elif choice == '3':
            intent_info['user_wants'] = 'both'
        else:
            print("Invalid choice. Defaulting to 'both'.")
            intent_info['user_wants'] = 'both'
    
    # Then ask what they HAVE (for context)
    if intent_info['user_has'] == 'not_specified' and intent_info['user_wants'] != 'both':
        # If they want cash, they probably have UPI, and vice versa
        if intent_info['user_wants'] == 'cash':
            intent_info['user_has'] = 'upi'
            print(f"\n(Assuming you have UPI and want to exchange it for cash)")
        elif intent_info['user_wants'] == 'upi':
            intent_info['user_has'] = 'cash'
            print(f"\n(Assuming you have cash and want to exchange it for UPI)")
    
    if intent_info['amount'] == 'not_specified':
        amount_input = input("\nHow much money do you want to exchange? (Enter amount in rupees or 'any'): ").strip()
        if amount_input.lower() in ['any', 'all', '']:
            intent_info['amount'] = 0
        else:
            try:
                intent_info['amount'] = float(amount_input)
            except ValueError:
                print("Invalid amount. Searching for any available amount.")
                intent_info['amount'] = 0
    
    return intent_info


# --- Function to build enhanced question ---
def build_enhanced_question(original_question, intent_info, current_user_id):
    """
    Build a complete question with all necessary information.
    
    KEY LOGIC:
    - user_wants = 'cash' → find users with cash_amount > 0
    - user_wants = 'upi' → find users with upi_amount > 0
    - user_wants = 'both' → find users with either
    """
    
    user_wants = intent_info['user_wants']
    amount = intent_info['amount']
    
    # Convert amount to float if it's a string number
    try:
        amount_val = float(amount) if amount != 'not_specified' else 0
    except:
        amount_val = 0
    
    # Build the query based on what the user WANTS (not what they have)
    # Because we need to find people who HAVE what the user WANTS
    if user_wants == 'cash':
        # User wants cash → find people with cash
        if amount_val > 0:
            enhanced = f"Find all users who have at least {amount_val} rupees in cash_amount"
        else:
            enhanced = "Find all users who have cash_amount greater than 0"
    elif user_wants == 'upi':
        # User wants UPI → find people with UPI
        if amount_val > 0:
            enhanced = f"Find all users who have at least {amount_val} rupees in upi_amount"
        else:
            enhanced = "Find all users who have upi_amount greater than 0"
    else:  # both
        # User wants either → find people with cash OR UPI
        if amount_val > 0:
            enhanced = f"Find all users who have at least {amount_val} rupees in either cash_amount or upi_amount"
        else:
            enhanced = "Find all users who have either cash_amount greater than 0 or upi_amount greater than 0"
    
    # Add user exclusion
    if current_user_id:
        enhanced += f" and exclude user with id = {current_user_id}"
    
    return enhanced


# --- Function to generate SQL query ---
def generate_sql_query(question):
    chat_completion = client_sql.chat.completions.create(
        messages=[
            {"role": "system", "content": sql_prompt},
            {"role": "user", "content": question},
        ],
        model=GROQ_MODEL,
        temperature=0.2,
        max_tokens=1024
    )

    return chat_completion.choices[0].message.content


# --- Function to calculate distance between two coordinates ---
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in kilometers between two coordinates"""
    try:
        return round(geodesic((lat1, lon1), (lat2, lon2)).kilometers, 2)
    except:
        return None


# --- Function to filter users by radius ---
def filter_by_radius(df, user_lat, user_lon, radius_km=10):
    """Filter dataframe to only include users within specified radius"""
    if df is None or df.empty:
        print("⚠️ DEBUG: DataFrame is None or empty in filter_by_radius")
        return df
    
    print(f"\n🔍 DEBUG - Filtering by radius: {radius_km} km")
    print(f"User location: ({user_lat}, {user_lon})")
    
    distances = []
    for idx, row in df.iterrows():
        distance = calculate_distance(user_lat, user_lon, row['latitude'], row['longitude'])
        distances.append(distance)
        print(f"  User {row.get('name', 'Unknown')}: {distance} km away")
    
    df['distance'] = distances
    
    # Show before filtering
    print(f"\nBefore radius filter: {len(df)} users")
    
    df = df[df['distance'] <= radius_km]
    
    # Show after filtering
    print(f"After radius filter ({radius_km} km): {len(df)} users")
    
    if df.empty:
        print(f"❌ All users were filtered out! Try increasing radius beyond {radius_km} km")
    
    df = df.sort_values('distance')
    
    return df


# --- Function to run SQL query on SQLite ---
def run_query(query):
    try:
        db_path = Path(__file__).parent / "cashswap.db"
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        # Debug: Print the query results
        print(f"\n🔍 DEBUG - Query returned {len(df)} rows")
        if not df.empty:
            print("Sample data:")
            print(df.head())
        else:
            print("⚠️ WARNING: Query returned no results!")
        
        return df
    except Exception as e:
        print("Error executing query:", e)
        return None


# --- Function to generate natural language response from data ---
def data_comprehension(question, context):
    chat_completion = client_sql.chat.completions.create(
        messages=[
            {"role": "system", "content": comprehension_prompt},
            {"role": "user", "content": f"QUESTION: {question}. DATA: {context}"},
        ],
        model=GROQ_MODEL,
        temperature=0.2,
    )

    return chat_completion.choices[0].message.content


# --- Main chain with clarification ---
def sql_chain_with_clarification(question, user_lat=None, user_lon=None, radius_km=10, current_user_id=None):
    """
    Main function to process money exchange queries with clarification
    
    Args:
        question: Natural language question
        user_lat: Current user's latitude (required for location-based queries)
        user_lon: Current user's longitude (required for location-based queries)
        radius_km: Search radius in kilometers (default: 10)
        current_user_id: ID of current user to exclude from results
    """
    
    print("\n" + "="*80)
    print("ANALYZING YOUR QUERY...")
    print("="*80)
    
    # Step 1: Detect intent and missing information
    intent_info = detect_intent(question)
    
    print(f"\nUser Has: {intent_info['user_has']}")
    print(f"User Wants: {intent_info['user_wants']}")
    print(f"Amount: {intent_info['amount']}")
    print(f"Needs Clarification: {intent_info['needs_clarification']}")
    
    # Step 2: Ask for clarification if needed
    if intent_info['needs_clarification']:
        print("\n" + "="*80)
        print("I need some more information to help you better:")
        print("="*80)
        intent_info = ask_clarification(intent_info)
    
    # Step 3: Build enhanced question
    enhanced_question = build_enhanced_question(question, intent_info, current_user_id)
    print("\n" + "="*80)
    print("SEARCHING FOR USERS...")
    print("="*80)
    print(f"Enhanced Query: {enhanced_question}")
    
    # Step 4: Generate SQL
    sql_query = generate_sql_query(enhanced_question)
    pattern = "<SQL>(.*?)</SQL>"
    matches = re.findall(pattern, sql_query, re.DOTALL)

    if len(matches) == 0:
        return "Sorry, I couldn't generate a query for your question. Please try rephrasing."

    query = matches[0].strip()
    print("\nGenerated SQL Query:\n", query)

    # Step 5: Execute query
    response = run_query(query)
    
    if response is None:
        return "Sorry, there was a problem executing the query."
    
    if response.empty:
        return "Sorry, no users found matching your criteria."

    # Step 6: Filter by radius if location is provided
    if user_lat is not None and user_lon is not None:
        if 'latitude' in response.columns and 'longitude' in response.columns:
            response = filter_by_radius(response, user_lat, user_lon, radius_km)
            
            if response.empty:
                return f"Sorry, no users found within {radius_km} km of your location."
    
    # Step 7: Generate natural language response
    context = response.to_dict(orient='records')
    answer = data_comprehension(enhanced_question, context)
    return answer


# --- Run examples ---
if __name__ == "__main__":
    print("\n" + "🔄 CASHSWAP MONEY EXCHANGE SYSTEM 🔄".center(80))
    print("="*80)
    
    # Example 1: Cash to UPI (user has cash, wants UPI - so find people with UPI)
    print("\n\n📍 SCENARIO 1: User wants to exchange cash to UPI")
    print("="*80)
    question1 = "I want to exchange 500 cash to UPI"
    answer1 = sql_chain_with_clarification(
        question=question1,
        user_lat=16.5062,
        user_lon=80.648,
        radius_km=10,
        current_user_id=1
    )
    print("\n" + "="*80)
    print("FINAL ANSWER:")
    print("="*80)
    print(answer1)
    
    print("\n\n" + "="*80)
    print("="*80)
    
    # Example 2: UPI to cash (user has UPI, wants cash - so find people with cash)
    print("\n\n📍 SCENARIO 2: User wants to exchange UPI to cash")
    print("="*80)
    question2 = "I need 1000 rupees cash, I have UPI"
    answer2 = sql_chain_with_clarification(
        question=question2,
        user_lat=16.5562,
        user_lon=81.523,
        radius_km=15,
        current_user_id=2
    )
    print("\n" + "="*80)
    print("FINAL ANSWER:")
    print("="*80)
    print(answer2)
    
    print("\n\n" + "="*80)
    print("="*80)
    
    # Example 3: Generic query - will ask for clarification
    print("\n\n📍 SCENARIO 3: Generic query")
    print("="*80)
    question3 = "Find people near me for money exchange"
    answer3 = sql_chain_with_clarification(
        question=question3,
        user_lat=16.5604,
        user_lon=81.522,
        radius_km=20,
        current_user_id=3
    )
    print("\n" + "="*80)
    print("FINAL ANSWER:")
    print("="*80)
    print(answer3)