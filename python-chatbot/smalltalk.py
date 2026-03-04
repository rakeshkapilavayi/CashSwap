import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq()

def talk(query):
    prompt = f'''You are a helpful and friendly chatbot. Besides answering FAQs and suggesting persons, you can engage in light small talk to make the usage of this cashswap experience more pleasant. Keep your responses concise—no more than two lines—and stay relevant to your role as a cashswap assistant.Here what is cashswap for your reference:CashSwap is a peer-to-peer (P2P) exchange platform that connects users who want to swap physical cash for digital UPI money and vice versa.It is similar to olx,, But in place of Things in olx here in cashswap we have cash and UPI money. You can swap cash for UPI money or UPI money for cash with other users on the platform.CashSwap provides a secure and convenient way to exchange cash and UPI money without the need for a bank account or credit card. It is a great option for people who want to avoid high fees associated with traditional money transfer methods.

    QUESTION: {query}
    '''
    completion = groq_client.chat.completions.create(
        model=os.environ['GROQ_MODEL'],
        messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ]
    )
    return completion.choices[0].message.content

if __name__ == '__main__':
    query = "Hai?"
    answer = talk(query)
    print("Answer:",answer)