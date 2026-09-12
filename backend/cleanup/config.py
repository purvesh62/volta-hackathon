from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
PROCESSED_DIR = DATA_DIR / "processed"

WORKORDERS_CSV = DATA_DIR / "city-works.csv"
TREES_CSV = DATA_DIR / "public-trees.csv"

# spatial join thresholds (metres, Web Mercator)
MATCH_M = 10      # copy tree attrs onto WO if nearest tree within this
NEIGH_M = 25      # neighbourhood aggregate radius

ASSET_TYPES = {"AST_TREE", "TRN_STREET", "TRN_SECTRAV"}
OPEN_STATUSES = {"OPEN"}                 # backlog we re-triage
CLOSED_STATUSES = {"CLOSED", "COMPLETE"}  # labelled history used for training
