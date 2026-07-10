const DIDIDO_MONITORS = [
  {
    id: "download",
    label: "Download",
    href: "https://apps.apple.com/us/app/didido/id6757727326"
  },
  {
    id: "features",
    label: "Features",
    href: "features.html"
  },
  {
    id: "updates",
    label: "Recent Update",
    href: "updates.html"
  },
  {
    id: "developers",
    label: "Developer Information",
    href: "developers.html"
  },
  {
    id: "support",
    label: "Support",
    href: "support.html"
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    href: "privacy.html"
  }
];

const STORAGE_KEY = "didido-site-monitor-state-v1";

function defaultMonitorState() {
  const state = {};
  DIDIDO_MONITORS.forEach((monitor) => {
    state[monitor.id] = "pending";
  });
  return state;
}

function readMonitorState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultMonitorState();
    }

    const parsed = JSON.parse(raw);
    const fallback = defaultMonitorState();

    DIDIDO_MONITORS.forEach((monitor) => {
      if (parsed[monitor.id] === "complete") {
        fallback[monitor.id] = "complete";
      }
    });

    return fallback;
  } catch (error) {
    return defaultMonitorState();
  }
}

function writeMonitorState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function markMonitorComplete(id) {
  const state = readMonitorState();
  if (state[id] !== "complete") {
    state[id] = "complete";
    writeMonitorState(state);
  }
  renderShellState();
}

function computeStatusData(state) {
  const total = DIDIDO_MONITORS.length || 1;
  const greenCount = DIDIDO_MONITORS.filter((monitor) => state[monitor.id] === "complete").length;
  const redCount = total - greenCount;
  const greenPercent = (greenCount / total) * 100;
  const yellowPercent = 0;
  const redPercent = (redCount / total) * 100;
  const systemPercent = greenPercent + yellowPercent;

  let label = "Critical";
  let color = "var(--red)";

  if (systemPercent >= 100) {
    label = "Excellent";
    color = "var(--green)";
  } else if (systemPercent >= 75) {
    label = "Good";
    color = "var(--green)";
  } else if (systemPercent >= 50) {
    label = "OK";
    color = "var(--yellow)";
  } else if (systemPercent >= 25) {
    label = "Warning";
    color = "var(--orange)";
  }

  return {
    greenPercent,
    yellowPercent,
    redPercent,
    systemPercent,
    label,
    color
  };
}

function renderShellState() {
  const state = readMonitorState();
  const data = computeStatusData(state);
  const statusValue = document.querySelector("[data-status-value]");
  const statusPercent = document.querySelector("[data-status-percent]");
  const redSegment = document.querySelector("[data-gauge-red]");
  const yellowSegment = document.querySelector("[data-gauge-yellow]");
  const greenSegment = document.querySelector("[data-gauge-green]");

  if (statusValue) {
    statusValue.textContent = data.label;
    statusValue.style.color = data.color;
  }

  if (statusPercent) {
    statusPercent.textContent = `${Math.round(data.systemPercent)}%`;
    statusPercent.style.color = data.color;
  }

  if (redSegment) {
    redSegment.style.width = `${data.redPercent}%`;
    redSegment.hidden = data.redPercent <= 0;
  }

  if (yellowSegment) {
    yellowSegment.style.width = `${data.yellowPercent}%`;
    yellowSegment.hidden = data.yellowPercent <= 0;
  }

  if (greenSegment) {
    greenSegment.style.width = `${data.greenPercent}%`;
    greenSegment.hidden = data.greenPercent <= 0;
  }

  document.querySelectorAll("[data-monitor-id]").forEach((card) => {
    const monitorId = card.getAttribute("data-monitor-id");
    const cardState = state[monitorId] === "complete" ? "complete" : "pending";
    card.setAttribute("data-state", cardState);

    if (monitorId === "download") {
      const icon = card.querySelector("[data-download-icon]");
      if (icon) {
        icon.setAttribute("src", cardState === "complete" ? "app-icon.png" : "app-icon-red.png");
      }
    }

  });
}

function bindMonitorLinks() {
  document.querySelectorAll("[data-completes-monitor]").forEach((node) => {
    node.addEventListener("click", () => {
      const id = node.getAttribute("data-completes-monitor");
      if (id) {
        markMonitorComplete(id);
      }
    });
  });
}

function markCurrentPageMonitor() {
  const path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const pageMap = {
    "features.html": "features",
    "updates.html": "updates",
    "developers.html": "developers",
    "support.html": "support",
    "privacy.html": "privacy"
  };
  const id = pageMap[path];
  if (id) {
    markMonitorComplete(id);
  }
}

function bindMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-menu-panel]");

  if (!toggle || !panel) {
    return;
  }

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    panel.hidden = true;
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    panel.hidden = expanded;
  });

  document.addEventListener("click", (event) => {
    if (!panel.hidden && !toggle.contains(event.target) && !panel.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}


function resetMonitors() {
  window.localStorage.removeItem(STORAGE_KEY);
  renderShellState();
}

function bindReset() {
  const button = document.querySelector("[data-reset-monitors]");
  if (!button) return;
  button.addEventListener("click", () => {
    resetMonitors();
  });
}

function bindYear() {
  const year = document.getElementById("y");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindMonitorLinks();
  bindMenu();
  bindYear();
  bindReset();
  markCurrentPageMonitor();
  renderShellState();
});
