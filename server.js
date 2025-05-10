// server.js
const express    = require('express');
const { execFile } = require('child_process');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const port = process.env.PORT || 3000;

// Serve arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Caminho absoluto para o binário
const ytDlpPath = path.resolve(__dirname, 'bin', 'yt-dlp'); // sem .exe em Linux/macOS

// Decodifica nomes de arquivo URL‑encoded
function decodeFilename(name) {
  return decodeURIComponent(name.replace(/\+/g, ' '));
}

app.post('/download', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL não fornecida' });

  // 1) Obter título
  execFile(ytDlpPath, ['--get-title', url], (err, stdout, stderr) => {
    if (err) {
      console.error('Erro ao obter título:', err);
      return res.status(500).json({ error: 'Falha ao obter título.' });
    }
    const rawTitle = decodeFilename(stdout.trim()).replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const outputDir  = path.join(__dirname, 'downloads');
    const outputPath = path.join(outputDir, `${rawTitle}.mp3`);

    // Garante existência da pasta
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // 2) Baixar e converter áudio
    execFile(
      ytDlpPath,
      ['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3', '-o', outputPath, url],
      (err2, stdout2, stderr2) => {
        if (err2) {
          console.error('Erro ao baixar áudio:', err2);
          return res.status(500).json({ error: 'Falha no download de áudio.' });
        }
        // 3) Enviar arquivo como attachment
        res.download(outputPath, `${rawTitle}.mp3`, (dlErr) => {
          if (dlErr) console.error('Erro ao enviar arquivo:', dlErr);
          fs.unlink(outputPath, () => {}); // limpa após envio
        });
      }
    );
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
