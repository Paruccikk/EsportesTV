const footballM3UUrl = 'https://raw.githubusercontent.com/Paruccikk/EsportesTV/main/futebol.m3u';

async function loadAndProcessM3U(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n');
        return parseM3U(lines);
    } catch (error) {
        console.error('Erro ao carregar o arquivo M3U:', error);
        return {};
    }
}

function parseM3U(lines) {
    const m3uCategories = {};
    lines.forEach((line, index) => {
        line = line.trim();

        if (line.startsWith('#EXTINF:')) {
            const categoryMatch = line.match(/group-title="([^"]+)"/);
            const category = categoryMatch ? categoryMatch[1] : 'Sem Categoria';
            const nameMatch = line.match(/,(.*)$/);
            const name = nameMatch ? nameMatch[1].trim() : 'Sem Nome';
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : 'https://i.ibb.co/QN39jVN/TV-Brasil-branco.png'; // Logo padrão

            if (!m3uCategories[category]) {
                m3uCategories[category] = [];
            }

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

    return m3uCategories;
}

async function loadFootballChannels() {
    const footballCategories = await loadAndProcessM3U(footballM3UUrl);
    return footballCategories;
}

function displayFootballCategories(footballCategories) {
    const footballContainer = document.getElementById('football-categories-container');
    footballContainer.innerHTML = ''; // Limpar o conteúdo existente

    if (Object.keys(footballCategories).length === 0) {
        footballContainer.innerHTML = '<p>Nenhuma categoria de futebol encontrada.</p>';
        return;
    }

    for (const [category, channels] of Object.entries(footballCategories)) {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'football-category-btn';
        categoryButton.innerHTML = `
            <img src="${channels[0].logo}" alt="${category}" onerror="this.src='https://i.ibb.co/QN39jVN/TV-Brasil-branco.png'" />
            ${category}
        `;
        categoryButton.addEventListener('click', () => {
            showChannelsInPopup(category, channels);
        });

        footballContainer.appendChild(categoryButton);
    }
}

function showChannelsInPopup(category, channels) {
    closePopup();

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">×</button>
            <div class="popup-inner">
                <div id="channel-list" class="channel-list">
                    ${channels.map(channel => `
                        <div class="channel-item" data-url="${channel.url}">
                            <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='https://i.ibb.co/QN39jVN/TV-Brasil-branco.png'" />
                            <span>${channel.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="video-container">
                    <video id="video-player" class="video-js vjs-default-skin" controls autoplay width="100%" height="auto">
                        Seu navegador não suporta a tag de vídeo.
                    </video>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    const player = document.getElementById('video-player');
    const firstChannel = channels[0];

    loadVideo(player, firstChannel.url);

    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            loadVideo(player, url);
        });
    });

    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });

    popup.style.display = 'flex';
}

function loadVideo(player, url) {
    if (url.endsWith('.m3u8')) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(player);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                player.play();
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
            });
        } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
            player.src = url;
            player.addEventListener('loadedmetadata', () => {
                player.play();
            });
        } else {
            console.error('HLS is not supported in this browser.');
        }
    } else {
        player.src = url;
        player.addEventListener('loadedmetadata', () => {
            player.play();
        });
    }
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

// Carregar e exibir os canais de futebol separadamente
loadFootballChannels().then(footballCategories => {
    displayFootballCategories(footballCategories);
});
