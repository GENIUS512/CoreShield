let currentLevel = 'medium';
let isBgModeActive = true;

function updateSettings() {
  chrome.storage.local.get(['securityLevel', 'bgMode'], (data) => {
    currentLevel = data.securityLevel || 'medium';
    isBgModeActive = data.bgMode !== undefined ? data.bgMode : true;
  });
}

chrome.storage.onChanged.addListener(() => { updateSettings(); });
updateSettings();

const phishingKeywords = [
  'steampromos', 'steamcommuntiy', 'steam-tradelink', 'csgo-cases-free',
  'free-robux', 'robux-generator', 'get-free-vbucks', 'fortnite-skins-hack',
  'discord-nitro-gift', 'free-nitro-airdrop', 'discord-app-gift',
  'blockchain-wallet-login', 'metamask-security-update', 'crypto-trust-airdrop',
  'binance-bonus-claim', 'elonmusk-crypto-giveaway', 'tesla-btc-drop',
  'login-verified-paypal', 'netflix-account-free', 'spotify-premium-crack',
  'free-valorant-points', 'pubg-uc-generator', 'genshin-crystals-hack',
  'anti-virus-scam-alert', 'your-pc-infected-cleaner', 'microsoft-support-agent'
];

const exactBlacklistedDomains = new Set([
  'danger-virus-site.com', 'hack-your-pc.ru', 'free-robux-scam.net',
  'illegal-torrent-hub.net', 'scam-crypto-giveaway.org', 'login-fake-bank.com',
  'steamcommnunytly.com', 'discorcl-gift.ru', 'free-nitro-claim.xyz',
  'metamask-recover-io.net', 'blockchain-secure-wallet.org', 'paypal-login-verify.com'
]);

function showAlertInTab(tabId, title, message) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (alertTitle, alertMessage) => {
      chrome.storage.local.get(['dontShowAlerts'], (res) => {
        if (res.dontShowAlerts) return;
        if (document.getElementById('maxshield-alert-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'maxshield-alert-overlay';
        overlay.style = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(10, 12, 16, 0.7); backdrop-filter: blur(8px);
          z-index: 9999999999; display: flex; align-items: center; justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif; color: #c9d1d9;
        `;

        const box = document.createElement('div');
        box.style = `
          background: #161b22; border: 2px solid #ff0055; border-radius: 12px;
          padding: 30px; width: 420px; text-align: center; box-shadow: 0 0 30px rgba(255, 0, 85, 0.3);
          transform: scale(0.8); opacity: 0; transition: all 0.3s ease-out;
        `;

        box.innerHTML = `
          <div style="font-size: 50px; margin-bottom: 10px; color: #ff0055;">⚠</div>
          <h2 style="margin: 0 0 15px; color: #fff; letter-spacing: 1px;">${alertTitle}</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #8b949e; margin-bottom: 20px;">${alertMessage}</p>
          <div style="font-weight: bold; color: #ff0055; margin-bottom: 20px; font-size: 13px; text-transform: uppercase;">[ NOT RECOMMENDED TO PROCEED ]</div>
          
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 13px; color: #8b949e;">
            <input type="checkbox" id="maxshield-dont-ask" style="margin-right: 8px; cursor: pointer;">
            <label for="maxshield-dont-ask" style="cursor: pointer;">Don't show warnings again</label>
          </div>

          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="maxshield-close-btn" style="background: #ff0055; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s;">Go Back</button>
            <button id="maxshield-ignore-btn" style="background: transparent; color: #8b949e; border: 1px solid #30363d; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: 0.2s;">Proceed Anyway</button>
          </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        setTimeout(() => {
          box.style.transform = 'scale(1)';
          box.style.opacity = '1';
        }, 50);

        document.getElementById('maxshield-close-btn').onclick = () => {
          savePreference(); overlay.remove(); window.history.back();
        };

        document.getElementById('maxshield-ignore-btn').onclick = () => {
          savePreference(); overlay.remove();
        };

        function savePreference() {
          if (document.getElementById('maxshield-dont-ask').checked) {
            chrome.storage.local.set({ dontShowAlerts: true });
          }
        }
      });
    },
    args: [title, message]
  }).catch(err => {});
}

chrome.downloads.onCreated.addListener((downloadItem) => {
  if (!isBgModeActive) return;

  const filename = downloadItem.filename.toLowerCase();
  const isUnverifiedTarget = filename.endsWith('.torrent') || filename.endsWith('.iso') || filename.endsWith('.rar') || filename.endsWith('.zip');

  if (isUnverifiedTarget) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        showAlertInTab(
          tabs[0].id, 
          "UNVERIFIED DOWNLOAD DETECTED", 
          `MaxShield detected an unverified download request (${downloadItem.filename}). Peer-to-peer files or game archives may contain altered scripts or malware.`
        );
      }
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isBgModeActive || !changeInfo.url) return;

  const url = changeInfo.url.toLowerCase();
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch(e) { return; }

  const isExactMatch = exactBlacklistedDomains.has(hostname);
  const isKeywordMatch = phishingKeywords.some(keyword => url.includes(keyword));
  const isTestTriggered = url.endsWith('#test-shield');

  if (isExactMatch || isKeywordMatch || isTestTriggered) {
    showAlertInTab(
      tabId, 
      "SECURITY WARNING: HIGH RISK SITE", 
      `This website (${hostname}) is flagged for requesting sensitive user data or violating security compliance. Entering data here puts your privacy at risk.`
    );
  }
});
