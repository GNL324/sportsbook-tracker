const statusEl = document.getElementById('status');
const outputEl = document.getElementById('output');
const scanButton = document.getElementById('scanButton');
const copyButton = document.getElementById('copyButton');

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab found');
  }
  return tab;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function renderPayload(payload) {
  outputEl.textContent = JSON.stringify(payload, null, 2);
}

async function sendMessage(type) {
  const tab = await getActiveTab();
  const response = await chrome.tabs.sendMessage(tab.id, { type });
  if (!response?.ok) {
    throw new Error(response?.error || 'Unknown extension error');
  }
  renderPayload(response.payload);
  return response.payload;
}

scanButton.addEventListener('click', async () => {
  try {
    setStatus('Scanning OddsBlaze page...');
    const payload = await sendMessage('SBB_ODDSBLAZE_EXTRACT');
    setStatus(`Found ${payload.totalOpportunities} supported opportunities`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Scan failed');
  }
});

copyButton.addEventListener('click', async () => {
  try {
    setStatus('Copying JSON to clipboard...');
    const payload = await sendMessage('SBB_ODDSBLAZE_COPY');
    setStatus(`Copied ${payload.totalOpportunities} supported opportunities`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Copy failed');
  }
});
