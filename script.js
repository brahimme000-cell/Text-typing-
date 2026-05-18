let currentMode, timer, timeLeft, score = 0;
let languages = ['ar', 'en', 'fr'], currentLangIndex = 0;
let diffMultiplier = 1.8, startTime, isMuted = false, lastWord = "";

// نظام الصوت
let audioCtx;
function playClick() {
    if (isMuted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}

// التنقل السريع
function showScreen(id) {
    playClick();
    document.querySelectorAll('.container').forEach(c => {
        c.classList.remove('active');
        setTimeout(() => c.classList.add('hidden'), 200);
    });
    setTimeout(() => {
        const target = document.getElementById(id);
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 20);
    }, 220);
}

function translatePage() {
    const lang = languages[currentLangIndex], ui = gameData[lang].ui;
    document.body.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    Object.keys(ui).forEach(key => {
        const el = document.getElementById('ui-' + key.replace(/([A-Z])/g, "-$1").toLowerCase()) || document.getElementById('ui-' + key);
        if (el) el.innerText = ui[key];
    });
    document.getElementById('lang-btn').innerText = ui.changeLang;
    const best = localStorage.getItem(`best_${lang}`) || 0;
    document.getElementById('high-score-val').innerText = best;
    updateMuteBtnUI();
}

function cycleLang() { currentLangIndex = (currentLangIndex + 1) % languages.length; translatePage(); playClick(); }
function setDiff(val, btn) { playClick(); diffMultiplier = val; document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }

function startMode(mode) { 
    currentMode = mode; score = 0; 
    document.getElementById('score-display').innerText = score;
    showScreen('game-screen'); 
    nextLevel(); 
}

function nextLevel() {
    // حل مشكلة الظهور المتداخل
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('play-area').classList.remove('hidden');
    const input = document.getElementById('user-input');
    input.value = ''; input.focus();

    const lang = languages[currentLangIndex], pool = gameData[lang][currentMode];
    let item;
    do { item = pool[Math.floor(Math.random() * pool.length)]; } while (item === lastWord && pool.length > 1);
    lastWord = item;

    document.getElementById('target-text').innerText = item;
    timeLeft = Math.round(((currentMode === 'words') ? 10 : 25) * diffMultiplier);
    document.getElementById('timer-display').innerText = timeLeft;
    startTime = Date.now();
    startCounter();
}

function startCounter() {
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(timer); checkHighScore(); quitGame(); }
    }, 1000);
}

document.getElementById('user-input').addEventListener('input', (e) => {
    playClick();
    const target = document.getElementById('target-text').innerText.trim();
    if (e.target.value.trim() === target) {
        clearInterval(timer);
        document.getElementById('play-area').classList.add('hidden');
        document.getElementById('result-area').classList.remove('hidden');
        document.getElementById('time-taken').innerText = ((Date.now() - startTime) / 1000).toFixed(2);
        score++;
        document.getElementById('score-display').innerText = score;
    }
});

function toggleMute() { isMuted = !isMuted; playClick(); updateMuteBtnUI(); }
function updateMuteBtnUI() { const ui = gameData[languages[currentLangIndex]].ui; document.getElementById('mute-btn').innerText = isMuted ? ui.muteOff : ui.muteOn; }
function checkHighScore() { const lang = languages[currentLangIndex], saved = localStorage.getItem(`best_${lang}`) || 0; if (score > saved) localStorage.setItem(`best_${lang}`, score); }

function quitGame() { clearInterval(timer); checkHighScore(); showScreen('home-screen'); }

// منظومة التسجيل والتحديث التلقائي
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((reg) => {
            console.log('Service Worker Registered!');

            // 1. فحص التحديثات فوراً بمجرد عودة الإنترنت (Online)
            window.addEventListener('online', () => {
                reg.update();
            });

            // 2. إذا عثر المتصفح على ملف sw.js جديد (تحديث)
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New update available and installed.');
                    }
                });
            });
        });
    });

    // 3. إعادة تنشيط الصفحة تلقائياً لتطبيق التعديلات فوراً للاعب
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload(); // إعادة تشغيل اللعبة بالتحديث الجديد سحرياً
        }
    });
}


window.onload = () => { translatePage(); document.getElementById('home-screen').classList.add('active'); };
