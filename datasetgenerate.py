import json
import random
from datetime import datetime, timedelta

# Configuration
START_DATE = datetime(2023, 10, 27) # Base date for the simulation

nodes = []
links = []

# --- 1. Create Financial Hubs (Distinct "Cash Out" points) ---
laundering_hubs = [
    { "id": "WALLET_BTC_MAIN", "instrument": "Crypto", "label": "Investment Scam Cold Wallet", "risk": 99 },
    { "id": "ACC_CBA_MULE", "instrument": "Bank Account", "label": "Mule Account (Banking Scams)", "risk": 85 },
    { "id": "ID_WESTERN_UNION", "instrument": "Money Transfer", "label": "Overseas Transfer (Romance)", "risk": 75 },
    { "id": "WALLET_BETTING_APP", "instrument": "Gambling Platform", "label": "Illicit Betting Pot", "risk": 90 }
]

for hub in laundering_hubs:
    nodes.append({
        "id": hub["id"],
        "group": "financial_node",
        "financial_instrument": hub["instrument"],
        "risk": hub["risk"],
        "label": hub["label"],
        "size": 50 # Hubs are largest
    })

# --- 2. Create Scammers (Assign them specific Scam Types) ---
scam_types = ["Investment", "Banking", "Romance", "Gambling"]
scammers = []

# Create 3 Scammers for EACH type (12 total scammers)
for s_type in scam_types:
    for i in range(3): 
        s_id = f"SCAMMER_{s_type.upper()}_{i+1}"
        scammers.append({"id": s_id, "type": s_type})
        
        # Decide which Financial Hub this scammer uses based on their Type
        if s_type == "Investment": target_hub = "WALLET_BTC_MAIN"
        elif s_type == "Banking": target_hub = "ACC_CBA_MULE"
        elif s_type == "Romance": target_hub = "ID_WESTERN_UNION"
        else: target_hub = "WALLET_BETTING_APP" # Gambling

        nodes.append({
            "id": s_id,
            "group": "scammer",
            "scam_type": s_type, # <--- Used for Filtering Colors
            "risk": random.randint(80, 100),
            "label": f"{s_type} Actor {i+1}",
            "size": 30
        })

        # Link Scammer -> Hub (Money Laundering)
        links.append({
            "source": s_id,
            "target": target_hub,
            "type": "laundering",
            "amount": random.randint(5000, 50000),
            "timestamp": (START_DATE + timedelta(hours=23)).isoformat() # Cash out at end of day
        })

# --- 3. Create Victims & Generate Time-Specific Traffic ---
for i in range(80): # 80 Victims
    v_id = f"VICTIM_{i+1}"
    
    # Pick a random scammer to target this victim
    assigned_scammer = random.choice(scammers)
    s_type = assigned_scammer["type"]

    # --- THE TIME TRICK (CRITICAL FOR YOUR DEMO) ---
    # We force the timestamps to match the "Pattern" of the scam type
    if s_type == "Banking":
        # Business Hours: 9 AM - 5 PM
        hour = random.randint(9, 17)
    elif s_type == "Investment":
        # After Work: 5 PM - 9 PM
        hour = random.randint(17, 21)
    elif s_type == "Romance":
        # Late Night: 8 PM - 2 AM
        hour = random.choice([20, 21, 22, 23, 0, 1, 2])
    elif s_type == "Gambling":
        # All Night: 10 PM - 4 AM
        hour = random.choice([22, 23, 0, 1, 2, 3, 4])
    
    # Create the timestamp
    event_time = START_DATE + timedelta(hours=hour, minutes=random.randint(0, 59))

    nodes.append({
        "id": v_id,
        "group": "victim",
        "risk": random.randint(10, 40),
        "label": f"Victim {i+1}",
        "size": 15
    })

    # Link Scammer -> Victim
    links.append({
        "source": assigned_scammer["id"],
        "target": v_id,
        "type": "attack",
        "scam_type": s_type, # Pass type to link for coloring lines
        "method": random.choice(["Phone", "SMS", "Email", "WhatsApp"]),
        "timestamp": event_time.isoformat()
    })

# Output
print(json.dumps({"nodes": nodes, "links": links}, indent=2))
