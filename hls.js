function openVideo(url) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">×</button>
            <video id="video-player" controls autoplay width="100%" height="auto">
                Seu navegador não suporta a tag de vídeo.
            </video>
        </div>
    `;
    document.body.appendChild(popup);

    const video = document.getElementById('video-player');

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(error => {
                console.error('Erro ao tentar reproduzir o vídeo:', error);
            });
        });
        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('Erro no hls.js:', data.fatal);
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(error => {
                console.error('Erro ao tentar reproduzir o vídeo:', error);
            });
        });
    } else {
        alert('Seu navegador não suporta a reprodução deste vídeo.');
    }

    // Fecha o popup ao clicar fora dele
    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });

    // Torna o popup visível
    popup.style.display = 'flex';
}
