document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesFromJSON();
});

function loadCategoriesFromJSON() {
    fetch('canais.json')
        .then(response => response.json())
        .then(data => {
            const categoryButtonsContainer = document.querySelector('.category-buttons');
            const channelPopup = document.getElementById('channelPopup');
            const closeButton = document.querySelector('.close-btn');
            const channelContainer = document.getElementById('channelContainer');

            data.categorias.forEach(categoria => {
                // Cria um botão para cada categoria
                const categoryButton = document.createElement('button');
                categoryButton.classList.add('category-btn');
                categoryButton.textContent = categoria.nome;
                categoryButton.setAttribute('data-canais', JSON.stringify(categoria.canais));

                // Adiciona a imagem da categoria ao botão
                const categoryImage = document.createElement('img');
                categoryImage.src = categoria.imagemSrc;
                categoryImage.alt = categoria.nome;
                categoryButton.prepend(categoryImage);

                // Adiciona o botão ao container de categorias
                categoryButtonsContainer.appendChild(categoryButton);

                // Evento de clique para exibir os canais da categoria
                categoryButton.addEventListener('click', function() {
                    const canais = JSON.parse(this.getAttribute('data-canais'));
                    displayChannelButtons(canais);
                });
            });

            // Função para exibir botões dos canais
            function displayChannelButtons(canais) {
                const channelButtonsContainer = document.querySelector('.channel-buttons');
                channelButtonsContainer.innerHTML = ''; // Limpa os botões anteriores

                if (canais.length === 0) {
                    channelButtonsContainer.innerHTML = 'Nenhum canal disponível para esta categoria.';
                    return;
                }

                canais.forEach(canal => {
                    const button = document.createElement('button');
                    button.classList.add('channel-btn');
                    button.textContent = canal.nome || 'Sem Nome'; // Exibe 'Sem Nome' se o nome do canal estiver ausente
                    button.setAttribute('data-iframe', canal.iframeSrc || ''); // Verifica se o iframeSrc existe

                    button.addEventListener('click', function() {
                        const iframeSrc = this.getAttribute('data-iframe');
                        if (iframeSrc) {
                            channelContainer.innerHTML = `<iframe src="${iframeSrc}" frameborder="0" height="400" width="100%" allow="encrypted-media" allowfullscreen></iframe>`;
                            channelPopup.style.display = 'flex';
                        } else {
                            console.error('Iframe source não definido para o canal:', canal);
                        }
                    });

                    channelButtonsContainer.appendChild(button);
                });
            }

            // Evento para fechar o popup
            closeButton.addEventListener('click', function() {
                channelPopup.style.display = 'none';
                channelContainer.innerHTML = ''; // Limpa o conteúdo do iframe ao fechar
            });

            // Fechar o popup clicando fora do conteúdo
            channelPopup.addEventListener('click', function(e) {
                if (e.target === channelPopup) {
                    channelPopup.style.display = 'none';
                    channelContainer.innerHTML = ''; // Limpa o conteúdo do iframe ao fechar
                }
            });
        })
        .catch(error => {
            console.error('Erro ao carregar categorias do JSON:', error);
            document.querySelector('.category-buttons').innerHTML = 'Erro ao carregar categorias.';
        });
}
