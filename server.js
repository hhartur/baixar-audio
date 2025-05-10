// backend/server.js
const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core'); // Usando o fork mantido
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const sanitize = require('sanitize-filename'); // Para nomes de arquivo seguros

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do FFmpeg (opcional, se não estiver no PATH global)
// Se você instalou o ffmpeg e ele não está no PATH global, descomente e ajuste:
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// ffmpeg.setFfmpegPath(ffmpegPath);

app.use(cors()); // Permite requisições de diferentes origens (seu frontend)
app.use(express.json()); // Para parsear JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos do frontend

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'URL do YouTube inválida.' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const videoTitle = sanitize(info.videoDetails.title) || 'audio'; // Nome do arquivo seguro
        const safeFileName = `${videoTitle}.mp3`;

        console.log(`Iniciando download e conversão para: ${videoTitle}`);

        // Define os headers para o download do arquivo
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        const audioStream = ytdl(url, {
            quality: 'highestaudio',
            filter: 'audioonly',
        });

        // Converte o stream para MP3 e envia para o cliente
        ffmpeg(audioStream)
            .audioBitrate(192) // Qualidade do MP3
            .toFormat('mp3')
            .on('error', (err) => {
                console.error('Erro no FFmpeg:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Falha ao converter o áudio.', details: err.message });
                }
            })
            .on('end', () => {
                console.log(`Conversão de "${videoTitle}" para MP3 finalizada.`);
            })
            .pipe(res, { end: true }); // Envia o output do ffmpeg diretamente para a resposta HTTP

    } catch (error) {
        console.error('Erro geral:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erro ao processar o vídeo.', details: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log(`Acesse o site em http://localhost:${PORT}`);
});
