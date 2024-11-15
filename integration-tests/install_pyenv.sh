#!/bin/bash

set -e  # Exit on error

echo "Installing pyenv dependencies..."

# Install required packages based on OS
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    if command -v brew >/dev/null 2>&1; then
        brew install openssl readline sqlite3 xz zlib tcl-tk
    else
        echo "Error: Homebrew is required for macOS installation. Please install it first."
        exit 1
    fi
elif [ "$(grep -Ei 'debian|ubuntu' /etc/*release)" ]; then
    # Debian/Ubuntu
    sudo apt-get update
    sudo apt-get install -y make build-essential libssl-dev zlib1g-dev \
        libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
        libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev \
        python3-openssl git
elif [ "$(grep -Ei 'fedora|rhel' /etc/*release)" ]; then
    # Fedora/RHEL
    sudo dnf install -y make gcc patch zlib-devel bzip2 bzip2-devel readline-devel sqlite sqlite-devel \
        openssl-devel tk-devel libffi-devel xz-devel python3-openssl git
fi

# Check if pyenv is already installed
if [ -d "$HOME/.pyenv" ]; then
    echo "pyenv is already installed. Updating..."
    cd "$HOME/.pyenv" && git pull
else
    echo "Installing pyenv..."
    git clone https://github.com/pyenv/pyenv.git "$HOME/.pyenv"
fi

# Add pyenv to shell configuration
echo "Configuring shell..."
SHELL_CONFIG="$HOME/.$(basename $SHELL)rc"

# Remove any existing pyenv configurations
sed -i.bak '/PYENV/d' "$SHELL_CONFIG"
sed -i.bak '/pyenv/d' "$SHELL_CONFIG"

# Add pyenv configurations
cat << 'EOF' >> "$SHELL_CONFIG"
# pyenv configuration
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
EOF

# Install pyenv-virtualenv plugin
if [ ! -d "$HOME/.pyenv/plugins/pyenv-virtualenv" ]; then
    git clone https://github.com/pyenv/pyenv-virtualenv.git "$HOME/.pyenv/plugins/pyenv-virtualenv"
    echo 'eval "$(pyenv virtualenv-init -)"' >> "$SHELL_CONFIG"
fi

echo "Installation complete! Please restart your shell or run:"
echo "source $SHELL_CONFIG" 