document.addEventListener('DOMContentLoaded', function() {
    fetch('canais.m3u')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            const m3uCategories = {};
            let currentCategory = '';

            lines.forEach(line => {
                line = line.trim();

                if (line.includes('#gênero#')) {
                    currentCategory = line.replace('#gênero#', '').trim();
                    if (!m3uCategories[currentCategory]) {
                        m3uCategories[currentCategory] = [];
                    }
                } else if (line && currentCategory) {
                    const [name, url] = line.split(',');
                    if (name && url) {
                        m3uCategories[currentCategory].push({
                            name: name.trim(),
                            url: url.trim(),
                            logo: 'https://via.placeholder.com/100' // Logo padrão
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
                categorySection.style.display = 'none';

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

    document.addEventListener('click', function(event) {
        const target = event.target;
        if (!target.closest('.m3u-category-btn') && !target.closest('.category-section')) {
            closeAllCategories();
        }
    });
});

function toggleCategoryVisibility(category) {
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        if (section.id === `section-${category.replace(/\s+/g, '-')}`) {
            section.style.display = section.style.display === 'none' || !section.style.display ? 'grid' : 'none';
        } else {
            section.style.display = 'none';
        }
    });
}

function closeAllCategories() {
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

function openVideo(url) {
    closePopup();

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

    let player = videojs('video-player', {
        autoplay: true,
        controls: true,
        fluid: true
    });

    player.src({ src: url, type: 'application/x-mpegURL' });
    player.play();

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
        let player = videojs('video-player');
        if (player) {
            player.dispose(); // Destruir o player
        }
        document.body.removeChild(popup);
    }
}
