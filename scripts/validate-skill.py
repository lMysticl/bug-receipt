from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "bug-receipt"
SKILL_MD = SKILL / "SKILL.md"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


text = SKILL_MD.read_text(encoding="utf-8")
lines = text.splitlines()

if len(lines) > 500:
    fail(f"SKILL.md has {len(lines)} lines; maximum is 500")

match = re.match(r"\A---\n(?P<frontmatter>.*?)\n---\n", text, re.DOTALL)
if not match:
    fail("SKILL.md must begin with YAML frontmatter")

frontmatter = match.group("frontmatter")
fields = {}
for line in frontmatter.splitlines():
    if ":" not in line:
        fail(f"invalid frontmatter line: {line}")
    key, value = line.split(":", 1)
    fields[key.strip()] = value.strip()

if set(fields) != {"name", "description"}:
    fail("frontmatter must contain only name and description")
if fields["name"] != SKILL.name:
    fail("skill name must match its directory")
if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fields["name"]):
    fail("skill name must be lowercase hyphen-case")
if not (40 <= len(fields["description"]) <= 1024):
    fail("description must be informative and at most 1024 characters")
if "TODO" in text:
    fail("SKILL.md contains an unresolved TODO")

for link in re.findall(r"\[[^]]+\]\(([^)]+)\)", text):
    if "://" not in link and not (SKILL / link).exists():
        fail(f"missing local reference: {link}")

openai_yaml = (SKILL / "agents" / "openai.yaml").read_text(encoding="utf-8")
if "Use $bug-receipt" not in openai_yaml:
    fail("default_prompt must explicitly mention $bug-receipt")

for required in (
    "references/receipt-contract.md",
    "references/receipt.schema.json",
    "scripts/validate-receipt.mjs",
    "assets/receipt.template.json",
):
    if not (SKILL / required).is_file():
        fail(f"missing self-contained skill resource: {required}")

print(f"OK: {SKILL_MD} ({len(lines)} lines, {len(text)} characters)")
