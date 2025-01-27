// Parallax efekk
const outer = document.querySelector('.outer');
const content = document.querySelector('.content');

outer.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    content.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
});

outer.addEventListener('mouseleave', () => {
    content.style.transform = 'rotateX(0) rotateY(0)';
});

// efek hujann 
const rainContainer = document.querySelector('.rain-container');

function createRaindrop() {
    const drop = document.createElement('div');
    drop.classList.add('drop');
    drop.style.left = `${Math.random() * 100}vw`;
    drop.style.animationDuration = `${Math.random() * 1 + 0.5}s`; // Kecepatan jatuh hujan
    drop.style.animationDelay = `${Math.random() * 2}s`;
    rainContainer.appendChild(drop);

    // Hapus tetesan setelah jatuh
    drop.addEventListener('animationend', () => {
        drop.remove();
    });
}

// Animasi hujan
let lastDropTime = 0;
const dropInterval = 50; // Interval

function animateRain(currentTime) {
    if (currentTime - lastDropTime > dropInterval) {
        createRaindrop();
        lastDropTime = currentTime;
    }
    requestAnimationFrame(animateRain);
}

requestAnimationFrame(animateRain);

// cahayaa
const lightningContainer = document.querySelector('.lightning-container');

function createLightning() {
    const lightning = document.createElement('div');
    lightning.classList.add('lightning');
    lightningContainer.appendChild(lightning);

    // petiRR
    lightning.addEventListener('animationend', () => {
        lightning.remove();
    });
}

// petirr muncull
setInterval(createLightning, 9000);