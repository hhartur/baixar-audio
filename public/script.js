document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('youtubeUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');
    const progressContainer = document.getElementById('progressContainer');

    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            showError('Por favor, insira um link do YouTube.');
            return;
        }

        // Validação básica do link do YouTube (pode ser mais robusta)
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(url)) {
            showError('Link do YouTube inválido.');
            return;
        }

        clearMessages();
        downloadBtn.disabled = true;
        progressContainer.style.display = 'block';
        statusDiv.textContent = ''; // Limpa status anterior

        try {
            const response = await fetch('/download', { // A rota do backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url }),
            });

            if (response.ok) {
                // O backend está enviando o arquivo diretamente
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'audio.mp3'; // Default filename
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
                    if (filenameMatch && filenameMatch.length > 1) {
                        filename = filenameMatch[1];
                    }
                }

                statusDiv.textContent = `Baixando ${filename}...`;
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.download = filename; // Usa o nome do arquivo obtido
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                a.remove();
                statusDiv.textContent = `${filename} baixado com sucesso!`;

            } else {
                // Se o servidor enviou um erro JSON
                const errorData = await response.json();
                showError(`Erro: ${errorData.error || response.statusText}`);
            }

        } catch (err) {
            console.error('Erro na requisição:', err);
            showError('Falha ao conectar com o servidor ou erro inesperado.');
        } finally {
            downloadBtn.disabled = false;
            progressContainer.style.display = 'none';
            urlInput.value = ''; // Limpa o campo de URL
        }
    });

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        statusDiv.textContent = '';
    }

    function clearMessages() {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
});
