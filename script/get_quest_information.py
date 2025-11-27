"""
Fetches all quest information necessary to track quests
"""
import html
import json

from pathlib import Path
import re
from typing import Dict, List, Any
from urllib.parse import quote


import requests
from bs4 import BeautifulSoup


def sanitize_for_url(text: str) -> str:
    """Convert text to URL-safe format (spaces to underscores)."""
    return text.replace(' ', '_')

def clean_text(text: str) -> str:
    """Clean text by decoding HTML entities and normalizing whitespace."""
    if not text:
        return text
    text = text.strip()
    # Decode HTML entities like &nbsp;, &amp;, etc.
    text = html.unescape(text)
    text = BeautifulSoup(text, "html.parser").get_text(separator=" ")

    # Remove MediaWiki bold (''') and italic ('') markup
    text = re.sub(r"'{2,}", '', text)
    # Normalize whitespace
    text = ' '.join(text.split())
    return text.strip()


def replace_wiki_links(text: str) -> str:
    """
    Convert [[Page|Label]] -> Label, [[Page]] -> Page, keep pipe fallback.
    Handles nested/edge cases conservatively.
    """
    if not text:
        return text
    def repl(m):
        part1 = m.group(1) or ''
        part2 = m.group(2) or ''
        return part2 if part2 else part1
    return re.sub(r'\[\[([^|\]]+?)(?:\|([^|\]]+?))?\]\]', repl, text)


def extract_bullets(cell: str) -> List[str]:
    """Return list of '*' bullet items from a cell; if none, return the cleaned cell as single item (unless empty)."""
    if not cell:
        return []
    lines = [ln.strip() for ln in cell.splitlines()]
    bullets = []
    for ln in lines:
        if ln.startswith('*'):
            item = ln.lstrip('*').strip()
            item = replace_wiki_links(item)
            item = clean_text(item)
            if item:
                bullets.append(item)
    if bullets:
        return bullets
    # fallback: try comma separated or plain text
    plain = replace_wiki_links(cell)
    plain = clean_text(plain)
    return [s.strip() for s in re.split(r'\s*[,;/]\s*', plain) if s.strip()]


def parse_table_text(table_text: str) -> List[Dict[str, Any]]:
    """
    Parse a single wikitable text (content inside {| ... |}) into quest records.
    Each row is separated by '\n|-' and columns start with '|' or '!'.

    """
    rows = re.split(r'\n\|\-\s*\n', table_text)
    quests: List[Dict[str, Any]] = []
    for row in rows:
        # skip header rows or empty
        if not row or row.strip().startswith('!'):
            continue
        # ensure we operate on the cell lines; remove leading table markers if present
        r = row.lstrip('\n').lstrip('|').strip()
        # split to at most 5 columns (Quest, Trader, Required Location, Objective, Reward)
        cols = re.split(r'\n\|', r, maxsplit=4)
        # If number of columns < 5 some rows may be malformed; try to recover by padding
        if len(cols) < 5:
            cols += [''] * (5 - len(cols))
        # clean each column: remove leading '!' or '|' and whitespace
        cols = [c.lstrip('!').strip() for c in cols]
        # Process columns
        raw_name = cols[0]
        raw_trader = cols[1]
        raw_location = cols[2]
        raw_objective = cols[3]
        raw_reward = cols[4]
        
        # name: strip wiki link wrappers and bold markers
        name = replace_wiki_links(raw_name)
        name = clean_text(name)
        # Ignore quests whose name starts with a non-alphanumeric character
        if not name or not re.match(r'^[A-Za-z0-9]', name):
            continue

        print("Parsing quest " + name)
        
        url_name = sanitize_for_url(name)
        previous_quests_raw = parse_quest_tree_from_wiki(url_name)
        prev_quests = previous_quests_raw[0]
        next_quests = previous_quests_raw[1]
        
        if prev_quests and len(prev_quests) >= 2 and prev_quests[0] == "N" and prev_quests[1] == "A":
            prev_quests = []

        trader = replace_wiki_links(raw_trader)
        trader = clean_text(trader)

        required_location = replace_wiki_links(raw_location)
        required_location = clean_text(required_location)

        objective_steps = extract_bullets(raw_objective)
        reward_items = extract_bullets(raw_reward)

        quest = {
            "name": name,
            "trader": trader,
            "required_location": required_location,
            "objective": objective_steps,
            "reward": reward_items,
            "previous_quests": prev_quests,
            "next_quests": next_quests
        }
        if not quest["name"]:
            continue
        quests.append(quest)
        print(f"Finished quest {name}. {len(rows) - len(quests)} quests remaining to parse.")

    return quests


def parse_quest_tree_from_wiki(quest_name: str):
    """
    Fetch the edit-source of the given quest page and return a tuple:
      (previous_quests_list, next_quests_list)
    Each element is a list of quest names (strings). Returns ([], []) if none found.
    """
    title = sanitize_for_url(quest_name)
    source_url = f"https://arcraiders.wiki/w/index.php?title={quote(title)}&action=edit"

    try:
        res = requests.get(source_url)
        res.raise_for_status()

        soup = BeautifulSoup(res.content, 'html.parser')
        textarea = soup.find('textarea', {'id': 'wpTextbox1'})
        if not textarea:
            return ([], [])

        content = textarea.string or textarea.get_text() or ''

        # find the Infobox_quest template block
        m = re.search(r'\{\{\s*Infobox_quest(.*?)(?:\n\}\}|\}\})', content, flags=re.DOTALL | re.IGNORECASE)
        if not m:
            return ([], [])
        infobox = m.group(1)

        def extract_field(field_name: str) -> str:
            # Match lines like: | field = value
            pattern = re.compile(rf'^\s*\|\s*{re.escape(field_name)}\s*=\s*(.*)\s*$', re.IGNORECASE)
            for line in infobox.splitlines():
                m = pattern.match(line)
                if m:
                    return m.group(1).strip()
            return ''

        prev_raw = extract_field('previous')
        next_raw = extract_field('next')

        def links_from_text(t: str) -> List[str]:
            if not t:
                return []
            found = []
            for g1, g2 in re.findall(r'\[\[([^|\]]+?)(?:\|([^|\]]+?))?\]\]', t):
                label = g2 if g2 else g1
                label = clean_text(label)
                if label:
                    found.append(label)
            if found:
                return found
            parts = re.split(r'<br\s*/?>|\n|,|;|\||/', t)
            out = []
            for p in parts:
                p = re.sub(r'<.*?>', '', p)
                p = clean_text(p)
                if p:
                    out.append(p)
            return out

        previous_list = links_from_text(prev_raw)
        next_list = links_from_text(next_raw)
        return (previous_list, next_list)

    except requests.RequestException as e:
        print(f"  [ERROR] Error fetching quest page: {e}")
        return ([], [])
    except Exception as e:
        print(f"  [ERROR] Error parsing quest page: {e}")
        import traceback
        traceback.print_exc()
        return ([], [])


def parse_quests_from_wiki():
    source_url = f"https://arcraiders.wiki/w/index.php?title=Quests&action=edit"
    
    try:
        res = requests.get(source_url)
        res.raise_for_status();
        
        soup = BeautifulSoup(res.content, 'html.parser')
        
        textarea = soup.find('textarea', {'id': 'wpTextbox1'})
        
        if not textarea:
            print("Cannot find textarea")
            return None

        content = textarea.string or textarea.get_text()
        if not content:
            print("Textarea empty")
            return None

        # find all sortable wikitable blocks inside the textarea
        tables = re.findall(r'\{\|\s*class="sortable wikitable"(.*?)\|\}', content, flags=re.DOTALL | re.IGNORECASE)
        all_quests: List[Dict[str, Any]] = []
        for tbl in tables:
            parsed = parse_table_text(tbl)
            all_quests.extend(parsed)

        out_path = Path(__file__).parent.parent / "data" / "quest_database.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(all_quests, f, indent=2, ensure_ascii=False)

        print(f"Parsed {len(all_quests)} quests -> {out_path}")
        return all_quests
    
    except requests.RequestException as e:
        print(f"  [ERROR] Error fetching quests: {e}")
        return None
    except Exception as e:
        print(f"  [ERROR] Error parsing quests: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    
    parse_quests_from_wiki()

if __name__ == "__main__":
    main()
