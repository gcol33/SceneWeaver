#!/usr/bin/env python3
"""
SceneWeaver - Story Builder

Parses Markdown scene files from scenes/ and generates js/story.js

Usage:
    python tools/build_story_from_md.py

Each .md file in scenes/ should have:
- YAML frontmatter with at least 'id' field
- Text blocks separated by '---'
- Optional '### Choices' section at the end
"""

import os
import re
import json
import sys
from pathlib import Path

# Determine project root (parent of tools/)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SCENES_DIR = PROJECT_ROOT / "scenes"
OUTPUT_FILE = PROJECT_ROOT / "js" / "story.js"


def parse_frontmatter(content):
    """Extract YAML frontmatter from content."""
    if not content.startswith('---'):
        return {}, content

    # Find the closing ---
    end_match = re.search(r'\n---\n', content[3:])
    if not end_match:
        return {}, content

    frontmatter_text = content[3:3 + end_match.start()]
    body = content[3 + end_match.end():]

    # Simple YAML parser
    frontmatter = {}
    current_key = None
    current_list = None
    actions_list = []
    current_action = None

    def get_indent(line):
        """Get number of leading spaces."""
        return len(line) - len(line.lstrip())

    for line in frontmatter_text.split('\n'):
        stripped = line.strip()
        if not stripped:
            continue

        indent = get_indent(line)

        # Check for action list item
        if current_key == 'actions' and stripped.startswith('- type:'):
            if current_action:
                actions_list.append(current_action)
            current_action = {'type': stripped[7:].strip()}
            continue

        # Check for action property (4 spaces indent)
        if current_action is not None and indent >= 4 and ':' in stripped:
            key, _, value = stripped.partition(':')
            key = key.strip()
            value = value.strip()
            if value.isdigit():
                value = int(value)
            elif value.lower() == 'true':
                value = True
            elif value.lower() == 'false':
                value = False
            current_action[key] = value
            continue

        # Check for list item (- item)
        if stripped.startswith('- ') and current_list is not None:
            item = stripped[2:].strip()
            if (item.startswith('"') and item.endswith('"')) or \
               (item.startswith("'") and item.endswith("'")):
                item = item[1:-1]
            current_list.append(item)
            continue

        # Top-level key: value
        if indent == 0 and ':' in stripped:
            # Finish previous action
            if current_action:
                actions_list.append(current_action)
                current_action = None

            key, _, value = stripped.partition(':')
            key = key.strip()
            value = value.strip()

            if value == '':
                # Start of list
                if key == 'actions':
                    current_key = 'actions'
                    current_list = None
                else:
                    current_list = []
                    frontmatter[key] = current_list
                    current_key = key
            else:
                current_list = None
                current_key = key
                # Handle inline list: key: [item1, item2]
                if value.startswith('[') and value.endswith(']'):
                    items = value[1:-1].split(',')
                    frontmatter[key] = [i.strip().strip('"\'') for i in items if i.strip()]
                elif value.isdigit():
                    frontmatter[key] = int(value)
                elif value.lower() == 'true':
                    frontmatter[key] = True
                elif value.lower() == 'false':
                    frontmatter[key] = False
                else:
                    frontmatter[key] = value.strip('"\'')

    # Finish any remaining action
    if current_action:
        actions_list.append(current_action)

    if actions_list:
        frontmatter['actions'] = actions_list

    return frontmatter, body


def parse_choices(text, scene_id=None):
    """Parse the ### Choices section into structured choices."""
    choices = []

    for line in text.strip().split('\n'):
        line = line.strip()
        if not line or not line.startswith('-'):
            continue

        # Remove leading -
        line = line[1:].strip()

        choice = {
            'label': '',
            'target': ''
        }

        # Split by arrow (→ or ->)
        if '→' in line:
            parts = line.split('→')
            label_part = parts[0].strip()
            choice['target'] = parts[1].strip()
        elif '->' in line:
            parts = line.split('->')
            label_part = parts[0].strip()
            choice['target'] = parts[1].strip()
        else:
            continue

        # Parse (requires: flag_name, !other_flag)
        requires_match = re.search(r'\(requires:\s*([^)]+)\)', label_part)
        if requires_match:
            flags = [f.strip() for f in requires_match.group(1).split(',')]
            choice['require_flags'] = flags
            label_part = re.sub(r'\(requires:\s*[^)]+\)', '', label_part).strip()

        # Parse (sets: flag_name)
        sets_match = re.search(r'\(sets:\s*([^)]+)\)', label_part)
        if sets_match:
            flags = [f.strip() for f in sets_match.group(1).split(',')]
            choice['set_flags'] = flags
            label_part = re.sub(r'\(sets:\s*[^)]+\)', '', label_part).strip()

        choice['label'] = label_part
        choices.append(choice)

    return choices


def parse_text_blocks(body, scene_id=None):
    """Split body into text blocks and extract choices."""
    # Check for ### Choices section
    choices_match = re.search(r'###\s*Choices\s*\n', body)

    if choices_match:
        text_part = body[:choices_match.start()]
        choices_part = body[choices_match.end():]
        choices = parse_choices(choices_part, scene_id)
    else:
        text_part = body
        choices = []

    # Split by horizontal rule (---)
    blocks = re.split(r'\n---\n', text_part)

    # Clean up blocks
    text_blocks = []
    for block in blocks:
        block = block.strip()
        if block:
            text_blocks.append(block)

    return text_blocks, choices


def parse_scene_file(filepath):
    """Parse a single scene .md file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    frontmatter, body = parse_frontmatter(content)
    text_blocks, choices = parse_text_blocks(body, frontmatter.get('id'))

    # Build scene object
    scene = {
        'id': frontmatter.get('id', filepath.stem)
    }

    # Optional fields - only include if present
    optional_fields = [
        'bg', 'music', 'chars',
        'set_flags', 'clear_flags', 'set_key_flags',
        'require_flags', 'actions'
    ]

    for field in optional_fields:
        value = frontmatter.get(field)
        if value:
            scene[field] = value

    # Text blocks
    if text_blocks:
        scene['textBlocks'] = text_blocks

    # Choices
    if choices:
        scene['choices'] = choices

    return scene


def build_story():
    """Build story.js from all scene files."""
    if not SCENES_DIR.exists():
        print(f"Error: scenes/ directory not found at {SCENES_DIR}")
        sys.exit(1)

    story = {}
    scene_count = 0

    # Find all .md files in scenes/ (recursive)
    for md_file in sorted(SCENES_DIR.rglob('*.md')):
        try:
            scene = parse_scene_file(md_file)
            scene_id = scene['id']

            if scene_id in story:
                print(f"Warning: Duplicate scene ID '{scene_id}' in {md_file}")

            story[scene_id] = scene
            scene_count += 1
            print(f"  Parsed: {scene_id}")

        except Exception as e:
            print(f"Error parsing {md_file}: {e}")

    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('/**\n')
        f.write(' * SceneWeaver Story Data\n')
        f.write(' * Auto-generated by build_story_from_md.py\n')
        f.write(' * DO NOT EDIT MANUALLY\n')
        f.write(' */\n\n')
        f.write('var story = ')
        f.write(json.dumps(story, indent=2, ensure_ascii=False))
        f.write(';\n')

    print(f"\nBuilt {scene_count} scenes -> {OUTPUT_FILE}")


if __name__ == '__main__':
    print("SceneWeaver Story Builder")
    print("=" * 40)
    build_story()
