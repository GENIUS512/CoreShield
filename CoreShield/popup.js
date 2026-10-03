const clickSound = new Audio(chrome.runtime.getURL('sfx/click.mp3'));

const levelSelect = document.getElementById('security-level');
const bgCheckbox = document.getElementById('bg-mode');
const shield = document.getElementById('shield');
const statusTitle = document.getElementById('status-title');
const resetBtn = document.getElementById('reset-warnings-btn');

const colors = {
  low: '#00a2ff',
  medium: '#00ff66',
  maximum: '#ff0055'
};

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch(e => {});
}

chrome.storage.local.get(['securityLevel', 'bgMode'], (data) => {
  if (data.securityLevel) {
    levelSelect.value = data.securityLevel;
    updateUI(data.securityLevel);
  }
  if (data.bgMode !== undefined) {
    bgCheckbox.checked = data.bgMode;
  }
});

function updateUI(level) {
  const color = colors[level] || colors.medium;
  document.documentElement.style.setProperty('--accent-color', color);
  
  if (level === 'maximum') {
    statusTitle.innerText = "MAXIMUM PROTECTION";
    shield.innerText = "⚠";
  } else {
    statusTitle.innerText = "SYSTEM SECURE";
    shield.innerText = "✓";
  }
}

levelSelect.addEventListener('change', (e) => {
  playClick();
  const level = e.target.value;
  updateUI(level);
  chrome.storage.local.set({ securityLevel: level });
});

bgCheckbox.addEventListener('change', (e) => {
  playClick();
  chrome.storage.local.set({ bgMode: e.target.checked });
});

resetBtn.addEventListener('click', () => {
  playClick();
  chrome.storage.local.remove('dontShowAlerts', () => {
    const originalText = resetBtn.innerText;
    resetBtn.innerText = "RESET SUCCESSFUL!";
    resetBtn.style.borderColor = "#00ff66";
    resetBtn.style.color = "#00ff66";
    
    setTimeout(() => {
      resetBtn.innerText = originalText;
      resetBtn.style.borderColor = "";
      resetBtn.style.color = "";
    }, 1500);
  });
});
