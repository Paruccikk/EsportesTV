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

            for (const [category, channels] of Object.entries(m3uCategories)) {
                const categoryButton = document.createElement('button');
                categoryButton.className = 'm3u-category-btn';
                categoryButton.innerHTML = `
                    <img src="${channels[0].logo}" alt="${category}" onerror="this.src='https://via.placeholder.com/100'" />
                    ${category}
                `;
                categoryButton.addEventListener('click', () => {
                    showChannelsInPopup(category, channels);
                });

                categoriesContainer.appendChild(categoryButton);
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
                                        <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='https://via.placeholder.com/100'" />
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

                // Carregar o primeiro canal da categoria no player
                loadVideo(player, firstChannel.url);

                // Adicionar evento de clique aos canais para trocar o vídeo no player
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
                // Verificar se a URL termina com .m3u8
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
                    // Para .mp4 e .ts
                    player.src = url;
                    player.addEventListener('loadedmetadata', () => {
                        player.play();
                    });
                }
            }
        });

    document.addEventListener('click', function(event) {
        const target = event.target;
        if (!target.closest('.m3u-category-btn') && !target.closest('.popup-content')) {
            closeAllCategories();
        }
    });
});

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

// Função para carregar e processar o arquivo .m3u
async function loadM3U(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n');
        const channels = [];
        let currentChannel = null;

        lines.forEach(line => {
            if (line.startsWith('#EXTINF:')) {
                const name = line.split(',')[1];
                currentChannel = { name };
            } else if (line.startsWith('http') && currentChannel) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        });

        return channels;
    } catch (error) {
        console.error('Erro ao carregar o arquivo M3U:', error);
        return [];
    }
}

// Função para exibir canais
function displayChannels(channels) {
    const container = document.getElementById('categories-container');
    container.innerHTML = ''; // Limpar o conteúdo anterior
    channels.forEach(channel => {
        const div = document.createElement('div');
        div.className = 'channel';
        div.dataset.name = channel.name;
        div.textContent = channel.name;
        container.appendChild(div);
    });
}

// Função de busca
document.getElementById('search-button').addEventListener('click', async function() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const channels = await loadM3U('caminho/para/seu/arquivo.m3u'); // Atualize o caminho do arquivo
    displayChannels(channels);

    // Função para rolar para o elemento visível
    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Limpar destaques e rolar para o item correspondente
    let found = false;
    document.querySelectorAll('#categories-container .channel').forEach(channel => {
        if (channel.dataset.name.toLowerCase().includes(query)) {
            channel.classList.add('highlight');
            scrollToElement(channel);
            found = true;
        } else {
            channel.classList.remove('highlight');
        }
    });

    if (!found) {
        alert('Nenhum canal encontrado.');
    }
});

