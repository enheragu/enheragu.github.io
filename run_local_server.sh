#!/bin/bash
# Launch Jekyll dev server locally with live reload

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Add user-installed gems to PATH and ensure system gems are also accessible
export PATH="$HOME/.local/share/gem/ruby/3.2.0/bin:$HOME/snap/code/223/.local/share/gem/ruby/3.2.0/bin:$PATH"
unset GEM_HOME
unset GEM_PATH

# Check Jekyll is available
if ! command -v jekyll &> /dev/null; then
    echo "Jekyll not found. Installing..."
    gem install --user-install jekyll bundler
fi

# Convert BibTeX to YAML before serving
echo "Converting publications.bib -> publications.yml..."
python3 "$SCRIPT_DIR/_scripts/bib_to_yaml.py"

echo "Starting Jekyll server at http://localhost:4000"
echo "Press Ctrl+C to stop"
jekyll serve --livereload
