import json
import random
from datetime import datetime, timedelta

# Configuration
START_DATE = datetime(2023, 10, 27) 

nodes = []
links = []

# --- 1. Define Victim Locations (Australian Cities) ---
# Used to demonstrate geospatial filtering
VICTIM_LOCATIONS = [
    "Sydney, NSW", "Melbourne, VIC", "Brisbane, QLD", 
    "Perth, WA", "Adelaide, SA", "Gold Coast, QLD", 
    "Canberra, ACT", "Newcastle, NSW"
]

# --- 2. Create Financial Hubs (Cash Out Points) ---
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
        "location": "Unknown (Offshore)", # Hubs are usually hidden
        "size": 50 
    })

# --- 3. Create Scammers ---
scam_types = ["Investment", "Banking", "Romance", "Gambling"]
scammers = []

for s_type in scam_types:
    for i in range(3): 
        s_id = f"SCAMMER_{s_type.upper()}_{i+1}"
        scammers.append({"id": s_id, "type": s_type})
        
        # Determine Hub
        if s_type == "Investment": target_hub = "WALLET_BTC_MAIN"
        elif s_type == "Banking": target_hub = "ACC_CBA_MULE"
        elif s_type == "Romance": target_hub = "ID_WESTERN_UNION"
        else: target_hub = "WALLET_BETTING_APP"

        nodes.append({
            "id": s_id,
            "group": "scammer",
            "scam_type": s_type,
            "risk": random.randint(80, 100),
            "label": f"{s_type} Actor {i+1}",
            "location": random.choice(["Lagos, Nigeria", "Moscow, Russia", "Kolkata, India", "Manila, Philippines"]), # Scammer origins
            "size": 30
        })

        links.append({
            "source": s_id,
            "target": target_hub,
            "type": "laundering",
            "amount": random.randint(5000, 50000),
            "timestamp": (START_DATE + timedelta(hours=23)).isoformat()
        })

# --- 4. Create Victims with Locations ---
for i in range(80): 
    v_id = f"VICTIM_{i+1}"
    assigned_scammer = random.choice(scammers)
    s_type = assigned_scammer["type"]

    # Assign Time Pattern
    if s_type == "Banking": hour = random.randint(9, 17)
    elif s_type == "Investment": hour = random.randint(17, 21)
    elif s_type == "Romance": hour = random.choice([20, 21, 22, 23, 0, 1, 2])
    elif s_type == "Gambling": hour = random.choice([22, 23, 0, 1, 2, 3, 4])
    
    event_time = START_DATE + timedelta(hours=hour, minutes=random.randint(0, 59))

    nodes.append({
        "id": v_id,
        "group": "victim",
        "risk": random.randint(10, 40),
        "label": f"Victim {i+1}",
        "location": random.choice(VICTIM_LOCATIONS), # <--- NEW: Real locations
        "size": 15
    })

    links.append({
        "source": assigned_scammer["id"],
        "target": v_id,
        "type": "attack",
        "scam_type": s_type,
        "method": random.choice(["Phone", "SMS", "Email", "WhatsApp"]),
        "timestamp": event_time.isoformat()
    })

print(json.dumps({"nodes": nodes, "links": links}, indent=2))
