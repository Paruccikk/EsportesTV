document.addEventListener('DOMContentLoaded', function() {
    fetch('canais.m3u')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            const m3uCategories = {};
            let currentCategory = '';

            lines.forEach((line, index) => {
                if (line.startsWith('#EXTINF')) {
                    const categoryMatch = line.match(/group-title="([^"]+)"/);
                    const nameMatch = line.match(/,([^,]+)$/);
                    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                    const url = lines[index + 1].trim(); // A URL é a próxima linha

                    if (categoryMatch && nameMatch && url) {
                        currentCategory = categoryMatch[1];
                        if (!m3uCategories[currentCategory]) {
                            m3uCategories[currentCategory] = [];
                        }
                        m3uCategories[currentCategory].push({
                            name: nameMatch[1],
                            url,
                            logo: logoMatch ? logoMatch[1] : 'https://via.placeholder.com/100' // Default logo if not provided
                        });
                    }
                }
            });

            const m3uContainer = document.getElementById('m3u-container');
            for (const [category, channels] of Object.entries(m3uCategories)) {
                const categoryButton = document.createElement('button');
                categoryButton.className = 'm3u-category-btn';
                categoryButton.innerHTML = `
                    <img src="${channels[0].logo}" alt="${category}" />
                    ${category}
                `;
                categoryButton.addEventListener('click', () => {
                    toggleCategoryVisibility(category);
                });

                m3uContainer.appendChild(categoryButton);

                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';
                categorySection.id = `section-${category.replace(/\s+/g, '-')}`;

                channels.forEach(channel => {
                    const channelItem = document.createElement('div');
                    channelItem.className = 'channel-item';
                    channelItem.innerHTML = `<span>${channel.name}</span>`;
                    channelItem.addEventListener('click', () => {
                        openVideo(channel.url);
                    });

                    categorySection.appendChild(channelItem);
                });

                m3uContainer.appendChild(categorySection);
            }
        });
});

function toggleCategoryVisibility(category) {
    const section = document.getElementById(`section-${category.replace(/\s+/g, '-')}`);
    section.style.display = section.style.display === 'none' || !section.style.display ? 'flex' : 'none';
}

function openVideo(url) {
    // Remove qualquer popup existente
    closePopup();

    // Cria o novo popup
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">×</button>
            <video id="video-player" class="video-js vjs-default-skin" controls autoplay width="100%" height="auto">
                <source src="${url}" type="application/x-mpegURL">
                Seu navegador não suporta a tag de vídeo.
            </video>
        </div>
    `;
    document.body.appendChild(popup);

    // Inicializa o player com Video.js
    videojs('video-player', {
        autoplay: true,
        controls: true,
        fluid: true
    }, function() {
        this.src({ src: url, type: 'application/x-mpegURL' });
    });

    // Fecha o popup ao clicar fora dele
    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });

    // Torna o popup visível
    popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        document.body.removeChild(popup);
    }
}
