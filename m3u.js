const m3uUrls = [
    'https://raw.githubusercontent.com/Paruccikk/EsportesTV/main/canais.m3u',
    'https://raw.githubusercontent.com/Paruccikk/EsportesTV/main/filmes.m3u',
    'https://raw.githubusercontent.com/Paruccikk/EsportesTV/main/filmes2.m3u',
    'https://raw.githubusercontent.com/Paruccikk/EsportesTV/main/filmes3.m3u'
    // Adicione mais URLs conforme necessário
];

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
    let currentCategory = '';

    lines.forEach((line, index) => {
        line = line.trim();

        if (line.startsWith('#EXTINF:')) {
            const categoryMatch = line.match(/group-title="([^"]+)"/);
            const category = categoryMatch ? categoryMatch[1] : 'Sem Categoria';
            const nameMatch = line.match(/,(.*)$/);
            const name = nameMatch ? nameMatch[1].trim() : 'Sem Nome';
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : 'https://via.placeholder.com/100'; // Logo padrão

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

async function loadAllM3Us(urls) {
    const promises = urls.map(url => loadAndProcessM3U(url));
    const results = await Promise.all(promises);
    
    const allCategories = {};

    results.forEach(m3uCategories => {
        for (const [category, channels] of Object.entries(m3uCategories)) {
            if (!allCategories[category]) {
                allCategories[category] = [];
            }
            allCategories[category] = allCategories[category].concat(channels);
        }
    });

    return allCategories;
}

loadAllM3Us(m3uUrls).then(allCategories => {
    const categoriesContainer = document.getElementById('categories-container');
    
    for (const [category, channels] of Object.entries(allCategories)) {
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
});

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

function closeAllCategories() {
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

document.getElementById('search-button').addEventListener('click', async function() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const allCategories = await loadAllM3Us(m3uUrls);
    const channels = parseM3UFromCategories(allCategories);

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

function parseM3UFromCategories(categories) {
    const channels = [];
    for (const [category, channelList] of Object.entries(categories)) {
        channelList.forEach(channel => {
            channels.push({ name: channel.name, category: category });
        });
    }
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
}

const player = videojs('video-player');

// Função para remover um botão específico
function removeButton(buttonClass) {
    const button = player.controlBar.getChild(buttonClass);
    if (button) {
        player.controlBar.removeChild(button);
    }
}

// Remove os botões indesejados
removeButton('vjs-menu-button'); // Ajuste a classe conforme necessário

// Adiciona um novo botão personalizado
player.controlBar.addChild('button', {
    text: 'Custom Button',
    name: 'CustomButton',
    clickHandler: function() {
        alert('Custom button clicked!');
    }
});
