// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');
const youtubedl = require('youtube-dl-exec'); // <— mudou aqui

const app = express();
const PORT = process.env.PORT || 10000;
const TMP_DIR = '/tmp';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL inválida.' });

  try {
    // 1) Pega info do vídeo (usa cookies.txt se existir)
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      flatPlaylist: true,
      ...(fs.existsSync('cookies.txt') && { cookie: 'cookies.txt' })
    });

    // 2) Gera nome seguro
    const rawTitle = info.title || 'audio';
    const safeTitle = sanitize(rawTitle).replace(/\s+/g, '_');
    const fileName = `${safeTitle}.mp3`;
    const filePath = path.join(TMP_DIR, fileName);

    console.log(`🎵 Baixando: ${rawTitle}`);

    // 3) Baixa e converte direto para /tmp
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      format: 'bestaudio',
      output: filePath,
      ...(fs.existsSync('cookies.txt') && { cookie: 'cookies.txt' })
    });

    // 4) Envia como attachment
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res).on('finish', () => fs.unlink(filePath, () => {}));
  } catch (err) {
    console.error('❌ Erro ao processar vídeo:', err);
    res.status(500).json({ error: 'Falha ao processar o vídeo.', details: err.stderr || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
