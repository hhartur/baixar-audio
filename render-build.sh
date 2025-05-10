#!/bin/bash
set -e

echo ">>> Instalando dependências..."
sudo apt-get update
sudo apt-get install -y ffmpeg python3-pip

echo ">>> Instalando yt-dlp..."
sudo pip3 install --upgrade yt-dlp

echo ">>> Verificando instalação..."
yt-dlp --version

echo ">>> Configurando permissões..."
if [ -f "./bin/yt-dlp" ]; then
  chmod +x ./bin/yt-dlp
fi

echo ">>> Build completo!"