from pathlib import Path
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "bug-receipt"
SKILL_MD = SKILL / "SKILL.md"
PACKAGE_JSON = ROOT / "package.json"


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

def scalar(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


frontmatter = match.group("frontmatter")
fields: dict[str, str | dict[str, str]] = {}
current_mapping: dict[str, str] | None = None
for line in frontmatter.splitlines():
    if ":" not in line:
        fail(f"invalid frontmatter line: {line}")
    if line.startswith("  "):
        if current_mapping is None:
            fail(f"unexpected nested frontmatter line: {line}")
        key, value = line.strip().split(":", 1)
        if key in current_mapping:
            fail(f"duplicate nested frontmatter field: {key}")
        current_mapping[key] = scalar(value.strip())
        continue
    if line.startswith(" "):
        fail(f"invalid frontmatter indentation: {line}")
    key, value = line.split(":", 1)
    key = key.strip()
    if key in fields:
        fail(f"duplicate frontmatter field: {key}")
    value = value.strip()
    if key == "metadata":
        if value:
            fail("metadata must be a mapping")
        current_mapping = {}
        fields[key] = current_mapping
    else:
        current_mapping = None
        fields[key] = scalar(value)

if set(fields) != {"name", "description", "metadata"}:
    fail("frontmatter must contain name, description, and metadata")
metadata = fields["metadata"]
if not isinstance(metadata, dict) or set(metadata) != {"version"}:
    fail("metadata must contain only version")
package_version = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))["version"]
if metadata["version"] != package_version:
    fail(f"metadata.version {metadata['version']!r} must match package version {package_version!r}")
if not re.fullmatch(r"\d+\.\d+\.\d+", metadata["version"]):
    fail("metadata.version must use semantic version x.y.z")
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
