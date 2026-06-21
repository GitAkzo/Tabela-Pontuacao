// ==================== TEMA E MENU MOBILE ====================
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;

function updateThemeIcon(isDark) { 
    themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode'; 
}

if (localStorage.getItem('portfolio-theme') === 'dark' || (!('portfolio-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    body.classList.add('dark'); 
    updateThemeIcon(true);
}

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
});

const mobileToggleBtn = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-menu');
mobileToggleBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('active');
    mobileToggleBtn.querySelector('.material-symbols-outlined').textContent = mobileNav.classList.contains('active') ? 'close' : 'menu';
});


// ==================== LÓGICA DE ABAS (GANGORRA) ====================
const tabs = [1, 2, 3];
let currentActiveTab = 1;

tabs.forEach(tabNum => {
    document.getElementById(`btn-tab${tabNum}`).addEventListener('click', () => {
        resetGameInterface(currentActiveTab);
        
        tabs.forEach(t => {
            document.getElementById(`btn-tab${t}`).classList.remove('active');
            document.getElementById(`tab${t}`).classList.add('hidden');
        });
        
        document.getElementById(`btn-tab${tabNum}`).classList.add('active');
        document.getElementById(`tab${tabNum}`).classList.remove('hidden');
        currentActiveTab = tabNum;
    });
});


// ==================== ESTADO GLOBAL DA APLICAÇÃO ====================
let players = [];
let rules = { win: 3, tie: 1, loss: 0, targetPoints: 10, tiebreaker: 'points' };
let currentActiveContext = null;

const STORAGE_KEY = 'tabelaPontuacao_state';


// ==================== ABA 1: CLÁSSICO 1v1 ====================
document.getElementById('setup-form-1').addEventListener('submit', (e) => {
    e.preventDefault();
    rules = { 
        win: 3, 
        tie: 1, 
        loss: 0, 
        targetPoints: parseInt(document.getElementById('max-points-1').value),
        tiebreaker: document.getElementById('tiebreaker-1').value
    };
    players = [
        createPlayer(document.getElementById('p1-name').value),
        createPlayer(document.getElementById('p2-name').value)
    ];
    startGame(1);
});


// ==================== ABAS 2 E 3: MULTIJOGADOR ====================
function handleMultiSetup(e, tabNum) {
    e.preventDefault();
    const prefix = tabNum === 2 ? 'multi' : 'custom';
    const qtd = parseInt(document.getElementById(`${prefix}-qtd`).value);
    const autoName = document.getElementById(`${prefix}-auto`).checked;

    if (autoName) {
        players = Array.from({length: qtd}, (_, i) => createPlayer(`Jogador ${i + 1}`));
        submitGameParams(tabNum);
    } else {
        const container = document.getElementById(`dynamic-names-${tabNum}`);
        container.innerHTML = '';
        for(let i = 0; i < qtd; i++) {
            container.innerHTML += `
                <div class="input-group" style="margin-bottom: 0;">
                    <input type="text" id="name-${tabNum}-${i}" class="w-100" required placeholder="Nome do Jogador ${i + 1}">
                </div>
            `;
        }
        document.getElementById(`setup-view-${tabNum}-step1`).classList.add('hidden');
        document.getElementById(`setup-view-${tabNum}-step2`).classList.remove('hidden');
    }
}

document.getElementById('setup-form-2').addEventListener('submit', (e) => handleMultiSetup(e, 2));
document.getElementById('setup-form-3').addEventListener('submit', (e) => handleMultiSetup(e, 3));

document.querySelectorAll('.btn-back-step').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById(`setup-view-${currentActiveTab}-step2`).classList.add('hidden');
        document.getElementById(`setup-view-${currentActiveTab}-step1`).classList.remove('hidden');
    });
});

function handleNamesSubmit(e, tabNum) {
    e.preventDefault();
    const qtd = parseInt(document.getElementById(tabNum === 2 ? 'multi-qtd' : 'custom-qtd').value);
    players = [];
    for(let i = 0; i < qtd; i++) {
        players.push(createPlayer(document.getElementById(`name-${tabNum}-${i}`).value));
    }
    submitGameParams(tabNum);
}

document.getElementById('names-form-2').addEventListener('submit', (e) => handleNamesSubmit(e, 2));
document.getElementById('names-form-3').addEventListener('submit', (e) => handleNamesSubmit(e, 3));

function submitGameParams(tabNum) {
    if (tabNum === 2) {
        rules = { 
            win: 3, 
            tie: 1, 
            loss: 0, 
            targetPoints: parseInt(document.getElementById('max-points-2').value),
            tiebreaker: document.getElementById('tiebreaker-2').value
        };
    } else if (tabNum === 3) {
        rules = {
            win: parseInt(document.getElementById('custom-win').value),
            tie: parseInt(document.getElementById('custom-tie').value),
            loss: parseInt(document.getElementById('custom-loss').value),
            targetPoints: parseInt(document.getElementById('max-points-3').value),
            tiebreaker: document.getElementById('tiebreaker-3').value
        };
    }
    
    document.getElementById(`setup-view-${tabNum}-step1`).classList.add('hidden');
    const step2 = document.getElementById(`setup-view-${tabNum}-step2`);
    if(step2) step2.classList.add('hidden');
    
    startGame(tabNum);
}


// ==================== ENGINE DA TABELA E PONTUAÇÃO ====================
function createPlayer(nome) {
    return { nome: nome, vitorias: 0, empates: 0, derrotas: 0, pontos: 0 };
}

function startGame(tabNum) {
    currentActiveContext = tabNum;
    document.getElementById(`game-view-${tabNum}`).classList.remove('hidden');
    updateTable();
}

function updateTable() {
    players.forEach(p => {
        p.pontos = (p.vitorias * rules.win) + (p.empates * rules.tie) + (p.derrotas * rules.loss);
    });

    const tbody = document.getElementById(`tabela-${currentActiveContext}`);
    tbody.innerHTML = '';

    players.forEach((p, index) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${p.nome}</strong></td>
                <td>${p.vitorias}</td>
                <td>${p.empates}</td>
                <td>${p.derrotas}</td>
                <td class="score-highlight">${p.pontos}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-win" onClick="triggerWin(${index})">Vitória</button>
                        <button class="btn-action btn-tie" onClick="triggerTie(${index})">Empate</button>
                    </div>
                </td>
            </tr>
        `;
    });

    saveGameState();
    checkWinner();
}


// ==================== AÇÕES E MODAL DE SELEÇÃO DE ALVO ====================
const targetModal = document.getElementById('target-modal');
const modalTitle = document.getElementById('modal-title');
const modalButtons = document.getElementById('modal-buttons');

window.triggerWin = function(winnerIndex) {
    if (players.length === 2) {
        const loserIndex = winnerIndex === 0 ? 1 : 0;
        applyResult(winnerIndex, loserIndex, 'win');
    } else {
        openTargetModal(winnerIndex, 'win');
    }
};

window.triggerTie = function(playerIndex) {
    if (players.length === 2) {
        const otherIndex = playerIndex === 0 ? 1 : 0;
        applyResult(playerIndex, otherIndex, 'tie');
    } else {
        openTargetModal(playerIndex, 'tie');
    }
};

function openTargetModal(sourceIndex, actionType) {
    const sourcePlayer = players[sourceIndex];
    modalTitle.textContent = actionType === 'win' 
        ? `Quem ${sourcePlayer.nome} derrotou?` 
        : `Com quem ${sourcePlayer.nome} empatou?`;
    
    modalButtons.innerHTML = '';
    
    players.forEach((targetPlayer, targetIndex) => {
        if (targetIndex !== sourceIndex) {
            const btn = document.createElement('button');
            btn.className = 'btn-primary btn-block';
            btn.textContent = targetPlayer.nome;
            btn.onclick = () => {
                applyResult(sourceIndex, targetIndex, actionType);
                closeModal();
            };
            modalButtons.appendChild(btn);
        }
    });

    targetModal.classList.remove('hidden');
}

document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
function closeModal() { targetModal.classList.add('hidden'); }

function applyResult(sourceIndex, targetIndex, actionType) {
    if (actionType === 'win') {
        players[sourceIndex].vitorias++;
        players[targetIndex].derrotas++;
    } else if (actionType === 'tie') {
        players[sourceIndex].empates++;
        players[targetIndex].empates++;
    }
    updateTable();
}


// ==================== CHECAGEM DE VITÓRIA E DESEMPATE ====================
function checkWinner() {
    const maxPoints = Math.max(...players.map(p => p.pontos));
    if (maxPoints < rules.targetPoints) return;

    const topScorers = players.filter(p => p.pontos === maxPoints);
    let winner = null;

    if (topScorers.length === 1) {
        winner = topScorers[0];
    } else {
        if (rules.tiebreaker === 'wins') {
            const maxWins = Math.max(...topScorers.map(p => p.vitorias));
            const topScorersByWins = topScorers.filter(p => p.vitorias === maxWins);
            if (topScorersByWins.length === 1) {
                winner = topScorersByWins[0];
            }
        }
    }

    if (winner) {
        localStorage.removeItem(STORAGE_KEY); 
        setTimeout(() => {
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('winner-view').classList.remove('hidden');
            document.getElementById('winner-message').textContent = `${winner.nome} alcançou os pontos e venceu!`;
        }, 300);
    }
}


// ==================== RESETS E LIMPEZA DE ESTADO ====================
document.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        resetGameInterface(currentActiveTab);
    });
});

document.getElementById('btn-play-again').addEventListener('click', () => {
    resetGameInterface(currentActiveTab);
    document.getElementById(`tab${currentActiveTab}`).classList.remove('hidden');
});

function resetGameInterface(tabNum) {
    players = [];
    const step1 = document.getElementById(`setup-view-${tabNum}-step1`);
    const step2 = document.getElementById(`setup-view-${tabNum}-step2`);
    const game = document.getElementById(`game-view-${tabNum}`);
    
    if(step1) step1.classList.remove('hidden');
    if(step2) step2.classList.add('hidden');
    if(game) game.classList.add('hidden');
    
    document.getElementById('winner-view').classList.add('hidden');
    document.getElementById('target-modal').classList.add('hidden');
    
    const formName2 = document.getElementById('names-form-2');
    const formName3 = document.getElementById('names-form-3');
    if(formName2) formName2.reset();
    if(formName3) formName3.reset();
}


// ==================== LOCAL STORAGE (PERSISTÊNCIA) ====================
function saveGameState() {
    if (players.length > 0) {
        const state = { players, rules, currentActiveContext };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (savedData) {
        document.getElementById('resume-modal').classList.remove('hidden');
        
        document.getElementById('btn-resume-game').addEventListener('click', () => {
            const data = JSON.parse(savedData);
            players = data.players;
            rules = data.rules;
            currentActiveContext = data.currentActiveContext;
            
            currentActiveTab = currentActiveContext;
            
            tabs.forEach(t => {
                document.getElementById(`btn-tab${t}`).classList.remove('active');
                document.getElementById(`tab${t}`).classList.add('hidden');
                
                const step1 = document.getElementById(`setup-view-${t}-step1`);
                const step2 = document.getElementById(`setup-view-${t}-step2`);
                if(step1) step1.classList.remove('hidden');
                if(step2) step2.classList.add('hidden');
            });

            document.getElementById(`btn-tab${currentActiveContext}`).classList.add('active');
            document.getElementById(`tab${currentActiveContext}`).classList.remove('hidden');
            
            document.getElementById(`setup-view-${currentActiveContext}-step1`).classList.add('hidden');
            
            document.getElementById('resume-modal').classList.add('hidden');
            
            startGame(currentActiveContext);
        });

        document.getElementById('btn-discard-game').addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            document.getElementById('resume-modal').classList.add('hidden');
        });
    }
});