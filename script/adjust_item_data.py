"""
Adjust item data for specific items that need manual corrections
Adds type information for Augments and Shields
"""

import json
from pathlib import Path


def adjust_item_data():
    """Add special handling for augments and shields."""
    data_dir = Path(__file__).parent.parent / "data"
    database_file = data_dir / "items_database.json"
    
    # Load existing database
    if not database_file.exists():
        print(f"Error: {database_file} not found!")
        return
    
    with open(database_file, 'r', encoding='utf-8') as f:
        items_database = json.load(f)
    
    print(f"Loaded database with {len(items_database)} items\n")
    
    # Items that should have infobox.type = "Augment"
    augment_items = [
        "Free Loadout Augment",
        "Looting Mk. 1",
        "Combat Mk. 1",
        "Tactical Mk. 1",
        "Looting Mk. 2",
        "Combat Mk. 2",
        "Tactical Mk. 2",
        "Looting Mk. 3 (Cautious)",
        "Looting Mk. 3 (Survivor)",
        "Combat Mk. 3 (Aggressive)",
        "Combat Mk. 3 (Flanking)",
        "Tactical Mk. 3 (Defensive)",
        "Tactical Mk. 3 (Healing)",
    ]
    
    # Items that should have infobox.type = "Shield"
    shield_items = [
        "Light Shield",
        "Medium Shield",
        "Heavy Shield",
    ]
    
    updated_items = []
    
    # Process augments
    print("Processing Augments:")
    for item in items_database:
        if item['name'] in augment_items:
            # Ensure infobox exists
            if 'infobox' not in item:
                item['infobox'] = {}
            
            # Add or update type
            item['infobox']['type'] = "Augment"
            updated_items.append(item['name'])
            print(f"  ✓ {item['name']} -> infobox.type = 'Augment'")
    
    # Process shields
    print("\nProcessing Shields:")
    for item in items_database:
        if item['name'] in shield_items:
            # Ensure infobox exists
            if 'infobox' not in item:
                item['infobox'] = {}
            
            # Add or update type
            item['infobox']['type'] = "Shield"
            updated_items.append(item['name'])
            print(f"  ✓ {item['name']} -> infobox.type = 'Shield'")
    
    # Save back to database
    if updated_items:
        with open(database_file, 'w', encoding='utf-8') as f:
            json.dump(items_database, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'='*60}")
        print(f"[OK] Successfully updated {len(updated_items)} items")
        print(f"[OK] Database saved to: {database_file}")
    else:
        print(f"\n[WARNING] No items were updated")
        print(f"  This might be because the items don't exist in the database yet")


if __name__ == "__main__":
    adjust_item_data()

