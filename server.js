const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configurações
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Caminho para o yt-dlp (usando binário incluído no projeto)
const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp');

// Middleware para verificar se o yt-dlp está acessível
app.use((req, res, next) => {
  if (!fs.existsSync(ytDlpPath)) {
    return res.status(500).json({ error: 'Binário yt-dlp não encontrado' });
  }
  next();
});

// Rota de download simplificada
app.post('/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL não fornecida' });

    // Criar diretório temporário
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // Executar yt-dlp diretamente
    exec(`${ytDlpPath} -x --audio-format mp3 -o "${tempDir}/%(title)s.%(ext)s" "${url}"`, 
      (error, stdout, stderr) => {
        if (error) {
          console.error('Erro:', stderr);
          return res.status(500).json({ error: 'Falha no download' });
        }

        // Encontrar o arquivo baixado
        fs.readdir(tempDir, (err, files) => {
          if (err) return res.status(500).json({ error: 'Erro ao ler arquivos' });
          
          const audioFile = files.find(f => f.endsWith('.mp3'));
          if (!audioFile) return res.status(500).json({ error: 'Arquivo não encontrado' });

          const filePath = path.join(tempDir, audioFile);
          res.download(filePath, audioFile, (err) => {
            fs.unlink(filePath, () => {}); // Limpar após download
            if (err) console.error('Erro ao enviar arquivo:', err);
          });
        });
      }
    );

  } catch (error) {
    console.error('Erro no processo:', error);
    res.status(500).json({ error: error.message || 'Erro no servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});