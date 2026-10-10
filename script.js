const form = document.getElementById("scanForm");
const resultPanel = document.getElementById("resultPanel");
const historyBody = document.getElementById("historyBody");

let history = [];

try {
  history = JSON.parse(
    localStorage.getItem("riskGuardHistory") || "[]"
  );

  if (!Array.isArray(history)) history = [];
} catch {
  history = [];
}

function getRisk(assetType, brand, assetName, rawUrl) {
  let score = 0;
  const indicators = [];

  const normalizedBrand = brand.trim().toLowerCase();
  const normalizedName = assetName.trim().toLowerCase();

  // Brand and asset name comparison
  if (normalizedName === normalizedBrand) {
    indicators.push(
      "Asset name matches the brand name; authenticity is not verified."
    );
  } else if (
    normalizedName.includes(normalizedBrand) ||
    normalizedBrand.includes(normalizedName)
  ) {
    score += 10;
    indicators.push(
      "Brand and asset names partially differ."
    );
  } else {
    score += 20;
    indicators.push(
      "Asset name differs from the entered brand name."
    );
  }

  // Validate URL
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    score += 25;
    indicators.push("URL format is invalid.");
  }

  if (parsedUrl) {
    if (parsedUrl.protocol !== "https:") {
      score += 15;
      indicators.push("URL does not use HTTPS.");
    }

    const host = parsedUrl.hostname.toLowerCase();

    if (
      host.includes("xn--") ||
      /[^\x00-\x7F]/.test(host)
    ) {
      score += 25;
      indicators.push(
        "URL contains a potentially deceptive internationalized domain."
      );
    }

    if (host.split(".").some(part => part.length > 30)) {
      score += 10;
      indicators.push(
        "URL contains an unusually long hostname component."
      );
    }

    if (/@/.test(rawUrl.split("/").slice(0, 3).join("/"))) {
      score += 20;
      indicators.push(
        "URL contains user-information syntax that needs review."
      );
    }

    if (
      /(login|verify|claim-prize|free-gift|urgent)/i.test(
        parsedUrl.pathname + parsedUrl.search
      )
    ) {
      score += 15;
      indicators.push(
        "URL contains words commonly associated with deceptive links."
      );
    }
  }

  if (assetType === "app") {
    indicators.push(
      "App identity, developer and store listing have not been independently verified."
    );
  }

  if (assetType === "profile") {
    indicators.push(
      "Profile ownership, account age and verification status have not been checked."
    );
  }

  if (assetType === "brand") {
    indicators.push(
      "Official brand-page ownership has not been independently checked."
    );
  }

  score = Math.min(score, 100);

  let level = "Low";
  if (score >= 60) {
    level = "High";
  } else if (score >= 30) {
    level = "Medium";
  }

  if (indicators.length === 0) {
    indicators.push("No configured warning indicators were found.");
  }

  return { score, level, indicators };
}

function showResult(data) {
  resultPanel.classList.remove("hidden");

  document.getElementById("riskScore").textContent =
    `${data.score}/100`;

  const badge = document.getElementById("riskBadge");
  badge.textContent = `${data.level} Demo Risk`;
  badge.className = `badge ${data.level.toLowerCase()}`;

  const bar = document.getElementById("riskBar");
  bar.style.width = `${data.score}%`;
  bar.className = `progress-bar ${data.level.toLowerCase()}`;

  const list = document.getElementById("indicatorList");
  list.replaceChildren();

  data.indicators.forEach(indicator => {
    const li = document.createElement("li");
    li.textContent = indicator;
    list.appendChild(li);
  });

  document.getElementById("resultNote").textContent =
    "Demo estimate only—not proof of fraud or authenticity. " +
    "Review evidence and verify the asset using trusted official sources.";
}

function renderHistory() {
  historyBody.replaceChildren();

  if (history.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 3;
    cell.textContent = "No scans yet. Try a demo scan.";
    row.appendChild(cell);
    historyBody.appendChild(row);
  } else {
    history.forEach(item => {
      const row = document.createElement("tr");

      [item.asset, item.brand, `${item.level} (${item.score}/100)`]
        .forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });

      historyBody.appendChild(row);
    });
  }

  document.getElementById("totalScans").textContent =
    history.length;

  document.getElementById("highRisks").textContent =
    history.filter(item => item.level === "High").length;

  document.getElementById("brandCount").textContent =
    new Set(history.map(item => item.brand.toLowerCase())).size;
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const type = document.getElementById("assetType").value;
  const brand = document.getElementById("brandName").value.trim();
  const assetName = document.getElementById("assetName").value.trim();
  const url = document.getElementById("assetUrl").value.trim();

  if (!brand || !assetName || !url) {
    alert("Please fill in all fields.");
    return;
  }

  const result = getRisk(type, brand, assetName, url);

  showResult(result);

  const item = {
    asset: assetName,
    brand: brand,
    score: result.score,
    level: result.level
  };

  history.unshift(item);
  history = history.slice(0, 20);

  try {
    localStorage.setItem(
      "riskGuardHistory",
      JSON.stringify(history)
    );
  } catch {
    // History still works for this page session.
  }

  renderHistory();
});

document.getElementById("clearHistory").addEventListener(
  "click",
  function () {
    history = [];

    try {
      localStorage.removeItem("riskGuardHistory");
    } catch {
      // Ignore storage restrictions.
    }

    renderHistory();
  }
);

renderHistory();