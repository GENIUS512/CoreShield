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

const phishingKeywords = ['steampromos', 'steamcommuntiy', 'steam-tradelink', 'free-robux', 'robux-generator', 'discord-nitro-gift', 'free-nitro', 'crypto-miner', 'elonmusk-crypto', 'login-verified', 'scam-alert'];
const highRiskKeywords = ['crack', 'keygen', 'patcher', 'hack', 'cheat', 'miner', 'bypass', 'injector'];
const spyScripts = ['coinhive', 'cryptoloot', 'minr', 'telemetry', 'metrics'];
const blacklistedDomains = new Set(['danger-virus-site.com', 'hack-your-pc.ru', 'free-robux-scam.net', 'illegal-torrent-hub.net', 'scam-crypto-giveaway.org', 'login-fake-bank.com']);

function showAlertInTab(tabId, title, message, isCritical = false, downloadId = null) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (alertTitle, alertMessage, criticalState, dId) => {
      chrome.storage.local.get(['dontShowAlerts'], (res) => {
        if (res.dontShowAlerts && !criticalState) return;
        if (document.getElementById('maxshield-alert-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'maxshield-alert-overlay';
        overlay.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(10,12,16,0.85);backdrop-filter:blur(12px);z-index:9999999999;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif;color:#c9d1d9;";

        const box = document.createElement('div');
        const borderColor = criticalState ? '#ff0000' : '#ff0055';
        box.style = `background:#161b22;border:2px solid ${borderColor};border-radius:12px;padding:30px;width:440px;text-align:center;box-shadow:0 0 35px ${borderColor}4d;transform:scale(0.8);opacity:0;transition:all 0.3s ease-out;`;

        const headerTag = criticalState ? '<div style="font-weight:bold;color:#ff0000;margin-bottom:20px;font-size:14px;text-transform:uppercase;letter-spacing:2px;">[ THREAT CONTAINED: ACTION REQUIRED ]</div>' : '<div style="font-weight:bold;color:#ff0055;margin-bottom:20px;font-size:13px;text-transform:uppercase;">[ NOT RECOMMENDED TO PROCEED ]</div>';
        const checkboxHTML = criticalState ? '' : '<div style="display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:13px;color:#8b949e;"><input type="checkbox" id="maxshield-dont-ask" style="margin-right:8px;cursor:pointer;"><label for="maxshield-dont-ask" style="cursor:pointer;">Don\'t show warnings again</label></div>';
        const buttonsHTML = criticalState ? '<div style="display:flex;gap:10px;justify-content:center;"><button id="maxshield-purge-btn" style="background:#ff0000;color:#fff;border:none;padding:12px 24px;border-radius:6px;font-weight:bold;cursor:pointer;text-transform:uppercase;">Purge File</button><button id="maxshield-ignore-dl-btn" style="background:transparent;color:#ff0000;border:1px solid #ff0000;padding:12px 24px;border-radius:6px;font-weight:bold;cursor:pointer;text-transform:uppercase;">Ignore & Keep</button></div>' : '<div style="display:flex;gap:10px;justify-content:center;"><button id="maxshield-close-btn" style="background:#ff0055;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">Go Back</button><button id="maxshield-ignore-btn" style="background:transparent;color:#8b949e;border:1px solid #30363d;padding:10px 20px;border-radius:6px;cursor:pointer;">Proceed Anyway</button></div>';

        box.innerHTML = `<div style="font-size:60px;margin-bottom:10px;color:${borderColor};">⚠️</div><h2 style="margin:0 0 15px;color:#fff;letter-spacing:1px;">${alertTitle}</h2><p style="font-size:14px;line-height:1.6;color:#8b949e;margin-bottom:20px;">${alertMessage}</p>${headerTag}${checkboxHTML}${buttonsHTML}`;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        setTimeout(() => { box.style.transform = 'scale(1)'; box.style.opacity = '1'; }, 50);

        if (criticalState) {
          document.getElementById('maxshield-purge-btn').onclick = () => { chrome.runtime.sendMessage({ action: "cancelDownload", id: dId }); overlay.remove(); };
          document.getElementById('maxshield-ignore-dl-btn').onclick = () => { chrome.runtime.sendMessage({ action: "resumeDownload", id: dId }); overlay.remove(); };
        } else {
          document.getElementById('maxshield-close-btn').onclick = () => { if(document.getElementById('maxshield-dont-ask').checked) chrome.storage.local.set({ dontShowAlerts: true }); overlay.remove(); window.history.back(); };
          document.getElementById('maxshield-ignore-btn').onclick = () => { if(document.getElementById('maxshield-dont-ask').checked) chrome.storage.local.set({ dontShowAlerts: true }); overlay.remove(); };
        }
      });
    },
    args: [title, message, isCritical, downloadId]
  }).catch(() => {});
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "cancelDownload" && request.id) {
    chrome.downloads.cancel(request.id, () => { chrome.downloads.erase({ id: request.id }); });
  } else if (request.action === "resumeDownload" && request.id) {
    chrome.downloads.resume(request.id);
  }
});

chrome.downloads.onCreated.addListener((downloadItem) => {
  if (!isBgModeActive) return;
  const filename = downloadItem.filename.toLowerCase();
  const url = downloadItem.url.toLowerCase();
  const isUnverified = filename.endsWith('.torrent') || filename.endsWith('.iso') || filename.endsWith('.rar') || filename.endsWith('.zip');
  const isExec = filename.endsWith('.exe') || filename.endsWith('.bat') || filename.endsWith('.cmd') || filename.endsWith('.scr');
  const isRisk = highRiskKeywords.some(k => filename.includes(k) || url.includes(k));

  if (currentLevel === 'maximum' && (isExec || isUnverified || isRisk)) {
    chrome.downloads.pause(downloadItem.id, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) showAlertInTab(tabs[0].id, "SUSPICIOUS DOWNLOAD SUSPENDED", `CoreShield isolated "${downloadItem.filename}". High-risk parameters detected. Purge or keep file?`, true, downloadItem.id);
      });
    });
    return;
  }
  if (isUnverified || isRisk) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) showAlertInTab(tabs[0].id, "UNVERIFIED DOWNLOAD DETECTED", `CoreShield detected an unverified download request (${downloadItem.filename}).`);
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!isBgModeActive || !changeInfo.url) return;
  const url = changeInfo.url.toLowerCase();
  let host = "";
  try { host = new URL(url).hostname; } catch(e) { return; }

  const isExact = blacklistedDomains.has(host);
  const isKey = phishingKeywords.some(k => url.includes(k));
  const isNotSecure = currentLevel === 'maximum' && url.startsWith('http://');
  const isSpy = currentLevel === 'maximum' && spyScripts.some(k => url.includes(k));

  if (isExact || isKey || isNotSecure || isSpy) {
    let t = "SECURITY WARNING: HIGH RISK SITE", m = `This website (${host}) is flagged for requesting sensitive user data.`;
    if (isNotSecure) { t = "UNENCRYPTED CONNECTION BLOCKED"; m = `CoreShield Maximum Mode blocked access to ${host} due to unsafe HTTP connection.`; }
    else if (isSpy) { t = "SPYWARE SCRIPT INTERCEPTED"; m = `CoreShield intercepted a tracking script execution request on this page.`; }
    showAlertInTab(tabId, t, m);
  }
});
