// mobile-menu.js

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLists = document.querySelectorAll('.nav-list');

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            navLists.forEach(nav => {
                nav.classList.toggle('active');
            });
            mobileMenuButton.classList.toggle('active');
        });
    }
});
