// server.js
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Serve arquivos estáticos (HTML, CSS, JS) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para interpretar o corpo das requisições como JSON
app.use(express.json());

// Caminho para o binário do yt-dlp
const ytDlpPath = path.join(__dirname, 'yt-dlp.exe');

// Função para decodificar o nome do arquivo
function decodeFilename(filename) {
    return decodeURIComponent(filename.replace(/\+/g, ' '));
}

// Rota para processar o download do áudio
app.post('/download', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL não fornecida' });
    }

    // Comando para obter o título do vídeo usando yt-dlp
    const getTitleCommand = `"${ytDlpPath}" --get-title "${url}"`;

    exec(getTitleCommand, (error, title, stderr) => {
        if (error) {
            console.error(`Erro ao obter título do vídeo: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao obter título do vídeo.' });
        }
        if (stderr) {
            console.error(`Erro no stderr ao obter título: ${stderr}`);
            return res.status(500).json({ error: 'Erro ao processar o título do vídeo.' });
        }

        // Remove quebras de linha do título do vídeo e decodifica o nome do arquivo
        title = decodeFilename(title.trim());

        // Substitui espaços e caracteres especiais
        title = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();

        const outputPath = path.join(__dirname, 'downloads', `${title}.mp3`);
        
        // Crie a pasta 'downloads' se não existir
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        // Comando para executar o yt-dlp e baixar o áudio com o nome do vídeo
        const command = `"${ytDlpPath}" -f bestaudio --extract-audio --audio-format mp3 -o "${outputPath}" "${url}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar yt-dlp: ${error.message}`);
                return res.status(500).json({ error: 'Erro ao baixar o áudio.' });
            }
            if (stderr) {
                console.error(`Erro no stderr: ${stderr}`);
                return res.status(500).json({ error: 'Erro no processo de download.' });
            }
            
            console.log(`Saída: ${stdout}`);
            res.download(outputPath, `${title}.mp3`, (err) => {
                if (err) {
                    console.error('Erro ao enviar o arquivo:', err);
                }
                // Após o download, pode deletar o arquivo temporário se necessário
                fs.unlink(outputPath, (err) => {
                    if (err) console.error('Erro ao deletar o arquivo:', err);
                });
            });
        });
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
