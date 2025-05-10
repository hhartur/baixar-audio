#!/bin/bash
set -e

echo ">>> Atualizando pacotes..."
apt-get update -y

echo ">>> Instalando dependências..."
apt-get install -y ffmpeg python3-pip

echo ">>> Instalando yt-dlp..."
pip3 install --upgrade yt-dlp

echo ">>> Configurando yt-dlp..."
ln -sf $(which yt-dlp) /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp

echo ">>> Verificando versão..."
yt-dlp --version

echo ">>> Build completo!"