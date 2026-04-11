from pathlib import Path
path = Path(r"c:\Users\phiek\dev\nuria-site\terms\index.html")
text = path.read_text(encoding="utf-8")
start = text.index("<!-- ─── SECTION 14 ─")
end = text.index("<!-- ─── SECTION 25 ─")
block14_24 = text[start:end]
# Shift section numbers in comments and h2 ids: 24->25 ... 14->15
for n in range(24, 13, -1):
    n2 = n + 1
    block14_24 = block14_24.replace(f"SECTION {n} ", f"SECTION {n2} ")
    block14_24 = block14_24.replace(f'id="terms-{n}"', f'id="terms-{n2}"')
    block14_24 = block14_24.replace(f">{n}. ", f">{n2}. ")
# Fix h3 numeric prefixes inside Ask (was 14.x -> 15.x) and Location etc.
# After first replace, old 14 Ask became 15 — subsections 14.1 need -> 15.1 for Ask block only
# The loop above already changed ">14. " to ">15. " in h2 — good
# h3 still say 14.1 — replace patterns 14.1-14.5 for Ask section (first occurrence block)
import re
# Rename subsection numbers 14. -> 15. for lines between new section 15 header and section 16
sub = block14_24
# Find first h2 15. Ask and until <!-- SECTION 16
m = re.search(r'(<h2 id="terms-15">15\. Ask Nuria.*?</h2>)(.*?)(<!-- ─── SECTION 16)', sub, re.DOTALL)
if m:
    body = m.group(2)
    body2 = body
    for i in range(5, 0, -1):
        body2 = body2.replace(f"14.{i}", f"15.{i}")
    sub = sub[:m.start(2)] + body2 + sub[m.end(2):]
    block14_24 = sub
# Location section 15 -> 16: 15.1 -> 16.1 etc
m2 = re.search(r'(<h2 id="terms-16">16\. Location.*?</h2>)(.*?)(<!-- ─── SECTION 17)', block14_24, re.DOTALL)
if m2:
    body = m2.group(2)
    for i in range(5, 0, -1):
        body = body.replace(f"15.{i}", f"16.{i}")
    block14_24 = block14_24[:m2.start(2)] + body + block14_24[m2.end(2):]
# Warranties 16 -> 17 has no h3 numbered in first line - skip
# Section 16 Disclaimer - check h3 - no sub in grep
text2 = text[:start] + block14_24 + text[end:]
path.write_text(text2, encoding="utf-8")
print("done pass1")
