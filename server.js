const express = require('express');
const path = require('path');
const fs = require('fs');
const youtubedl = require('youtube-dl-exec');
const app = express();
const port = process.env.PORT || 10000;

// Pasta onde o binário do yt-dlp está armazenado
const ytDlpBinPath = path.join(__dirname, 'bin', 'yt-dlp'); // Caminho do binário

app.use(express.static(path.join(__dirname), "public"))

app.get('/download', async (req, res) => {
  const videoUrl = req.query.url; // A URL do vídeo que será passado como query string

  if (!videoUrl) {
    return res.status(400).send('URL do vídeo não fornecida!');
  }

  try {
    // Definindo o caminho para salvar o arquivo mp3
    const outputFilePath = path.join(__dirname, 'downloads', `${getVideoName(videoUrl)}.mp3`);
    
    // Cria a pasta de downloads caso não exista
    if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
      fs.mkdirSync(path.join(__dirname, 'downloads'));
    }

    // Executando yt-dlp para baixar o áudio
    youtubedl(videoUrl, {
      binary: ytDlpBinPath,  // Usando o binário local
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      format: 'bestaudio',
      output: outputFilePath,
      ...(fs.existsSync('cookies.txt') && { cookie: 'cookies.txt' })
    })
    .then(() => {
      // Enviando o arquivo para download
      res.download(outputFilePath, (err) => {
        if (err) {
          console.error('Erro ao enviar o arquivo:', err);
          res.status(500).send('Erro ao enviar o arquivo.');
        }
      });
    })
    .catch((err) => {
      console.error('Erro ao executar yt-dlp:', err);
      res.status(500).send('Erro ao processar o vídeo.');
    });
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).send('Erro ao processar o pedido.');
  }
});

// Função para extrair o nome do vídeo
function getVideoName(url) {
  const regex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|playlist\?list=)([a-zA-Z0-9_-]{11}))/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];  // Retorna o ID do vídeo como nome
  }
  return 'video';  // Caso o nome não seja encontrado, retorna 'video' como padrão
}

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
