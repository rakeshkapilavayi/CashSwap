from flask import Flask, request, jsonify
from flask_cors import CORS
from faq import ingest_faq_data, faq_chain
from pathlib import Path
from router import router
from sql import (
    detect_intent,
    build_enhanced_question,
    generate_sql_query,
    run_query,
    filter_by_radius,
    data_comprehension
)
from smalltalk import talk
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize FAQ data
faqs_path = Path(__file__).parent / "resources/cashswap_chatbot_faq.csv"
ingest_faq_data(faqs_path)

print("🤖 CashSwap AI Chatbot API Started!")
print("=" * 60)


def handle_sql_query(query, user_id, user_location):
    """Handle SQL queries with clarification flow"""
    
    # Step 1: Detect intent
    intent_info = detect_intent(query)
    
    # Step 2: Check if clarification is needed
    if intent_info['needs_clarification']:
        if intent_info['user_wants'] == 'not_specified':
            return {
                "needs_clarification": True,
                "message": """I'd be happy to help you find people for money exchange! 

**What do you want to receive?** (What are you looking for?)
- **Cash** - You want to receive physical cash
- **UPI** - You want to receive UPI payment
- **Either** - You're okay with cash or UPI

Please type: `cash`, `upi`, or `either`""",
                "clarification_type": "user_wants",
                "intent_info": intent_info
            }
        
        elif intent_info['amount'] == 'not_specified':
            wants_text = intent_info['user_wants'].upper() if intent_info['user_wants'] != 'both' else 'cash or UPI'
            return {
                "needs_clarification": True,
                "message": f"""Great! I'll help you find people with **{wants_text}** available.

**How much money do you want to exchange?**

Please enter the amount in rupees (e.g., `500`, `1000`, `2000`)

Or type `any` if you want to see all available amounts.""",
                "clarification_type": "amount",
                "intent_info": intent_info
            }
    
    else:
        # No clarification needed, proceed with query
        return execute_sql_query(query, intent_info, user_id, user_location)


def execute_sql_query(original_query, intent_info, user_id, user_location):
    """Execute the SQL query with complete information"""
    
    try:
        # Build enhanced question
        enhanced_question = build_enhanced_question(
            original_query, 
            intent_info, 
            user_id
        )
        
        # Generate SQL
        sql_query = generate_sql_query(enhanced_question)
        pattern = "<SQL>(.*?)</SQL>"
        matches = re.findall(pattern, sql_query, re.DOTALL)
        
        if len(matches) == 0:
            return {
                "needs_clarification": False,
                "message": "❌ Sorry, I couldn't generate a query for your question. Please try rephrasing.",
                "users": []
            }
        
        query = matches[0].strip()
        
        # Execute query
        response = run_query(query)
        
        if response is None:
            return {
                "needs_clarification": False,
                "message": "❌ Sorry, there was a problem executing the query.",
                "users": []
            }
        
        if response.empty:
            return {
                "needs_clarification": False,
                "message": "😔 Sorry, no users found matching your criteria.",
                "users": []
            }
        
        # Filter by radius
        if user_location and 'latitude' in user_location and 'longitude' in user_location:
            user_lat = user_location['latitude']
            user_lon = user_location['longitude']
            radius_km = user_location.get('radius', 10)
            
            if 'latitude' in response.columns and 'longitude' in response.columns:
                response = filter_by_radius(response, user_lat, user_lon, radius_km)
                
                if response.empty:
                    return {
                        "needs_clarification": False,
                        "message": f"😔 Sorry, no users found within {radius_km} km of your location. Try increasing the search radius in settings.",
                        "users": []
                    }
        
        # Generate natural language response
        context = response.to_dict(orient='records')
        answer = data_comprehension(enhanced_question, context)
        
        # Add exchange type explanation for clarity
        wants_text = "cash" if intent_info['user_wants'] == 'cash' else ("UPI" if intent_info['user_wants'] == 'upi' else "cash or UPI")
        has_text = "cash" if intent_info['user_has'] == 'cash' else ("UPI" if intent_info['user_has'] == 'upi' else "money")
        
        if intent_info['user_has'] != 'not_specified' and intent_info['user_wants'] != 'not_specified' and intent_info['user_wants'] != 'both':
            answer = f"**Exchange: Your {has_text.upper()} → Their {wants_text.upper()}**\n\n" + answer
        
        # Add helpful footer
        radius_km = user_location.get('radius', 10) if user_location else 10
        answer += f"\n\n---\n📍 *Search radius: {radius_km} km from your location*"
        
        return {
            "needs_clarification": False,
            "message": answer,
            "users": context  # ADD THIS LINE - Return user data
        }
        
    except Exception as e:
        return {
            "needs_clarification": False,
            "message": f"❌ An error occurred: {str(e)}\n\nPlease try again or contact support.",
            "users": []
        }

def handle_clarification_response(response_text, clarification_type, intent_info, user_id, user_location):
    """Process user's clarification response"""
    
    if clarification_type == "user_wants":
        # User is providing what they WANT to receive
        response_lower = response_text.lower().strip()
        
        if "cash" in response_lower and "upi" not in response_lower:
            intent_info['user_wants'] = 'cash'
            if intent_info['user_has'] == 'not_specified':
                intent_info['user_has'] = 'upi'
        elif "upi" in response_lower and "cash" not in response_lower:
            intent_info['user_wants'] = 'upi'
            if intent_info['user_has'] == 'not_specified':
                intent_info['user_has'] = 'cash'
        elif "either" in response_lower or "both" in response_lower or ("cash" in response_lower and "upi" in response_lower):
            intent_info['user_wants'] = 'both'
        else:
            return {
                "needs_clarification": True,
                "message": "❌ I didn't understand. Please type: `cash`, `upi`, or `either`",
                "clarification_type": "user_wants",
                "intent_info": intent_info
            }
        
        # Now ask for amount
        if intent_info['amount'] == 'not_specified':
            wants_text = intent_info['user_wants'].upper() if intent_info['user_wants'] != 'both' else 'cash or UPI'
            return {
                "needs_clarification": True,
                "message": f"""Perfect! Looking for people with **{wants_text}** available.

**Now, how much money do you want to exchange?**

Please enter the amount in rupees (e.g., `500`, `1000`, `2000`)

Or type `any` if you want to see all available amounts.""",
                "clarification_type": "amount",
                "intent_info": intent_info
            }
        else:
            # Amount already specified, execute query
            return execute_sql_query(response_text, intent_info, user_id, user_location)
    
    elif clarification_type == "amount":
        # User is providing amount
        response_lower = response_text.lower().strip()
        
        if "any" in response_lower or "all" in response_lower:
            intent_info['amount'] = 0
        else:
            # Try to extract number
            numbers = re.findall(r'\d+', response_text)
            if numbers:
                intent_info['amount'] = float(numbers[0])
            else:
                return {
                    "needs_clarification": True,
                    "message": "❌ I couldn't find a valid amount. Please enter a number (e.g., `500`) or type `any`",
                    "clarification_type": "amount",
                    "intent_info": intent_info
                }
        
        # Now execute the query
        return execute_sql_query(response_text, intent_info, user_id, user_location)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "CashSwap AI Chatbot is running!"})


@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.json
        query = data.get('message', '')
        user_id = data.get('user_id', 1)
        user_location = data.get('user_location', {
            'latitude': 16.5062,
            'longitude': 80.648,
            'radius': 10
        })
        
        if not query:
            return jsonify({"error": "Message is required"}), 400
        
        # Route the query
        route = router(query).name
        print(f"📍 Route: {route} | Query: {query}")
        
        if route == 'faq':
            answer = faq_chain(query)
            return jsonify({
                "message": answer,
                "route": "faq",
                "needs_clarification": False
            })
        
        elif route == 'sql':
            result = handle_sql_query(query, user_id, user_location)
            result['route'] = 'sql'
            return jsonify(result)
        
        elif route == 'small_talk':
            answer = talk(query)
            return jsonify({
                "message": answer,
                "route": "small_talk",
                "needs_clarification": False
            })
        
        else:
            return jsonify({
                "message": f"❗ Route `{route}` not implemented yet.",
                "route": route,
                "needs_clarification": False
            })
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Sorry, I encountered an error. Please try again!"
        }), 500


@app.route('/clarify', methods=['POST'])
def clarify():
    """Handle clarification responses"""
    try:
        data = request.json
        query = data.get('message', '')
        clarification_type = data.get('clarification_type', '')
        intent_info = data.get('intent_info', {})
        user_id = data.get('user_id', 1)
        user_location = data.get('user_location', {
            'latitude': 16.5062,
            'longitude': 80.648,
            'radius': 10
        })
        
        result = handle_clarification_response(
            query, 
            clarification_type, 
            intent_info, 
            user_id, 
            user_location
        )
        
        result['route'] = 'sql'
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ Clarification Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Sorry, something went wrong!"
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting CashSwap AI Chatbot API Server...")
    print("="*60)
    print("📍 Endpoints:")
    print("   GET  /health  - Health check")
    print("   POST /chat    - Main chat endpoint")
    print("   POST /clarify - Clarification handling")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)