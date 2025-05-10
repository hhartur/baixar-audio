const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configurações
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rota de download otimizada
app.post('/download', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL não fornecida' });

  // Usando yt-dlp via npx (não requer instalação global)
  const command = `npx yt-dlp@latest -x --audio-format mp3 --print filename -o "temp/%(title)s.%(ext)s" "${url}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Erro:', stderr);
      return res.status(500).json({ error: 'Falha no download' });
    }

    const filename = stdout.trim();
    const filePath = path.join(__dirname, filename);
    
    res.download(filePath, (err) => {
      if (err) console.error('Erro ao enviar arquivo:', err);
      fs.unlink(filePath, () => {});
    });
  });
});

// Garante que a pasta temp existe
if (!fs.existsSync(path.join(__dirname, 'temp'))) {
  fs.mkdirSync(path.join(__dirname, 'temp'));
}

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});