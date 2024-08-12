document.addEventListener('DOMContentLoaded', function() {
    fetch('canais.m3u')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            const m3uCategories = {};
            let currentCategory = '';

            lines.forEach((line, index) => {
                line = line.trim();

                if (line.startsWith('#EXTINF:')) {
                    // Extrair informações do canal
                    const categoryMatch = line.match(/group-title="([^"]+)"/);
                    const category = categoryMatch ? categoryMatch[1] : 'Sem Categoria';
                    const nameMatch = line.match(/,(.*)$/);
                    const name = nameMatch ? nameMatch[1].trim() : 'Sem Nome';
                    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                    const logo = logoMatch ? logoMatch[1] : 'https://via.placeholder.com/100'; // Logo padrão

                    if (!m3uCategories[category]) {
                        m3uCategories[category] = [];
                    }

                    // Adicionar a próxima linha que contém a URL
                    const url = lines[index + 1]?.trim();

                    if (url) {
                        m3uCategories[category].push({
                            name: name,
                            url: url,
                            logo: logo
                        });
                    }
                }
            });

            const categoriesContainer = document.getElementById('categories-container');
            const channelsContainer = document.getElementById('channels-container');

            for (const [category, channels] of Object.entries(m3uCategories)) {
                const categoryButton = document.createElement('button');
                categoryButton.className = 'm3u-category-btn';
                categoryButton.innerHTML = `
                    <img src="${channels[0].logo}" alt="${category}" onerror="this.src='https://via.placeholder.com/100'" />
                    ${category}
                `;
                categoryButton.addEventListener('click', () => {
                    showChannels(category, channels);
                });

                categoriesContainer.appendChild(categoryButton);
            }

            function showChannels(category, channels) {
                // Limpar canais existentes
                channelsContainer.innerHTML = '';

                // Criar seção para canais
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';

                channels.forEach(channel => {
                    const channelItem = document.createElement('div');
                    channelItem.className = 'channel-item';
                    channelItem.innerHTML = `
                        <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='https://via.placeholder.com/100'" />
                        <span>${channel.name}</span>
                    `;
                    channelItem.addEventListener('click', () => {
                        openVideo(channel.url);
                    });

                    categorySection.appendChild(channelItem);
                });

                channelsContainer.appendChild(categorySection);
                categorySection.style.display = 'grid'; // Exibir canais

                // Rolar a página para a grade de canais
                channelsContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });

    document.addEventListener('click', function(event) {
        const target = event.target;
        if (!target.closest('.m3u-category-btn') && !target.closest('#channels-container')) {
            closeAllCategories();
        }
    });
});

function openVideo(url) {
    closePopup();

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">×</button>
            <video id="video-player" class="video-js vjs-default-skin" controls autoplay width="100%" height="auto">
                Seu navegador não suporta a tag de vídeo.
            </video>
        </div>
    `;
    document.body.appendChild(popup);

    fetch(url, { mode: 'no-cors' })
        .then(response => {
            // Como a resposta é "opaca", você não terá acesso ao conteúdo.
            // Ainda assim, você pode tentar usá-la.
            return response.blob();
        })
        .then(blob => {
            const videoUrl = URL.createObjectURL(blob);
            const player = document.getElementById('video-player');
            player.src = videoUrl;
            player.play();
        })
        .catch(error => {
            console.error('Failed to load video:', error);
        });

    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });

    popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        let player = document.getElementById('video-player');
        if (player) {
            player.remove(); // Remove o player para limpar recursos
        }
        document.body.removeChild(popup);
    }
}

function closeAllCategories() {
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}
