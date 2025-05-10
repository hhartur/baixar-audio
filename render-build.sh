#!/bin/bash
set -e

echo ">>> Instalando yt-dlp via pip..."
python3 -m pip install --user --upgrade yt-dlp

echo ">>> Verificando instalação..."
~/.local/bin/yt-dlp --version

echo ">>> Criando link simbólico..."
ln -sf ~/.local/bin/yt-dlp /opt/render/.local/bin/yt-dlp

echo ">>> Build completo!"