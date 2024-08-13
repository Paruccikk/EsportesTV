const proxyUrl = 'https://api.allorigins.win/get?url=';
const targetUrl = 'https://dl.dropboxusercontent.com/s/83e4vyu5fyqdrerbvuyga/canais.m3u'; // Link direto do Dropbox

fetch(proxyUrl + encodeURIComponent(targetUrl))
    .then(response => response.json())
    .then(data => {
        console.log('Dados recebidos do proxy:', data); // Log do conteúdo recebido
        const lines = data.contents.split('\n');
        console.log('Linhas do arquivo .m3u:', lines); // Log das linhas do arquivo

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
                console.log('Canal:', { name, url }); // Log do canal processado

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
        console.log('Categorias processadas:', m3uCategories); // Log das categorias processadas

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
    })
    .catch(error => console.error('Erro ao carregar o arquivo:', error));

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


    document.getElementById('search-button').addEventListener('click', async function() {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        const channels = await loadM3U(proxyUrl + encodeURIComponent(targetUrl));
        displayChannels(channels);

        let found = false;
        document.querySelectorAll('#categories-container .channel').forEach(channel => {
            if (channel.dataset.name.toLowerCase().includes(query)) {
                channel.classList.add('highlight');
                channel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                found = true;
            } else {
                channel.classList.remove('highlight');
            }
        });

        if (!found) {
            alert('Nenhum canal encontrado.');
        }
    });

    async function loadM3U(url) {
        const response = await fetch(url);
        const text = await response.text();
        const channels = parseM3U(text);
        return channels;
    }

    function parseM3U(data) {
        const lines = data.split('\n');
        const channels = [];
        let currentCategory = '';

        lines.forEach(line => {
            if (line.startsWith('#EXTINF:')) {
                const [_, info] = line.split('#EXTINF:');
                const [details, name] = info.split(',', 2);
                const [category] = details.split('group-title=', 2);
                channels.push({ name: name.trim(), category: category ? category.trim().replace(/"/g, '') : currentCategory });
            } else if (line.startsWith('#EXTGRP:')) {
                currentCategory = line.split('#EXTGRP:')[1].trim();
            }
        });

        return channels;
    }

    function displayChannels(channels) {
        const container = document.getElementById('categories-container');
        container.innerHTML = '';
        channels.forEach(channel => {
            const div = document.createElement('div');
            div.className = 'channel';
            div.dataset.name = channel.name;
            div.textContent = channel.name;
            container.appendChild(div);
        });
    };
