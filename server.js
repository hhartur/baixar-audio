const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');
const ytdlp = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Pasta temporária (Render permite uso de disco temporário em /tmp)
const TMP_DIR = '/tmp';

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL inválida.' });
    }

    try {
        // Passo 1: pega as informações do vídeo
        const info = await ytdlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            flatPlaylist: true,
            ...(fs.existsSync(path.join(__dirname, 'cookies.txt')) && {
                cookie: path.join(__dirname, 'cookies.txt'), // Usa cookies se o arquivo existir
            }),
        });

        const rawTitle = info.title || 'audio';
        const safeTitle = sanitize(rawTitle).replace(/\s+/g, '_');
        const fileName = `${safeTitle}.mp3`;
        const filePath = path.join(TMP_DIR, fileName);

        console.log(`🎵 Baixando e convertendo: ${rawTitle}`);

        // Passo 2: baixa o áudio e converte para MP3
        await ytdlp(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0,
            format: 'bestaudio',
            output: filePath,
            ...(fs.existsSync(path.join(__dirname, 'cookies.txt')) && {
                cookie: path.join(__dirname, 'cookies.txt'),
            }),
        });

        // Verifica se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error('Arquivo não gerado.');
        }

        console.log(`✅ Enviando arquivo: ${fileName}`);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Limpa o arquivo após envio
        fileStream.on('end', () => {
            fs.unlink(filePath, () => {});
        });

    } catch (err) {
        console.error('❌ Erro ao processar vídeo:', err);
        res.status(500).json({
            error: 'Erro ao processar o vídeo.',
            details: err.stderr || err.message || err,
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
