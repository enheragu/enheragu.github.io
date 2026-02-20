#!/usr/bin/env python3
"""
Convert publications.bib to publications.yml for Jekyll.
Groups by type (note field) and orders by importance.
Supports exclude = {true} to skip entries.
Parses BibTeX without external dependencies.
"""

import re
import sys
import os


# Publication type order (most important first)
TYPE_ORDER = {
    'Journal': 0,
    'Book Chapter': 1,
    'Conference Paper': 2,
    'Presentation': 3,
    'Poster': 4,
}

TYPE_LABELS = {
    'Journal': 'Journal Articles',
    'Book Chapter': 'Book Chapters',
    'Conference Paper': 'Conference Papers',
    'Presentation': 'Presentations',
    'Poster': 'Posters',
}


def parse_bib(bib_content):
    """Parse a .bib file content and return a list of entries."""
    entries = []
    entry_pattern = re.compile(r'@(\w+)\s*\{', re.IGNORECASE)

    pos = 0
    while pos < len(bib_content):
        match = entry_pattern.search(bib_content, pos)
        if not match:
            break

        entry_type = match.group(1).lower()
        # Skip comments
        if entry_type == 'comment':
            pos = match.end()
            continue

        brace_start = match.end() - 1
        brace_count = 1
        i = brace_start + 1
        while i < len(bib_content) and brace_count > 0:
            if bib_content[i] == '{':
                brace_count += 1
            elif bib_content[i] == '}':
                brace_count -= 1
            i += 1

        if brace_count != 0:
            pos = match.end()
            continue

        entry_body = bib_content[brace_start + 1:i - 1]

        key_match = re.match(r'\s*([^,\s]+)\s*,', entry_body)
        if not key_match:
            pos = i
            continue

        cite_key = key_match.group(1)
        fields_str = entry_body[key_match.end():]

        fields = parse_fields(fields_str)

        entries.append({
            'type': entry_type,
            'key': cite_key,
            'fields': fields
        })

        pos = i

    return entries


def parse_fields(fields_str):
    """Parse BibTeX fields from a string."""
    fields = {}
    field_pattern = re.compile(r'\s*(\w[\w-]*)\s*=\s*')
    fpos = 0

    while fpos < len(fields_str):
        fmatch = field_pattern.search(fields_str, fpos)
        if not fmatch:
            break

        field_name = fmatch.group(1).lower()
        value_start = fmatch.end()

        while value_start < len(fields_str) and fields_str[value_start] in ' \t\n\r':
            value_start += 1

        if value_start >= len(fields_str):
            break

        if fields_str[value_start] == '{':
            bc = 1
            vi = value_start + 1
            while vi < len(fields_str) and bc > 0:
                if fields_str[vi] == '{':
                    bc += 1
                elif fields_str[vi] == '}':
                    bc -= 1
                vi += 1
            value = fields_str[value_start + 1:vi - 1]
            fpos = vi
        elif fields_str[value_start] == '"':
            vi = value_start + 1
            while vi < len(fields_str) and fields_str[vi] != '"':
                vi += 1
            value = fields_str[value_start + 1:vi]
            fpos = vi + 1
        else:
            vi = value_start
            while vi < len(fields_str) and fields_str[vi] not in ',}\n':
                vi += 1
            value = fields_str[value_start:vi].strip()
            fpos = vi

        fields[field_name] = clean_latex(value.strip())

        while fpos < len(fields_str) and fields_str[fpos] in ' \t\n\r,':
            fpos += 1

    return fields


def clean_latex(text):
    """Clean common LaTeX escape sequences."""
    # Handle {\' e} style accents
    text = re.sub(r"\{\\'\{?([a-zA-Z])\}?\}", r'\1', text)  # {\'e} -> e (simplified)
    text = re.sub(r"\\'\{([a-zA-Z])\}", lambda m: accent_map("'", m.group(1)), text)
    text = re.sub(r"\\'\s*([a-zA-Z])", lambda m: accent_map("'", m.group(1)), text)
    text = re.sub(r'\{\\"([a-zA-Z])\}', lambda m: accent_map('"', m.group(1)), text)
    text = re.sub(r'\\"\{([a-zA-Z])\}', lambda m: accent_map('"', m.group(1)), text)
    text = re.sub(r'\{\\~([a-zA-Z])\}', lambda m: accent_map('~', m.group(1)), text)
    text = re.sub(r'\\~\{([a-zA-Z])\}', lambda m: accent_map('~', m.group(1)), text)
    text = re.sub(r'\\c\{([a-zA-Z])\}', lambda m: accent_map('c', m.group(1)), text)
    # Remove remaining braces
    text = text.replace('{', '').replace('}', '')
    # Clean double dashes
    text = text.replace('--', '–')
    return text


def accent_map(accent, char):
    """Map LaTeX accents to Unicode."""
    accents = {
        ("'", 'a'): 'á', ("'", 'e'): 'é', ("'", 'i'): 'í',
        ("'", 'o'): 'ó', ("'", 'u'): 'ú', ("'", 'A'): 'Á',
        ("'", 'E'): 'É', ("'", 'I'): 'Í', ("'", 'O'): 'Ó',
        ("'", 'U'): 'Ú',
        ('"', 'a'): 'ä', ('"', 'e'): 'ë', ('"', 'i'): 'ï',
        ('"', 'o'): 'ö', ('"', 'u'): 'ü',
        ('~', 'n'): 'ñ', ('~', 'N'): 'Ñ',
        ('c', 's'): 'ş', ('c', 'S'): 'Ş', ('c', 'c'): 'ç', ('c', 'C'): 'Ç',
    }
    return accents.get((accent, char), char)


def format_authors(author_str):
    """Convert BibTeX author format to readable list."""
    authors = [a.strip() for a in author_str.split(' and ')]
    formatted = []
    for author in authors:
        if author.lower() == 'others':
            formatted.append('et al.')
            continue
        if ',' in author:
            parts = [p.strip() for p in author.split(',', 1)]
            formatted.append(f"{parts[1]} {parts[0]}")
        else:
            formatted.append(author)
    return formatted


def yaml_escape(value):
    """Escape a string for safe YAML output."""
    if not value:
        return '""'
    if any(c in value for c in ':#[]{}|>*&!%@`\'"\\,?\n'):
        escaped = value.replace('\\', '\\\\').replace('"', '\\"')
        return f'"{escaped}"'
    return f'"{value}"'


def get_pub_type(entry):
    """Determine publication type from note field or entry type."""
    note = entry['fields'].get('note', '')
    if note in TYPE_ORDER:
        return note

    # Fallback based on entry type
    etype = entry['type']
    if etype == 'article':
        return 'Journal'
    elif etype in ('incollection', 'inbook'):
        return 'Book Chapter'
    elif etype in ('inproceedings', 'conference'):
        return 'Conference Paper'
    elif etype == 'misc':
        if 'poster' in note.lower():
            return 'Poster'
        return 'Presentation'
    return 'Conference Paper'


def entries_to_yaml(entries):
    """Convert parsed BibTeX entries to YAML string, grouped by type."""
    # Filter excluded entries
    entries = [e for e in entries if e['fields'].get('exclude', '').lower() != 'true']

    # Group by publication type
    groups = {}
    for entry in entries:
        pub_type = get_pub_type(entry)
        if pub_type not in groups:
            groups[pub_type] = []
        groups[pub_type].append(entry)

    # Sort each group by year descending
    for pub_type in groups:
        groups[pub_type].sort(key=lambda e: -(int(e['fields'].get('year', '0'))))

    # Output in importance order
    lines = []
    sorted_types = sorted(groups.keys(), key=lambda t: TYPE_ORDER.get(t, 99))

    for pub_type in sorted_types:
        type_label = TYPE_LABELS.get(pub_type, pub_type)
        lines.append(f"- category: {yaml_escape(type_label)}")
        lines.append(f"  type_key: {yaml_escape(pub_type.lower().replace(' ', '_'))}")
        lines.append("  entries:")

        for entry in groups[pub_type]:
            fields = entry['fields']
            authors = format_authors(fields.get('author', ''))
            title = fields.get('title', '')
            year = fields.get('year', '')

            lines.append(f"    - key: {yaml_escape(entry['key'])}")
            lines.append(f"      title: {yaml_escape(title)}")
            lines.append(f"      year: {year}")

            lines.append("      authors:")
            for author in authors:
                lines.append(f"        - {yaml_escape(author)}")

            # Venue info
            venue = fields.get('journal') or fields.get('booktitle') or fields.get('howpublished') or ''
            if venue:
                lines.append(f"      venue: {yaml_escape(venue)}")

            if fields.get('publisher'):
                lines.append(f"      publisher: {yaml_escape(fields['publisher'])}")

            for field in ['doi', 'url', 'pages', 'volume', 'number']:
                if field in fields and fields[field]:
                    lines.append(f"      {field}: {yaml_escape(fields[field])}")

            lines.append("")

    return "\n".join(lines)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)

    bib_path = os.path.join(project_dir, '_data', 'publications.bib')
    yml_path = os.path.join(project_dir, '_data', 'publications.yml')

    if not os.path.exists(bib_path):
        print(f"Error: {bib_path} not found")
        sys.exit(1)

    with open(bib_path, 'r', encoding='utf-8') as f:
        bib_content = f.read()

    entries = parse_bib(bib_content)
    yaml_content = entries_to_yaml(entries)

    with open(yml_path, 'w', encoding='utf-8') as f:
        f.write(yaml_content)

    # Count by type
    types = {}
    for e in entries:
        if e['fields'].get('exclude', '').lower() != 'true':
            t = get_pub_type(e)
            types[t] = types.get(t, 0) + 1

    total = sum(types.values())
    detail = ", ".join(f"{v} {k}" for k, v in sorted(types.items(), key=lambda x: TYPE_ORDER.get(x[0], 99)))
    print(f"Converted {total} entries ({detail}): {bib_path} -> {yml_path}")


if __name__ == '__main__':
    main()
