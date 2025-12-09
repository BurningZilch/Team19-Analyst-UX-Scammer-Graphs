import json
import random
from datetime import datetime, timedelta

# Configuration
SCENARIO_NAME = "Romance Scam Ring"
START_TIME = datetime(2023, 10, 27, 18, 0, 0) # 6:00 PM (Scammer working hours)

nodes = []
links = []

# --- 1. Create 3 Distinct Laundering Hubs (The Financial Instruments) ---
# This visualizes the 3 types of instruments you requested.

laundering_hubs = [
    {
        "id": "WALLET_BTC_KINGPIN",
        "instrument": "Crypto",
        "label": "High-Yield Crypto Wallet",
        "risk": 99
    },
    {
        "id": "ACC_COMMONWEALTH_MULE",
        "instrument": "Bank Account",
        "label": "Mule Bank Account (CBA)",
        "risk": 80
    },
    {
        "id": "ID_WESTERN_UNION_DROP",
        "instrument": "Money Transfer",
        "label": "Western Union ID #9928",
        "risk": 70
    }
]

for hub in laundering_hubs:
    nodes.append({
        "id": hub["id"],
        "group": "financial_node",  # New group for styling
        "financial_instrument": hub["instrument"], # <--- ADDED FIELD
        "risk": hub["risk"],
        "country": "Unknown",
        "label": hub["label"],
        "size": 40 # Make these nodes big
    })


# --- 2. Create Mid-Level Scammers (The callers) ---
scammers = []
for i in range(6): # Increased to 6 scammers
    s_id = f"SCAMMER_{i+1}"
    scammers.append(s_id)
    
    # Assign each scammer a preferred financial channel
    preferred_hub = random.choice(laundering_hubs)
    
    nodes.append({
        "id": s_id,
        "group": "scammer",
        "risk": 85,
        "country": random.choice(["Region_A", "Region_B"]),
        "scam_type": "Romance",
        "label": f"Romance Actor {i+1}",
        "size": 25
    })
    
    # Link Scammer -> Financial Hub (Money Flow)
    # The scammer sends money to the hub matching the instrument
    links.append({
        "source": s_id,
        "target": preferred_hub["id"],
        "type": "laundering_transfer",
        "financial_instrument": preferred_hub["instrument"], # <--- ADDED FIELD TO LINK
        "amount": random.randint(10000, 50000),
        "timestamp": (START_TIME + timedelta(minutes=random.randint(120, 240))).isoformat()
    })


# --- 3. Create Victims (The targets) ---
for i in range(50):
    v_id = f"VICTIM_{i+1}"
    assigned_scammer_id = random.choice(scammers)
    
    # TIME TRICK: timestamps cluster around 7PM - 10PM
    event_time = START_TIME + timedelta(minutes=random.randint(0, 180)) 
    
    nodes.append({
        "id": v_id,
        "group": "victim",
        "risk": 10,
        "country": "Australia",
        "age": random.randint(55, 75),
        "label": f"Victim {i+1}",
        "size": 10
    })

    # Link Scammer -> Victim (The Attack Contact)
    links.append({
        "source": assigned_scammer_id,
        "target": v_id,
        "type": "contact",
        "method": random.choice(["WhatsApp", "SMS", "Phone"]),
        "timestamp": event_time.isoformat()
    })

# Output Structure
data = {
    "nodes": nodes,
    "links": links
}

print(json.dumps(data, indent=2))
