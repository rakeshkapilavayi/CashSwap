# This script runs during BUILD to pre-download the sentence transformer model
# so it's cached and doesn't cause timeout on first request
from sentence_transformers import SentenceTransformer
print("Downloading sentence-transformer model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model downloaded and cached successfully!")
