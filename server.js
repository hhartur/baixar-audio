const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configurações
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Verifica se está no Render
const isRender = process.env.RENDER;

// Caminho para o yt-dlp
const ytDlpCommand = process.env.NODE_ENV === 'production' 
  ? '/opt/render/.local/bin/yt-dlp'
  : path.join(__dirname, 'bin', 'yt-dlp');

// Função para sanitizar nomes de arquivo
function sanitizeFilename(name) {
  return name.replace(/[^\w\s.-]/g, '').replace(/\s+/g, ' ').trim();
}

// Rota de download
app.post('/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL não fornecida' });

    // 1. Obter título do vídeo
    const title = await new Promise((resolve, reject) => {
      exec(`${ytDlpCommand} --get-title "${url}"`, (err, stdout, stderr) => {
        if (err) return reject(new Error('Falha ao obter título'));
        resolve(sanitizeFilename(stdout.trim()));
      });
    });

    // 2. Configurar caminhos
    const outputDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `${title}.mp3`);

    // 3. Download e conversão
    await new Promise((resolve, reject) => {
      exec(
        `${ytDlpCommand} -x --audio-format mp3 -o "${outputPath}" "${url}"`,
        (err, stdout, stderr) => {
          if (err) return reject(new Error('Falha no download'));
          resolve();
        }
      );
    });

    // 4. Enviar arquivo
    res.download(outputPath, `${title}.mp3`, (err) => {
      // Limpar arquivo temporário
      fs.unlink(outputPath, () => {});
      if (err) console.error('Erro ao enviar arquivo:', err);
    });

  } catch (error) {
    console.error('Erro no processo:', error);
    res.status(500).json({ error: error.message || 'Erro no servidor' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});