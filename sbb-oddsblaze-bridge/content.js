(function () {
  const SUPPORTED_BOOKS = {
    R: { sportsbook: 'betrivers', label: 'BetRivers' },
    D: { sportsbook: 'draftkings', label: 'DraftKings' },
    S: { sportsbook: 'thescore', label: 'theScore' },
    M: { sportsbook: 'betmgm', label: 'BetMGM' },
  };

  const STORAGE_KEY = 'sbbOddsBlazeBridge.lastPayload';
  const PANEL_ID = 'sbb-oddsblaze-bridge-panel';

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function unique(items) {
    return [...new Set(items)];
  }

  function scanBookCodes(text) {
    const codes = unique(
      [...text.matchAll(/\b([RDSM])\b/g)]
        .map((match) => match[1])
        .filter((code) => SUPPORTED_BOOKS[code])
    );

    if (codes.length >= 2) {
      return codes.slice(0, 2);
    }

    const byName = [];
    for (const [code, book] of Object.entries(SUPPORTED_BOOKS)) {
      if (text.toLowerCase().includes(book.label.toLowerCase())) {
        byName.push(code);
      }
    }
    return unique(byName).slice(0, 2);
  }

  function extractOdds(text) {
    return [...text.matchAll(/([+-]\d{2,4})/g)].map((match) => match[1]);
  }

  function extractSidesAndLines(text) {
    return [...text.matchAll(/\b(Over|Under)\s+(\d+(?:\.\d+)?)/gi)].map((match) => ({
      side: match[1][0].toUpperCase() + match[1].slice(1).toLowerCase(),
      line: match[2],
    }));
  }

  function findBetLinks(row) {
    const anchors = [...row.querySelectorAll('a[href]')];
    const prioritized = anchors.filter((anchor) => {
      const href = anchor.href || '';
      const text = normalizeText(anchor.textContent);
      return /bet|sportsbook|selection|slip/i.test(href) || /\bbet\b/i.test(text);
    });
    const links = (prioritized.length > 0 ? prioritized : anchors)
      .map((anchor) => anchor.href)
      .filter(Boolean);
    return unique(links);
  }

  function inferEventAndMarket(cells, text) {
    const cellTexts = cells.map((cell) => normalizeText(cell.textContent)).filter(Boolean);
    const event =
      cellTexts.find((cell) => cell.length > 3 && !/%$/.test(cell) && !/^[RDSM]$/.test(cell)) ||
      text.replace(/^\d+(?:\.\d+)?%\s*/, '').slice(0, 120);

    const market =
      cellTexts.find((cell) => /points|rebounds|assists|threes|props|player|pra|moneyline|spread|total/i.test(cell)) ||
      'Player Props';

    return { event, market };
  }

  function parseRow(row, index) {
    const cells = [...row.querySelectorAll('td, [role="cell"]')];
    const text = normalizeText(row.textContent);
    if (!text || !text.includes('%')) {
      return null;
    }

    const edgeMatch = text.match(/(\d+(?:\.\d+)?)%/);
    const bookCodes = scanBookCodes(text);
    const odds = extractOdds(text);
    const sidesAndLines = extractSidesAndLines(text);
    if (!edgeMatch || bookCodes.length < 2 || odds.length < 2 || sidesAndLines.length < 2) {
      return null;
    }

    const { event, market } = inferEventAndMarket(cells, text);
    const betLinks = findBetLinks(row);

    return {
      id: `oddsblaze-${index}`,
      edge: Number.parseFloat(edgeMatch[1]),
      market,
      event,
      sourceText: text,
      legA: {
        sportsbook: SUPPORTED_BOOKS[bookCodes[0]].sportsbook,
        bookCode: bookCodes[0],
        side: sidesAndLines[0].side,
        line: sidesAndLines[0].line,
        odds: odds[0],
        betUrl: betLinks[0] || '',
      },
      legB: {
        sportsbook: SUPPORTED_BOOKS[bookCodes[1]].sportsbook,
        bookCode: bookCodes[1],
        side: sidesAndLines[1].side,
        line: sidesAndLines[1].line,
        odds: odds[1],
        betUrl: betLinks[1] || betLinks[0] || '',
      },
    };
  }

  function collectCandidateRows() {
    const selectors = [
      'table tbody tr',
      '[role="rowgroup"] [role="row"]',
      '[data-row-key]',
      '[class*="table"] [class*="row"]',
      '[class*="grid"] [class*="row"]',
    ];

    const rows = [];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (!rows.includes(element)) {
          rows.push(element);
        }
      }
    }
    return rows;
  }

  function extractPayload() {
    const rows = collectCandidateRows();
    const opportunities = rows
      .map((row, index) => parseRow(row, index))
      .filter(Boolean)
      .filter((opportunity) => opportunity.legA.bookCode && opportunity.legB.bookCode);

    const payload = {
      fetchedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      totalRowsScanned: rows.length,
      totalOpportunities: opportunities.length,
      opportunities,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('SBB bridge failed to persist payload', error);
    }

    return payload;
  }

  async function copyPayloadToClipboard(payload) {
    const json = JSON.stringify(payload, null, 2);
    await navigator.clipboard.writeText(json);
    return json;
  }

  function updatePanelStatus(message, tone) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const status = panel.querySelector('[data-sbb-status]');
    if (!status) return;
    status.textContent = message;
    status.setAttribute('data-tone', tone || 'neutral');
  }

  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="sbb-bridge__header">SBB OddsBlaze Bridge</div>
      <div class="sbb-bridge__actions">
        <button type="button" data-action="scan">Scan OddsBlaze</button>
        <button type="button" data-action="copy">Copy JSON</button>
      </div>
      <div class="sbb-bridge__status" data-sbb-status data-tone="neutral">Ready</div>
    `;

    panel.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute('data-action');
      if (!action) return;

      if (action === 'scan') {
        const payload = extractPayload();
        updatePanelStatus(`Found ${payload.totalOpportunities} supported opportunities`, payload.totalOpportunities ? 'success' : 'warn');
      }

      if (action === 'copy') {
        try {
          const payload = extractPayload();
          await copyPayloadToClipboard(payload);
          updatePanelStatus(`Copied ${payload.totalOpportunities} opportunities`, 'success');
        } catch (error) {
          console.error(error);
          updatePanelStatus('Copy failed', 'error');
        }
      }
    });

    document.documentElement.appendChild(panel);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'SBB_ODDSBLAZE_EXTRACT') {
      try {
        const payload = extractPayload();
        sendResponse({ ok: true, payload });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown extraction error' });
      }
      return true;
    }

    if (message?.type === 'SBB_ODDSBLAZE_COPY') {
      (async () => {
        try {
          const payload = extractPayload();
          await copyPayloadToClipboard(payload);
          sendResponse({ ok: true, payload });
        } catch (error) {
          sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown copy error' });
        }
      })();
      return true;
    }

    return false;
  });

  if (/oddsblaze\.com/.test(window.location.hostname)) {
    ensurePanel();
  }
})();
