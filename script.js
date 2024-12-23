class Game2084 {
    constructor() {
        this.initializeGame();
        this.setupInputs();
        this.loadHighScore();
        this.setupAudio();
    }

    setupAudio() {
        // Create audio elements
        this.sounds = {
            move: new Audio(),
            merge: new Audio(),
            gameOver: new Audio()
        };

        // Set source paths with direct URLs
        const audioFiles = {
            move: 'https://cdn.freesound.org/previews/242/242857_3509815-lq.mp3',
            merge: 'https://cdn.freesound.org/previews/171/171697_2437358-lq.mp3',
            gameOver: 'https://cdn.freesound.org/previews/277/277021_5293851-lq.mp3'
        };

        // Set source and add error handling
        Object.entries(audioFiles).forEach(([key, src]) => {
            this.sounds[key].src = src;
            this.sounds[key].volume = 0.3;
            
            // Add error handling
            this.sounds[key].onerror = () => {
                console.error(`Error loading ${key} sound`);
            };
            
            // Add success handling
            this.sounds[key].oncanplaythrough = () => {
                console.log(`${key} sound loaded successfully`);
            };
            
            // Force load the audio
            this.sounds[key].load();
        });

        // Test audio on first user interaction
        document.addEventListener('click', () => {
            Object.values(this.sounds).forEach(sound => {
                sound.play().then(() => {
                    sound.pause();
                    sound.currentTime = 0;
                }).catch(e => console.log('Audio test failed:', e));
            });
        }, { once: true });
    }

    initializeGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.setupGrid();
        this.addNumber();
        this.addNumber();
        this.updateDisplay();
    }

    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        document.getElementById('highScore').textContent = this.highScore;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
    }

    resetGame() {
        // Reset grid
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        // Reset score
        this.score = 0;
        document.getElementById('score').textContent = '0';
        // Add initial numbers
        this.addNumber();
        this.addNumber();
        // Update display
        this.updateDisplay();
        // Play a sound to indicate reset
        try {
            this.sounds.move.currentTime = 0;
            this.sounds.move.play().catch(e => console.log('Reset sound failed:', e));
        } catch (e) {
            console.log('Reset sound error:', e);
        }
    }

    setupGrid() {
        const gridElement = document.querySelector('.grid');
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gridElement.appendChild(cell);
        }
        this.updateDisplay();
    }

    getColor(value) {
        const colors = {
            2: '#ff9999',
            4: '#ff6666',
            8: '#ff3333',
            16: '#ff0000',
            32: '#cc0000',
            64: '#990000',
            128: '#660000',
            256: '#330000',
            512: '#000033',
            1024: '#000066',
            2048: '#000099',
            4096: '#0000cc'
        };
        return colors[value] || '#000000';
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        let cellIndex = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const value = this.grid[i][j];
                cells[cellIndex].textContent = value || '';
                cells[cellIndex].style.backgroundColor = value ? this.getColor(value) : 'rgba(238, 228, 218, 0.35)';
                cellIndex++;
            }
        }
        document.getElementById('score').textContent = this.score;
    }

    addNumber() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({i, j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(direction) {
        let moved = false;
        const oldGrid = JSON.stringify(this.grid);

        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        if (moved) {
            try {
                this.sounds.move.currentTime = 0;
                this.sounds.move.play().catch(e => console.log('Audio play failed:', e));
            } catch (e) {
                console.log('Audio error:', e);
            }
            
            this.addNumber();
            this.updateDisplay();
            this.updateHighScore();
            
            if (this.isGameOver()) {
                try {
                    this.sounds.gameOver.currentTime = 0;
                    this.sounds.gameOver.play().catch(e => console.log('Audio play failed:', e));
                } catch (e) {
                    console.log('Audio error:', e);
                }
                setTimeout(() => {
                    alert('Game Over! Final Score: ' + this.score);
                }, 100);
            }
        }
    }

    moveRow(row) {
        let arr = row.filter(x => x !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                this.score += arr[i];
                arr.splice(i + 1, 1);
                try {
                    this.sounds.merge.currentTime = 0;
                    this.sounds.merge.play().catch(e => console.log('Merge sound failed:', e));
                } catch (e) {
                    console.log('Merge sound error:', e);
                }
            }
        }
        while (arr.length < 4) {
            arr.push(0);
        }
        return arr;
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const oldRow = [...this.grid[i]];
            this.grid[i] = this.moveRow(this.grid[i]);
            if (JSON.stringify(oldRow) !== JSON.stringify(this.grid[i])) {
                moved = true;
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const oldRow = [...this.grid[i]];
            this.grid[i] = this.moveRow([...this.grid[i]].reverse()).reverse();
            if (JSON.stringify(oldRow) !== JSON.stringify(this.grid[i])) {
                moved = true;
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const column = this.grid.map(row => row[j]);
            const oldColumn = [...column];
            const newColumn = this.moveRow(column);
            for (let i = 0; i < 4; i++) {
                this.grid[i][j] = newColumn[i];
            }
            if (JSON.stringify(oldColumn) !== JSON.stringify(newColumn)) {
                moved = true;
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const column = this.grid.map(row => row[j]).reverse();
            const oldColumn = [...column];
            const newColumn = this.moveRow(column).reverse();
            for (let i = 0; i < 4; i++) {
                this.grid[i][j] = newColumn[i];
            }
            if (JSON.stringify(oldColumn) !== JSON.stringify(newColumn)) {
                moved = true;
            }
        }
        return moved;
    }

    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if ((j < 3 && current === this.grid[i][j + 1]) ||
                    (i < 3 && current === this.grid[i + 1][j])) {
                    return false;
                }
            }
        }
        return true;
    }

    setupInputs() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.move('up');
                    break;
                case 's':
                    this.move('down');
                    break;
                case 'a':
                    this.move('left');
                    break;
                case 'd':
                    this.move('right');
                    break;
            }
        });

        // Touch controls
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');

        upBtn?.addEventListener('click', () => this.move('up'));
        downBtn?.addEventListener('click', () => this.move('down'));
        leftBtn?.addEventListener('click', () => this.move('left'));
        rightBtn?.addEventListener('click', () => this.move('right'));

        // Swipe controls
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling while playing
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        });

        // Mute button
        const muteButton = document.getElementById('muteButton');
        muteButton.addEventListener('click', () => {
            const isMuted = muteButton.textContent === '🔈';
            muteButton.textContent = isMuted ? '🔊' : '🔈';
            Object.values(this.sounds).forEach(sound => {
                sound.muted = !isMuted;
            });
        });

        // Reset button
        const resetButton = document.getElementById('resetButton');
        resetButton.addEventListener('click', () => {
            this.resetGame();
        });
    }
}

// Start the game
new Game2084(); 