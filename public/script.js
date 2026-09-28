/**
 * 9InchPairs – Frontend Application Logic
 * PWA support, local identity, system parsing & filtering
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const prevWeekBtn = document.getElementById("prev-week");
  const nextWeekBtn = document.getElementById("next-week");
  const weekDisplay = document.getElementById("week-display");
  const weekStatusBadge = document.getElementById("week-status-badge");
  const requestsList = document.getElementById("requests-list");
  const confirmedList = document.getElementById("confirmed-list");
  const requestsCount = document.getElementById("requests-count");
  const confirmedCount = document.getElementById("confirmed-count");

  // Profile Identity
  const profileNameDisplay = document.getElementById("profile-name-display");
  const userProfileChip = document.getElementById("user-profile-chip");

  // Filter Selects / Inputs
  const filterSystemRequestsInput = document.getElementById("filter-system-requests");
  const filterSystemConfirmedInput = document.getElementById("filter-system-confirmed");
  const filterRequestsPills = document.getElementById("filter-requests-pills");
  const filterConfirmedPills = document.getElementById("filter-confirmed-pills");

  // Inline Add Request Form
  const addRequestBtn = document.getElementById("add-request-btn");
  const addRequestForm = document.getElementById("add-request-form");
  const newRequestNameInput = document.getElementById("new-request-name");
  const newRequestSystemSelect = document.getElementById("new-request-system");
  const submitRequestBtn = document.getElementById("submit-request-btn");
  const cancelRequestBtn = document.getElementById("cancel-request-btn");
  const closeFormBtn = document.getElementById("close-form-btn");
  const addRequestError = document.getElementById("add-request-error");

  // Accept Modal
  const acceptModal = document.getElementById("accept-modal");
  const modalQuestion = document.getElementById("modal-question");
  const acceptingPlayerNameInput = document.getElementById("accepting-player-name");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const modalCancelBtn = acceptModal ? acceptModal.querySelector(".cancel-btn") : null;
  const modalCloseBtn = acceptModal ? acceptModal.querySelector(".close-btn") : null;
  const modalBackdrop = acceptModal ? acceptModal.querySelector(".modal-backdrop") : null;

  // Offline Banner
  const offlineBanner = document.getElementById("offline-banner");

  // API Base URL
  const API_BASE_URL = window.location.origin;
  const STORAGE_KEY_NAME = "9ip_player_name";

  // Global State
  let currentTuesdayDate = getNextTuesday(new Date());
  let currentRequestId = null;
  let currentRequestPlayerName = null;
  let currentRequestsData = [];
  let currentConfirmedData = [];

  // ==========================================================================
  // Local Identity (Remember Name)
  // ==========================================================================

  function getStoredPlayerName() {
    return localStorage.getItem(STORAGE_KEY_NAME) || "";
  }

  function setStoredPlayerName(name) {
    const trimmed = (name || "").trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_NAME, trimmed);
    }
    updateProfileDisplay();
  }

  function updateProfileDisplay() {
    const stored = getStoredPlayerName();
    if (stored) {
      profileNameDisplay.textContent = stored;
      userProfileChip.title = `Eingeloggt als "${stored}". Klicken zum Ändern.`;
    } else {
      profileNameDisplay.textContent = "Nicht gesetzt";
      userProfileChip.title = "Klicken, um deinen Namen dauerhaft zu speichern";
    }
  }

  function promptEditPlayerName() {
    const current = getStoredPlayerName();
    const entered = window.prompt("Gib deinen Standard-Spielernamen ein:", current);
    if (entered !== null) {
      const trimmed = entered.trim();
      if (trimmed) {
        setStoredPlayerName(trimmed);
        if (newRequestNameInput) newRequestNameInput.value = trimmed;
        if (acceptingPlayerNameInput) acceptingPlayerNameInput.value = trimmed;
      }
    }
  }

  if (userProfileChip) {
    userProfileChip.addEventListener("click", promptEditPlayerName);
  }

  // ==========================================================================
  // Date Calculations
  // ==========================================================================

  function getNextTuesday(fromDate) {
    const date = new Date(fromDate);
    date.setHours(12, 0, 0, 0);
    const day = date.getDay(); // 0 = So, 1 = Mo, 2 = Di...
    const diff = (2 - day + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date;
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  function formatDateForDisplay(date) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return date.toLocaleDateString("de-DE", options);
  }

  function updateWeekDisplay() {
    if (weekDisplay) {
      weekDisplay.textContent = formatDateForDisplay(currentTuesdayDate);
    }

    // Relative Woche berechnen
    const today = new Date();
    const thisWeekTuesday = getNextTuesday(today);
    const diffDays = Math.round((currentTuesdayDate - thisWeekTuesday) / (1000 * 60 * 60 * 24));

    if (weekStatusBadge) {
      if (diffDays === 0) {
        weekStatusBadge.textContent = "Diese Woche";
        weekStatusBadge.style.color = "var(--accent)";
      } else if (diffDays === 7) {
        weekStatusBadge.textContent = "Nächste Woche";
        weekStatusBadge.style.color = "var(--ink)";
      } else if (diffDays === -7) {
        weekStatusBadge.textContent = "Vorherige Woche";
        weekStatusBadge.style.color = "var(--ink-muted)";
      } else if (diffDays < 0) {
        weekStatusBadge.textContent = "Vergangen";
        weekStatusBadge.style.color = "var(--ink-dim)";
      } else {
        weekStatusBadge.textContent = `In ${Math.round(diffDays / 7)} Wochen`;
        weekStatusBadge.style.color = "var(--ink)";
      }
    }
  }

  // ==========================================================================
  // Name & System Tag Parsing
  // ==========================================================================

  function parsePlayerName(rawName) {
    if (!rawName) return { name: "", system: null };
    const str = String(rawName).trim();
    if (str.toLowerCase().includes("[aos]")) {
      return {
        name: str.replace(/\[aos\]/gi, "").trim(),
        system: "AoS",
      };
    }
    if (str.toLowerCase().includes("[40k]")) {
      return {
        name: str.replace(/\[40k\]/gi, "").trim(),
        system: "40k",
      };
    }
    return {
      name: str,
      system: null,
    };
  }

  function createSystemBadge(system) {
    const badge = document.createElement("span");
    badge.classList.add("system-badge");
    if (system === "AoS") {
      badge.classList.add("badge-aos");
      badge.textContent = "AoS";
    } else if (system === "40k") {
      badge.classList.add("badge-40k");
      badge.textContent = "40k";
    } else {
      badge.classList.add("badge-any");
      badge.textContent = "Egal";
    }
    return badge;
  }

  // ==========================================================================
  // List Rendering
  // ==========================================================================

  function renderList(listElement, items, type) {
    listElement.innerHTML = "";

    let currentFilterValue = "all";
    if (type === "requests" && filterSystemRequestsInput) {
      currentFilterValue = filterSystemRequestsInput.value;
    } else if (type === "confirmed" && filterSystemConfirmedInput) {
      currentFilterValue = filterSystemConfirmedInput.value;
    }

    const filteredItems = items.filter((item) => {
      if (currentFilterValue === "all") return true;
      const nameToCheck = type === "requests" ? item.player_name : item.player1_name;
      if (!nameToCheck) return false;

      const lower = nameToCheck.toLowerCase();
      if (currentFilterValue === "AoS") return lower.includes("[aos]");
      if (currentFilterValue === "40k") return lower.includes("[40k]");
      if (currentFilterValue === "none") {
        return !lower.includes("[aos]") && !lower.includes("[40k]");
      }
      return true;
    });

    // Update Counter Badges
    if (type === "requests" && requestsCount) {
      requestsCount.textContent = filteredItems.length;
    } else if (type === "confirmed" && confirmedCount) {
      confirmedCount.textContent = filteredItems.length;
    }

    if (filteredItems.length === 0) {
      const li = document.createElement("li");
      li.classList.add("loading-placeholder");
      if (items.length > 0) {
        li.textContent = `Keine Einträge für den Filter "${currentFilterValue.toUpperCase()}".`;
      } else {
        li.textContent =
          type === "requests"
            ? "Keine offenen Spielgesuche für diese Woche vorhanden."
            : "Noch keine bestätigten Paarungen für diese Woche.";
      }
      listElement.appendChild(li);
      return;
    }

    filteredItems.forEach((item) => {
      const li = document.createElement("li");
      li.classList.add("match-item");

      if (type === "requests") {
        const parsed = parsePlayerName(item.player_name);

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("item-content");

        const nameSpan = document.createElement("span");
        nameSpan.classList.add("player-name");
        nameSpan.textContent = parsed.name;

        contentDiv.appendChild(nameSpan);
        contentDiv.appendChild(createSystemBadge(parsed.system));

        const statusSpan = document.createElement("span");
        statusSpan.classList.add("item-status");
        statusSpan.textContent = "sucht ein Spiel";
        contentDiv.appendChild(statusSpan);

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("item-actions");

        const acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.innerHTML = "<span>⚔ Annehmen</span>";
        acceptBtn.classList.add("accept-btn");
        acceptBtn.onclick = () => openAcceptModal(item.id, item.player_name);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Löschen";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deleteRequest(item.id);

        actionsDiv.appendChild(acceptBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(contentDiv);
        li.appendChild(actionsDiv);
      } else {
        // Confirmed Game
        const parsedP1 = parsePlayerName(item.player1_name);
        const parsedP2 = parsePlayerName(item.player2_name);

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("pairing-content");

        const p1Side = document.createElement("span");
        p1Side.classList.add("player-side");
        const p1Name = document.createElement("span");
        p1Name.classList.add("player-name");
        p1Name.textContent = parsedP1.name;
        p1Side.appendChild(p1Name);
        if (parsedP1.system) {
          p1Side.appendChild(createSystemBadge(parsedP1.system));
        }

        const vsBadge = document.createElement("span");
        vsBadge.classList.add("vs-badge");
        vsBadge.textContent = "VS";

        const p2Side = document.createElement("span");
        p2Side.classList.add("player-side");
        const p2Name = document.createElement("span");
        p2Name.classList.add("player-name");
        p2Name.textContent = parsedP2.name;
        p2Side.appendChild(p2Name);
        if (parsedP2.system) {
          p2Side.appendChild(createSystemBadge(parsedP2.system));
        }

        contentDiv.appendChild(p1Side);
        contentDiv.appendChild(vsBadge);
        contentDiv.appendChild(p2Side);

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("item-actions");

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Löschen";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deleteConfirmedGame(item.id);

        actionsDiv.appendChild(deleteBtn);

        li.appendChild(contentDiv);
        li.appendChild(actionsDiv);
      }

      listElement.appendChild(li);
    });
  }

  function setLoadingState(loading = true) {
    if (loading) {
      if (
        requestsList.children.length === 0 ||
        requestsList.querySelector(".loading-placeholder")
      ) {
        requestsList.innerHTML = '<li class="loading-placeholder">Lade Spielgesuche...</li>';
      }
      if (
        confirmedList.children.length === 0 ||
        confirmedList.querySelector(".loading-placeholder")
      ) {
        confirmedList.innerHTML = '<li class="loading-placeholder">Lade bestätigte Spiele...</li>';
      }
    }
  }

  function showLoadingError(listElement, type) {
    listElement.innerHTML = `
      <li class="loading-placeholder error">
        Fehler beim Laden der ${type === "requests" ? "Gesuche" : "Spiele"}.
      </li>
    `;
  }

  // ==========================================================================
  // Filter Pill Controls
  // ==========================================================================

  function setupFilterPills(container, hiddenInput, type) {
    if (!container || !hiddenInput) return;
    const pills = container.querySelectorAll(".filter-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const filterVal = pill.getAttribute("data-filter") || "all";
        hiddenInput.value = filterVal;
        if (type === "requests") {
          renderList(requestsList, currentRequestsData, "requests");
        } else {
          renderList(confirmedList, currentConfirmedData, "confirmed");
        }
      });
    });
  }

  setupFilterPills(filterRequestsPills, filterSystemRequestsInput, "requests");
  setupFilterPills(filterConfirmedPills, filterSystemConfirmedInput, "confirmed");

  // ==========================================================================
  // Modal ("Annehmen")
  // ==========================================================================

  function openAcceptModal(requestId, requestPlayerName) {
    currentRequestId = requestId;
    currentRequestPlayerName = requestPlayerName;
    const parsed = parsePlayerName(requestPlayerName);
    const systemSuffix = parsed.system ? ` (${parsed.system})` : "";
    modalQuestion.innerHTML = `Möchtest du das Spielgesuch von <strong>${parsed.name}${systemSuffix}</strong> annehmen?`;

    // Name vorbefüllen
    const savedName = getStoredPlayerName();
    acceptingPlayerNameInput.value = savedName;

    acceptModal.hidden = false;
    acceptModal.classList.add("show");
    acceptingPlayerNameInput.focus();
  }

  function closeModal() {
    if (acceptModal) {
      acceptModal.hidden = true;
      acceptModal.classList.remove("show");
    }
    currentRequestId = null;
    currentRequestPlayerName = null;
  }

  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !acceptModal.hidden) {
      closeModal();
    }
  });

  // ==========================================================================
  // API Calls
  // ==========================================================================

  async function fetchGames() {
    setLoadingState(true);
    const dateStr = formatDate(currentTuesdayDate);
    try {
      const response = await fetch(`${API_BASE_URL}/api/games?date=${dateStr}`);
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      currentRequestsData = data.requests || [];
      currentConfirmedData = data.confirmed || [];

      renderList(requestsList, currentRequestsData, "requests");
      renderList(confirmedList, currentConfirmedData, "confirmed");
    } catch (error) {
      console.error("Fehler beim Abrufen der Spiele:", error);
      showLoadingError(requestsList, "requests");
      showLoadingError(confirmedList, "confirmed");
    }
  }

  async function submitNewRequest() {
    let playerName = newRequestNameInput.value.trim();
    const system = newRequestSystemSelect.value;

    if (!playerName) {
      showAddRequestError("Bitte gib deinen Spielernamen ein.");
      newRequestNameInput.focus();
      return;
    }
    hideAddRequestError();

    // Name dauerhaft im Browser merken
    setStoredPlayerName(playerName);

    // D1-kompatiblen System-Tag anhängen
    if (system === "AoS") {
      playerName += " [AoS]";
    } else if (system === "40k") {
      playerName += " [40k]";
    }

    const dateStr = formatDate(currentTuesdayDate);
    submitRequestBtn.disabled = true;
    submitRequestBtn.textContent = "Veröffentliche...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName, date: dateStr }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      await response.json();
      hideAddRequestForm();
      fetchGames();
    } catch (error) {
      console.error("Fehler beim Erstellen des Gesuchs:", error);
      showAddRequestError(`Fehler: ${error.message}`);
    } finally {
      submitRequestBtn.disabled = false;
      submitRequestBtn.textContent = "Gesuch veröffentlichen";
    }
  }

  async function deleteRequest(id) {
    if (!window.confirm("Möchtest du dieses Spielgesuch wirklich entfernen?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      await response.json();
      fetchGames();
    } catch (error) {
      console.error("Fehler beim Löschen des Gesuchs:", error);
      alert(`Fehler beim Löschen: ${error.message}`);
    }
  }

  async function confirmAcceptRequest() {
    const acceptingPlayerName = acceptingPlayerNameInput.value.trim();
    if (!acceptingPlayerName) {
      alert("Bitte gib deinen Spielernamen ein.");
      acceptingPlayerNameInput.focus();
      return;
    }
    if (!currentRequestId) {
      closeModal();
      return;
    }

    if (currentRequestPlayerName) {
      const parsedReq = parsePlayerName(currentRequestPlayerName);
      if (parsedReq.name.toLowerCase() === acceptingPlayerName.toLowerCase()) {
        alert("Du kannst dein eigenes Spielgesuch nicht annehmen.");
        acceptingPlayerNameInput.focus();
        return;
      }
    }

    // Name merken
    setStoredPlayerName(acceptingPlayerName);

    modalConfirmBtn.disabled = true;
    modalConfirmBtn.textContent = "Bestätige...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: currentRequestId,
          acceptingPlayerName: acceptingPlayerName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      await response.json();
      closeModal();
      fetchGames();
    } catch (error) {
      console.error("Fehler beim Annehmen des Gesuchs:", error);
      alert(`Fehler beim Annehmen: ${error.message}`);
    } finally {
      modalConfirmBtn.disabled = false;
      modalConfirmBtn.textContent = "Spiel bestätigen";
    }
  }

  async function deleteConfirmedGame(id) {
    if (!window.confirm("Möchtest du diese Paarung wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/confirmed/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      await response.json();
      fetchGames();
    } catch (error) {
      console.error("Fehler beim Löschen des Spiels:", error);
      alert(`Fehler beim Löschen: ${error.message}`);
    }
  }

  // ==========================================================================
  // Inline Form Controls
  // ==========================================================================

  function showAddRequestForm() {
    addRequestBtn.hidden = true;
    addRequestForm.hidden = false;
    newRequestNameInput.value = getStoredPlayerName();
    hideAddRequestError();
    newRequestSystemSelect.value = "";
    newRequestNameInput.focus();
  }

  function hideAddRequestForm() {
    addRequestForm.hidden = true;
    addRequestBtn.hidden = false;
    hideAddRequestError();
  }

  function showAddRequestError(message) {
    addRequestError.textContent = message;
    addRequestError.hidden = false;
  }

  function hideAddRequestError() {
    addRequestError.textContent = "";
    addRequestError.hidden = true;
  }

  addRequestBtn.addEventListener("click", showAddRequestForm);
  cancelRequestBtn.addEventListener("click", hideAddRequestForm);
  if (closeFormBtn) closeFormBtn.addEventListener("click", hideAddRequestForm);
  submitRequestBtn.addEventListener("click", submitNewRequest);

  newRequestNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitNewRequest();
    }
  });

  acceptingPlayerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmAcceptRequest();
    }
  });

  modalConfirmBtn.addEventListener("click", confirmAcceptRequest);

  // ==========================================================================
  // Week Navigation
  // ==========================================================================

  prevWeekBtn.addEventListener("click", () => {
    currentTuesdayDate = addDays(currentTuesdayDate, -7);
    updateWeekDisplay();
    fetchGames();
    hideAddRequestForm();
  });

  nextWeekBtn.addEventListener("click", () => {
    currentTuesdayDate = addDays(currentTuesdayDate, 7);
    updateWeekDisplay();
    fetchGames();
    hideAddRequestForm();
  });

  // ==========================================================================
  // PWA Service Worker & Offline Sync
  // ==========================================================================

  function updateOnlineStatus() {
    if (offlineBanner) {
      if (navigator.onLine) {
        offlineBanner.hidden = true;
        // Bei Wiederherstellung Daten neu laden
        fetchGames();
      } else {
        offlineBanner.hidden = false;
      }
    }
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for worker updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("Neue Version von 9InchPairs verfügbar.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("ServiceWorker Registration fehlgeschlagen:", err);
        });
    });
  }

  // ==========================================================================
  // Initial Initialization
  // ==========================================================================

  updateProfileDisplay();
  updateWeekDisplay();
  fetchGames();
});
