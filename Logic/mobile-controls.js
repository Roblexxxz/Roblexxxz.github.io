const directions = ['w', 'a', 's', 'd'];

export function initMobileControls(input) {
    if (document.getElementById('mobile-controls')) return;

    const controls = document.createElement('div');
    controls.id = 'mobile-controls';
    controls.innerHTML = `
        <div class="mobile-move" aria-label="Movement controls">
            <button type="button" data-key="w" aria-label="Move forward">&#9650;</button>
            <button type="button" data-key="a" aria-label="Move left">&#9664;</button>
            <button type="button" data-key="s" aria-label="Move backward">&#9660;</button>
            <button type="button" data-key="d" aria-label="Move right">&#9654;</button>
        </div>
        <button type="button" class="mobile-jump" aria-label="Jump">JUMP</button>
        <button type="button" class="mobile-free" aria-pressed="false">FREE MOVE</button>
    `;
    document.body.appendChild(controls);

    const movePad = controls.querySelector('.mobile-move');
    const freeButton = controls.querySelector('.mobile-free');
    let freeMove = false;

    const setKey = (key, pressed) => {
        input.keys[key] = pressed;
    };
    const releaseDirections = () => directions.forEach(key => setKey(key, false));

    controls.querySelectorAll('[data-key]').forEach(button => {
        const key = button.dataset.key;
        const press = event => {
            event.preventDefault();
            button.setPointerCapture?.(event.pointerId);
            setKey(key, true);
        };
        const release = event => {
            event.preventDefault();
            setKey(key, false);
        };
        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('lostpointercapture', release);
    });

    controls.querySelector('.mobile-jump').addEventListener('pointerdown', event => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('mobilejump'));
    });

    freeButton.addEventListener('click', () => {
        freeMove = !freeMove;
        freeButton.setAttribute('aria-pressed', String(freeMove));
        freeButton.textContent = freeMove ? 'FREE ON' : 'FREE MOVE';
        releaseDirections();
        movePad.classList.toggle('free-active', freeMove);
    });

    let startX = 0;
    let startY = 0;
    movePad.addEventListener('pointerdown', event => {
        if (!freeMove) return;
        event.preventDefault();
        movePad.setPointerCapture?.(event.pointerId);
        startX = event.clientX;
        startY = event.clientY;
    });
    movePad.addEventListener('pointermove', event => {
        if (!freeMove || !movePad.hasPointerCapture?.(event.pointerId)) return;
        event.preventDefault();
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        releaseDirections();
        if (Math.abs(dx) > 12) setKey(dx > 0 ? 'd' : 'a', true);
        if (Math.abs(dy) > 12) setKey(dy > 0 ? 's' : 'w', true);
    });
    movePad.addEventListener('pointerup', releaseDirections);
    movePad.addEventListener('pointercancel', releaseDirections);
}