const state = {
  user: null,
  room: null,
  player: null,
  playerReady: false,
  playerInitStarted: false,
  playerLoadFallbackShown: false,
  lastSeq: 0,
  suppressPlayerEventsUntil: 0,
  pollTimer: null,
  selectedAvatar: "🎧",
  lastTypingAt: 0,
  activeGame: "ludo",
  ludo: { turn: 0, pawns: initialLudoPawns(4), winner: null, lastRoll: null },
  snakes: { turn: 0, positions: [1, 1, 1, 1], winner: null, lastRoll: null },
  mix: { bass: 40, volume: 85 },
  mixSyncTimer: null,
  localMixUntil: 0,
  auth: null,
  profile: null,
  nicknameTimer: null,
  nicknameAvailable: false,
};

const $ = (selector) => document.querySelector(selector);

const joinView = $("#joinView");
const homeView = $("#homeView");
const partyView = $("#partyView");
const authWelcome = $("#authWelcome");
const heroStartBtn = $("#heroStartBtn");
const heroJoinBtn = $("#heroJoinBtn");
const continueEmailBtn = $("#continueEmailBtn");
const loginEmailBtn = $("#loginEmailBtn");
const emailForm = $("#emailForm");
const authEmailInput = $("#authEmailInput");
const emailError = $("#emailError");
const backToWelcomeBtn = $("#backToWelcomeBtn");
const profileForm = $("#profileForm");
const nicknameInput = $("#nicknameInput");
const nicknameStatus = $("#nicknameStatus");
const displayNameInput = $("#displayNameInput");
const statusInput = $("#statusInput");
const profileError = $("#profileError");
const profilePreviewAvatar = $("#profilePreviewAvatar");
const profilePreviewNickname = $("#profilePreviewNickname");
const profilePreviewName = $("#profilePreviewName");
const profilePreviewStatus = $("#profilePreviewStatus");
const homeAvatar = $("#homeAvatar");
const homeNickname = $("#homeNickname");
const logoutBtn = $("#logoutBtn");
const joinForm = $("#joinForm");
const joinError = $("#joinError");
const nameInput = $("#nameInput");
const emailInput = $("#emailInput");
const roomInput = $("#roomInput");
const vibeInput = $("#vibeInput");
const avatarPicker = $("#avatarPicker");
const publicRooms = $("#publicRooms");
const refreshRoomsBtn = $("#refreshRoomsBtn");
const roomCode = $("#roomCode");
const roomMeta = $("#roomMeta");
const copyLinkBtn = $("#copyLinkBtn");
const claimHostBtn = $("#claimHostBtn");
const leaveBtn = $("#leaveBtn");
const videoForm = $("#videoForm");
const videoInput = $("#videoInput");
const searchForm = $("#searchForm");
const searchInput = $("#searchInput");
const searchStatus = $("#searchStatus");
const searchResults = $("#searchResults");
const youtubeSearchLink = $("#youtubeSearchLink");
const playBtn = $("#playBtn");
const pauseBtn = $("#pauseBtn");
const syncBtn = $("#syncBtn");
const statusText = $("#statusText");
const bassBoostInput = $("#bassBoostInput");
const volumeInput = $("#volumeInput");
const bassBoostValue = $("#bassBoostValue");
const volumeValue = $("#volumeValue");
const mixQualityLabel = $("#mixQualityLabel");
const peopleCount = $("#peopleCount");
const peopleList = $("#peopleList");
const queueList = $("#queueList");
const playQueueBtn = $("#playQueueBtn");
const promptText = $("#promptText");
const newPromptBtn = $("#newPromptBtn");
const ludoGame = $("#ludoGame");
const ludoTrack = $("#ludoTrack");
const ludoStatus = $("#ludoStatus");
const ludoDice = $("#ludoDice");
const ludoRollBtn = $("#ludoRollBtn");
const ludoResetBtn = $("#ludoResetBtn");
const snakesGame = $("#snakesGame");
const snakesBoard = $("#snakesBoard");
const snakesStatus = $("#snakesStatus");
const snakesDice = $("#snakesDice");
const snakesRollBtn = $("#snakesRollBtn");
const snakesResetBtn = $("#snakesResetBtn");
const historyList = $("#historyList");
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const typingText = $("#typingText");
const playerOverlay = $("#playerOverlay");
const reactionLayer = $("#reactionLayer");
const subscribeLink = $("#subscribeLink");

const themeNames = {
  "late-night": "🌙 Late Night",
  "study-lofi": "📚 Study Lofi",
  party: "🔥 Party",
  movie: "🍿 Movie",
  heartbreak: "💔 Heartbreak",
  anime: "✨ Anime",
};

const LUDO_SAFE_TILES = [0, 8, 13, 21, 26, 34, 39, 47];
const LUDO_START_OFFSETS = [0, 13, 26, 39];
const LUDO_PLAYER_COLORS = ["green", "red", "blue", "yellow"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initYouTubePlayer() {
  if (state.playerInitStarted || !window.YT?.Player) return;
  state.playerInitStarted = true;
  try {
    state.player = new YT.Player("player", {
      videoId: "M7lc1UVf-VE",
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: () => {
          state.playerReady = true;
          playerOverlay.classList.add("ready");
          renderDjConsole();
          applyDjConsole();
          if (state.room) applySnapshot(state.room);
        },
        onStateChange: handlePlayerStateChange,
        onError: handlePlayerError,
      },
    });
  } catch {
    state.playerInitStarted = false;
    showPlayerLoadFallback();
  }
}

window.onYouTubeIframeAPIReady = initYouTubePlayer;
initYouTubePlayer();
setTimeout(initYouTubePlayer, 500);
setTimeout(showPlayerLoadFallback, 7000);

restoreAuthSession();
loadAppConfig();
renderDjConsole();

refreshRoomsBtn?.addEventListener("click", loadPublicRooms);

heroStartBtn?.addEventListener("click", () => showAuthStep("email"));
heroJoinBtn?.addEventListener("click", () => showAuthStep("email"));
continueEmailBtn?.addEventListener("click", () => showAuthStep("email"));
loginEmailBtn?.addEventListener("click", () => showAuthStep("email"));
backToWelcomeBtn?.addEventListener("click", () => showAuthStep("welcome"));

avatarPicker?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-avatar]");
  if (!button) return;
  state.selectedAvatar = button.dataset.avatar;
  avatarPicker.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
  renderProfilePreview();
});

emailForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  emailError.textContent = "";
  const email = authEmailInput.value.trim();
  try {
    const data = await api("/api/auth/public-login", { email });
    setAuthSession(data.sessionToken, data.account);
    if (data.account.profileComplete) showHome();
    else showAuthStep("profile");
  } catch (error) {
    emailError.textContent = error.message;
  }
});

nicknameInput?.addEventListener("input", () => {
  state.nicknameAvailable = false;
  clearTimeout(state.nicknameTimer);
  const nickname = nicknameInput.value.trim().toLowerCase();
  nicknameInput.value = nickname;
  const localError = validateNicknameText(nickname);
  if (localError) {
    nicknameStatus.textContent = localError;
    nicknameStatus.className = "field-status danger";
    return;
  }
  nicknameStatus.textContent = "Checking availability...";
  nicknameStatus.className = "field-status";
  renderProfilePreview();
  state.nicknameTimer = setTimeout(checkNicknameAvailability, 350);
});

[displayNameInput, statusInput].forEach((input) => {
  input?.addEventListener("input", renderProfilePreview);
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileError.textContent = "";
  try {
    const data = await api("/api/profile", {
      sessionToken: state.auth?.sessionToken,
      nickname: nicknameInput.value.trim(),
      displayName: displayNameInput.value.trim(),
      avatar: state.selectedAvatar,
      status: statusInput.value.trim(),
    });
    state.profile = data.account;
    hydrateHomeProfile();
    showHome();
  } catch (error) {
    profileError.textContent = error.message;
  }
});

logoutBtn?.addEventListener("click", async () => {
  const token = state.auth?.sessionToken || localStorage.getItem("watchPartySession");
  if (token) await api("/api/auth/logout", { sessionToken: token }).catch(() => {});
  localStorage.removeItem("watchPartySession");
  state.auth = null;
  state.profile = null;
  state.room = null;
  state.user = null;
  showAuthStep("welcome");
});

joinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  joinError.textContent = "";
  const params = new URLSearchParams(location.search);
  const roomId = roomInput.value.trim() || params.get("room") || "";
  try {
    if (!state.auth?.sessionToken) throw new Error("Please log in first.");
    const data = await api("/api/join", { authSessionToken: state.auth.sessionToken, roomId });
    enterRoom(data);
  } catch (error) {
    joinError.textContent = error.message;
  }
});

videoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const videoId = extractVideoId(videoInput.value.trim());
  if (!videoId) {
    videoInput.focus();
    return;
  }
  await loadVideoForRoom(videoId, "Pasted video");
  videoInput.value = "";
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runMusicSearch(searchInput.value.trim());
});

document.querySelectorAll("[data-quick-search]").forEach((button) => {
  button.addEventListener("click", async () => {
    searchInput.value = button.dataset.quickSearch;
    await runMusicSearch(button.dataset.quickSearch);
  });
});

playBtn.addEventListener("click", () => {
  if (!state.playerReady) return;
  applyDjConsole();
  state.player.playVideo?.();
  sendControl("play", state.player.getCurrentTime());
});

pauseBtn.addEventListener("click", () => {
  if (!state.playerReady) return;
  state.player.pauseVideo?.();
  sendControl("pause", state.player.getCurrentTime());
});

syncBtn.addEventListener("click", () => {
  if (state.room) applySnapshot(state.room, true);
});

[
  ["bass", bassBoostInput],
  ["volume", volumeInput],
].forEach(([key, input]) => {
  if (!input) return;
  input.addEventListener("input", () => {
    state.mix[key] = key === "volume" ? clamp(Number(input.value), 0, 100) : Number(input.value);
    state.localMixUntil = Date.now() + 900;
    renderDjConsole();
    applyDjConsole();
    scheduleMixSync();
  });
  input.addEventListener("change", () => {
    applyDjConsole();
    syncMixNow();
  });
});

copyLinkBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  copyLinkBtn.textContent = "Copied";
  setTimeout(() => {
    copyLinkBtn.textContent = "Copy link";
  }, 1200);
});

claimHostBtn.addEventListener("click", async () => {
  const data = await api("/api/host/claim", authBody());
  state.room = data.room;
  renderRoom(data.room);
});

leaveBtn.addEventListener("click", async () => {
  if (state.room && state.user) await api("/api/leave", authBody()).catch(() => {});
  state.room = null;
  state.user = null;
  clearTimeout(state.pollTimer);
  history.replaceState(null, "", location.pathname);
  showHome();
});

chatInput.addEventListener("input", () => {
  if (!state.room || Date.now() - state.lastTypingAt < 1200) return;
  state.lastTypingAt = Date.now();
  api("/api/typing", { ...authBody(), typing: true }).catch(() => {});
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  await api("/api/chat", { ...authBody(), text });
});

document.querySelectorAll("[data-mood]").forEach((button) => {
  button.addEventListener("click", async () => api("/api/chat", { ...authBody(), text: button.dataset.mood }));
});

document.querySelectorAll("[data-emoji]").forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = `${chatInput.value}${button.dataset.emoji}`;
    chatInput.focus();
  });
});

document.querySelectorAll("[data-reaction]").forEach((button) => {
  button.addEventListener("click", async () => {
    burstReaction(button.dataset.reaction);
    await api("/api/reaction", { ...authBody(), emoji: button.dataset.reaction });
  });
});

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", async () => {
    const data = await api("/api/theme", { ...authBody(), theme: button.dataset.theme });
    state.room = data.room;
    renderRoom(data.room);
  });
});

newPromptBtn?.addEventListener("click", async () => {
  const data = await api("/api/prompt", authBody());
  state.room = data.room;
  renderRoom(data.room);
});

playQueueBtn.addEventListener("click", async () => {
  await playQueueItem("");
});

document.querySelectorAll("[data-game-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeGame = button.dataset.gameTab;
    renderMiniGames();
  });
});

ludoRollBtn.addEventListener("click", async () => {
  await rollRoomGame("ludo", ludoStatus);
});

snakesRollBtn.addEventListener("click", async () => {
  await rollRoomGame("snakes", snakesStatus);
});

ludoResetBtn.addEventListener("click", async () => {
  if (!confirm("Reset this Ludo round?")) return;
  await resetRoomGame("ludo", ludoStatus);
});

snakesResetBtn.addEventListener("click", async () => {
  if (!confirm("Reset this Snake & Ladder round?")) return;
  await resetRoomGame("snakes", snakesStatus);
});

function showAuthStep(step) {
  joinView.classList.remove("hidden");
  homeView.classList.add("hidden");
  partyView.classList.add("hidden");
  [authWelcome, emailForm, profileForm].forEach((element) => element?.classList.add("hidden"));
  if (step === "email") emailForm.classList.remove("hidden");
  else if (step === "profile") profileForm.classList.remove("hidden");
  else authWelcome.classList.remove("hidden");
}

function showHome() {
  hydrateHomeProfile();
  joinView.classList.add("hidden");
  partyView.classList.add("hidden");
  homeView.classList.remove("hidden");
  const params = new URLSearchParams(location.search);
  if (params.get("room")) roomInput.value = params.get("room");
}

function enterRoom(data) {
  state.user = data.user;
  state.room = data.room;
  state.lastSeq = data.room.seq;
  history.replaceState(null, "", `?room=${encodeURIComponent(data.room.roomId)}`);
  joinView.classList.add("hidden");
  homeView.classList.add("hidden");
  partyView.classList.remove("hidden");
  renderRoom(data.room);
  applySnapshot(data.room);
  clearTimeout(state.pollTimer);
  pollEvents();
}

function setAuthSession(sessionToken, account) {
  state.auth = { sessionToken };
  state.profile = account;
  localStorage.setItem("watchPartySession", sessionToken);
  hydrateHomeProfile();
}

function hydrateHomeProfile() {
  const profile = state.profile || {};
  homeAvatar.textContent = profile.avatar || "🎧";
  homeNickname.textContent = profile.nickname ? `@${profile.nickname}` : "@profile";
  if (nameInput) nameInput.value = profile.displayName || profile.nickname || "";
  if (emailInput) emailInput.value = profile.email || "";
  if (vibeInput) vibeInput.value = profile.status || "Ready";
  if (profile.avatar && avatarPicker) {
    state.selectedAvatar = profile.avatar;
    avatarPicker.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("selected", button.dataset.avatar === profile.avatar);
    });
  }
}

function renderProfilePreview() {
  if (!profilePreviewAvatar) return;
  const nickname = nicknameInput?.value.trim() || "nickname";
  const displayName = displayNameInput?.value.trim() || "Your display name";
  const status = statusInput?.value.trim() || "Ready to watch 🎬";
  profilePreviewAvatar.textContent = state.selectedAvatar || "🎧";
  profilePreviewNickname.textContent = `@${nickname}`;
  profilePreviewName.textContent = displayName;
  profilePreviewStatus.textContent = status;
}

async function restoreAuthSession() {
  const params = new URLSearchParams(location.search);
  if (params.get("room")) roomInput.value = params.get("room");
  const token = localStorage.getItem("watchPartySession");
  if (!token) {
    showAuthStep("welcome");
    return;
  }
  try {
    const data = await apiGet(`/api/auth/session?token=${encodeURIComponent(token)}`);
    setAuthSession(token, data.account);
    if (data.account.profileComplete) showHome();
    else showAuthStep("profile");
  } catch {
    localStorage.removeItem("watchPartySession");
    showAuthStep("welcome");
  }
}

function validateNicknameText(nickname) {
  if (nickname.length < 3) return "Nickname must be at least 3 characters.";
  if (nickname.length > 20) return "Nickname must be 20 characters or less.";
  if (!/^[a-z0-9_.]+$/.test(nickname)) return "Only letters, numbers, underscore and dot are allowed.";
  return "";
}

async function checkNicknameAvailability() {
  const nickname = nicknameInput.value.trim();
  const error = validateNicknameText(nickname);
  if (error) {
    nicknameStatus.textContent = error;
    nicknameStatus.className = "field-status danger";
    return;
  }
  try {
    const data = await apiGet(`/api/nickname/check?nickname=${encodeURIComponent(nickname)}&token=${encodeURIComponent(state.auth?.sessionToken || "")}`);
    state.nicknameAvailable = Boolean(data.available);
    nicknameStatus.textContent = data.message || (data.available ? "Nickname available." : "Nickname already taken.");
    nicknameStatus.className = `field-status ${data.available ? "success" : "danger"}`;
  } catch (error) {
    nicknameStatus.textContent = error.message;
    nicknameStatus.className = "field-status danger";
  }
}

async function loadAppConfig() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();
    document.title = config.appName || document.title;
    if (config.paymentsEnabled && config.paymentLink) {
      subscribeLink.href = config.paymentLink;
      subscribeLink.classList.remove("hidden");
    }
    if (config.officialYoutubeSearch) {
      searchStatus.textContent = "Official YouTube search is active. Search or tap a mood to play for everyone.";
    }
  } catch {
    // The room still works without release config.
  }
}

async function loadPublicRooms() {
  try {
    const response = await fetch("/api/rooms");
    const data = await response.json();
    publicRooms.innerHTML = "";
    if (!data.rooms.length) {
      publicRooms.innerHTML = `<p class="empty-note">No live rooms yet. Create the first one.</p>`;
      return;
    }
    data.rooms.forEach((room) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "public-room";
      button.innerHTML = `<strong>${room.themeEmoji} ${room.roomId}</strong><span>${room.people}/5 · ${room.themeName}</span>`;
      button.addEventListener("click", () => {
        roomInput.value = room.roomId;
        roomInput.focus();
      });
      publicRooms.appendChild(button);
    });
  } catch {
    publicRooms.innerHTML = `<p class="empty-note">Room discovery is offline.</p>`;
  }
}

function handlePlayerStateChange(event) {
  if (!state.user || Date.now() < state.suppressPlayerEventsUntil) return;
  if (event.data === YT.PlayerState.PLAYING) sendControl("play", state.player.getCurrentTime());
  if (event.data === YT.PlayerState.PAUSED) sendControl("pause", state.player.getCurrentTime());
}

function handlePlayerError(event) {
  const videoId = state.room?.videoId || state.player?.getVideoData?.().video_id || "";
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "https://www.youtube.com";
  const blocked = [100, 101, 150].includes(Number(event.data));
  const reason = blocked ? "This video owner does not allow embedded playback." : "YouTube could not play this video inside the app.";
  statusText.innerHTML = `${reason} <a href="${watchUrl}" target="_blank" rel="noreferrer">Watch on YouTube</a>`;
  searchStatus.innerHTML = `${reason} Pick another search result, or <a href="${watchUrl}" target="_blank" rel="noreferrer">open it on YouTube</a>.`;
  playerOverlay.classList.add("ready");
}

function showPlayerLoadFallback() {
  if (state.playerReady) return;
  state.playerLoadFallbackShown = true;
  const videoId = state.room?.videoId || "M7lc1UVf-VE";
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  playerOverlay.innerHTML = `YouTube is slow on this device. <a href="${watchUrl}" target="_blank" rel="noreferrer">Open video</a>, then come back and tap Sync me.`;
  playerOverlay.classList.remove("ready");
  statusText.innerHTML = `Waiting for YouTube player. <a href="${watchUrl}" target="_blank" rel="noreferrer">Open current video</a>`;
}

async function loadVideoForRoom(videoId, title = "YouTube video") {
  if (state.playerReady && state.player) {
    state.suppressPlayerEventsUntil = Date.now() + 1200;
    state.player.loadVideoById(videoId, 0);
    state.player.playVideo?.();
  }
  await sendControl("load", 0, videoId, title);
  if (state.room) applySnapshot(state.room, true);
  applyDjConsole();
  searchStatus.textContent = "Playing now for everyone. Enjoy the vibe.";
}

async function runMusicSearch(query) {
  if (!query) return;
  searchStatus.textContent = "Finding music...";
  searchResults.innerHTML = "";
  youtubeSearchLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search failed");
    renderSearchResults(data.results || []);
  } catch {
    searchStatus.innerHTML = `Search could not load here. <a href="${youtubeSearchLink.href}" target="_blank" rel="noreferrer">Open YouTube results</a>.`;
  }
}

async function sendControl(action, position = 0, videoId = "", title = "YouTube video") {
  const data = await api("/api/control", { ...authBody(), action, position, videoId, title });
  if (data.room) {
    state.room = data.room;
    renderRoom(data.room);
    applySnapshot(data.room, action === "load");
  }
}

async function addQueueItem(result) {
  const data = await api("/api/queue/add", {
    ...authBody(),
    videoId: result.videoId,
    title: result.title,
    thumbnail: result.thumbnail,
  });
  state.room = data.room;
  renderRoom(data.room);
  searchStatus.textContent = `Added “${result.title}” to Next queue.`;
}

async function voteQueueItem(itemId) {
  const data = await api("/api/queue/vote", { ...authBody(), itemId });
  state.room = data.room;
  renderRoom(data.room);
}

async function playQueueItem(itemId) {
  const data = await api("/api/queue/play", { ...authBody(), itemId });
  state.room = data.room;
  renderRoom(data.room);
  applySnapshot(data.room, true);
}

async function pollEvents() {
  if (!state.room || !state.user) return;
  try {
    const query = new URLSearchParams({
      room: state.room.roomId,
      user: state.user.id,
      token: state.user.sessionToken || "",
      since: String(state.lastSeq),
    });
    const response = await fetch(`/api/events?${query}`);
    if (!response.ok) throw new Error("Disconnected");
    const data = await response.json();
    state.room = data.snapshot;
    renderRoom(data.snapshot);
    data.events.forEach(handleEvent);
  } catch {
    appendSystem("Connection paused. Trying again...");
  } finally {
    state.pollTimer = setTimeout(pollEvents, 900);
  }
}

function handleEvent(event) {
  state.lastSeq = Math.max(state.lastSeq, event.seq);
  if (event.type === "chat") appendChat(event.payload.name, event.payload.text, event.payload.avatar);
  if (event.type === "system") appendSystem(event.payload.message);
  if (event.type === "queue") appendSystem(event.payload.message);
  if (event.type === "theme") appendSystem(`${event.payload.emoji} ${event.payload.by} switched to ${event.payload.name}.`);
  if (event.type === "prompt") appendSystem(`Mini game: ${event.payload.text}`);
  if (event.type === "reaction") burstReaction(event.payload.emoji);
  if (event.type === "mix") {
    applyRoomMix(event.payload.mix);
    if (event.payload.userId !== state.user.id) appendSystem(`${event.payload.name} tuned the DJ console.`);
  }
  if (event.type === "game") {
    if (event.payload.snapshot) applyGameSnapshot(event.payload.snapshot);
    if (event.payload.message) appendSystem(`Game: ${event.payload.message}`);
    renderMiniGames();
  }
  if (event.type === "room" && event.payload.snapshot) {
    state.room = event.payload.snapshot;
    renderRoom(state.room);
  }
  if (event.type === "control") {
    const payload = event.payload;
    state.room.videoId = payload.videoId;
    state.room.status = payload.status;
    state.room.position = payload.position;
    state.room.updatedAt = payload.updatedAt;
    applySnapshot(state.room);
    if (payload.userId !== state.user.id) appendSystem(`${payload.name} ${describeControl(payload.action)}.`);
  }
}

function renderRoom(room) {
  if (room.mix) applyRoomMix(room.mix, true);
  roomCode.textContent = room.roomId;
  peopleCount.textContent = `${room.users.length}/5`;
  const host = room.users.find((user) => user.id === room.hostId);
  roomMeta.textContent = `${themeNames[room.theme] || "🔥 Party"} · Host: ${host?.name || "Open"}`;
  document.body.className = `theme-${room.theme || "party"}`;
  renderThemes(room.theme);
  renderPeople(room);
  renderQueue(room);
  renderHistory(room);
  renderTyping(room);
  promptText.textContent = room.prompt?.text || "Rate this video out of 10.";
  applyGameSnapshot(room.games);
  renderMiniGames();
  renderStatus(room);
  if (!state.playerReady && state.playerLoadFallbackShown) showPlayerLoadFallback();
}

function renderThemes(activeTheme) {
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.theme === activeTheme);
  });
}

function renderPeople(room) {
  peopleList.innerHTML = "";
  room.users.forEach((user) => {
    const person = document.createElement("div");
    person.className = "person-pill";
    const label = user.id === state.user?.id ? `${user.name} (you)` : user.name;
    const badges = (user.badges || []).map((badge) => `<span>${badge}</span>`).join("");
    person.innerHTML = `
      <span class="person-avatar"></span>
      <span class="person-name"></span>
      <span class="person-vibe"></span>
      <div class="badge-row">${badges}</div>
    `;
    person.querySelector(".person-avatar").textContent = user.avatar || "🎧";
    person.querySelector(".person-name").textContent = `${user.id === room.hostId ? "Host · " : ""}${label}`;
    person.querySelector(".person-vibe").textContent = `${user.online ? "online" : "away"} · ${user.vibe || "Ready"}`;
    peopleList.appendChild(person);
  });
}

function renderQueue(room) {
  queueList.innerHTML = "";
  const queue = room.queue || [];
  playQueueBtn.disabled = queue.length === 0;
  if (!queue.length) {
    queueList.textContent = "Add songs from search to build the next queue.";
    queueList.classList.add("empty-note");
    return;
  }
  queueList.classList.remove("empty-note");
  queue.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "queue-item";
    row.innerHTML = `
      <img alt="" loading="lazy">
      <div>
        <h4></h4>
        <p></p>
      </div>
      <div class="queue-actions">
        <button type="button" class="secondary-button vote-btn">Vote</button>
        <button type="button" class="primary-button play-queue-btn">Play</button>
      </div>
    `;
    row.querySelector("img").src = item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
    row.querySelector("h4").textContent = `${index + 1}. ${item.title}`;
    row.querySelector("p").textContent = `${item.votes || 0} votes · added by ${item.addedBy || "room"}`;
    const voteBtn = row.querySelector(".vote-btn");
    voteBtn.classList.toggle("selected", (item.voterIds || []).includes(state.user?.id));
    voteBtn.addEventListener("click", () => voteQueueItem(item.id));
    row.querySelector(".play-queue-btn").addEventListener("click", () => playQueueItem(item.id));
    queueList.appendChild(row);
  });
}

function renderHistory(room) {
  historyList.innerHTML = "";
  if (!room.history.length) {
    historyList.textContent = "Nothing watched yet.";
    historyList.classList.add("empty-note");
    return;
  }
  historyList.classList.remove("empty-note");
  room.history.slice().reverse().forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "history-item";
    row.innerHTML = `<strong></strong><span></span>`;
    row.querySelector("strong").textContent = item.title;
    row.querySelector("span").textContent = `Played by ${item.by}`;
    row.addEventListener("click", () => loadVideoForRoom(item.videoId, item.title));
    historyList.appendChild(row);
  });
}

function renderTyping(room) {
  const names = (room.typing || []).filter((item) => item.userId !== state.user?.id).map((item) => item.name);
  typingText.textContent = names.length ? `${names.join(", ")} typing...` : "Live";
}

function renderMiniGames() {
  if (state.activeGame === "prompt") state.activeGame = "ludo";
  document.querySelectorAll("[data-game-tab]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.gameTab === state.activeGame);
  });
  promptText?.classList.add("hidden");
  ludoGame.classList.toggle("hidden", state.activeGame !== "ludo");
  snakesGame.classList.toggle("hidden", state.activeGame !== "snakes");
  renderLudo();
  renderSnakes();
}

async function rollRoomGame(game, statusElement) {
  try {
    const data = await api("/api/game/roll", { ...authBody(), game });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    statusElement.textContent = error.message;
  }
}

async function resetRoomGame(game, statusElement) {
  try {
    const data = await api("/api/game/reset", { ...authBody(), game });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    statusElement.textContent = error.message;
  }
}

function gamePlayers() {
  const roomUsers = state.room?.users || [];
  let users = roomUsers.filter((user) => user.online !== false);
  if (!users.length && state.user) {
    users = [state.user];
  }
  if (!users.length) {
    users = [{ name: "Player 1", avatar: "🎧" }];
  }
  return users.slice(0, 4).map((user, index) => ({
    id: user.id || "",
    name: user.name || `Player ${index + 1}`,
    avatar: user.avatar || ["🎧", "🔥", "✨", "🍿"][index],
    color: ["#16b75f", "#e7333f", "#1d8dff", "#ffc928"][index],
  }));
}

function applyGameSnapshot(games) {
  if (!games) return;
  if (games.ludo) {
    state.ludo = {
      turn: Number(games.ludo.turn || 0),
      pawns: normalizeLudoPawns(games.ludo.pawns, gamePlayers().length),
      winner: games.ludo.winner || null,
      lastRoll: games.ludo.lastRoll || null,
      message: games.ludo.message || state.ludo.message || "New Ludo round. Roll a 6 to open one pawn.",
    };
  }
  if (games.snakes) {
    state.snakes = {
      turn: Number(games.snakes.turn || 0),
      positions: normalizeSlots(games.snakes.positions, gamePlayers().length, 1),
      winner: games.snakes.winner || null,
      lastRoll: games.snakes.lastRoll || null,
      message: games.snakes.message || state.snakes.message || "New Snake & Ladder round. First exact 100 wins.",
    };
  }
}

function syncGameSlots(players) {
  state.ludo.pawns = normalizeLudoPawns(state.ludo.pawns, players.length);
  state.snakes.positions = normalizeSlots(state.snakes.positions, players.length, 1);
  state.ludo.turn %= players.length;
  state.snakes.turn %= players.length;
}

function initialLudoPawns(count) {
  return Array.from({ length: count }, () => [-1, -1, -1, -1]);
}

function normalizeLudoPawns(pawns, count) {
  const next = Array.isArray(pawns) ? pawns.slice(0, count) : [];
  while (next.length < count) next.push([-1, -1, -1, -1]);
  return next.map((playerPawns) => {
    if (!Array.isArray(playerPawns)) return [-1, -1, -1, -1];
    const normalized = playerPawns.slice(0, 4);
    while (normalized.length < 4) normalized.push(-1);
    return normalized;
  });
}

function normalizeSlots(slots, count, fallback) {
  const next = slots.slice(0, count);
  while (next.length < count) next.push(fallback);
  return next;
}

function playLudoTurn(playerIndex, roll, players) {
  if (state.ludo.winner) return { message: `${state.ludo.winner} already brought all pawns HOME. Reset for a new round.`, extraTurn: false };
  const player = players[playerIndex];
  const pawns = state.ludo.pawns[playerIndex];
  const candidates = ludoMoveCandidates(playerIndex, roll);
  if (!candidates.length) {
    const allLocked = pawns.every((position) => position < 0);
    const reason = allLocked && roll !== 6 ? "Need a 6 to open a pawn." : "No legal move; exact roll is needed near HOME.";
    return { message: `${player.name} rolled ${roll}. ${reason}`, extraTurn: roll === 6 };
  }
  const move = chooseLudoMove(candidates);
  pawns[move.pawnIndex] = move.to;
  const captured = captureLudoRival(playerIndex, move.pawnIndex);
  if (pawns.every((position) => position === 57)) {
    state.ludo.winner = player.name;
    return { message: `${player.name} brought all 4 pawns HOME and won Ludo.`, extraTurn: false };
  }
  const extra = roll === 6;
  const action = move.from < 0 ? `opened pawn ${move.pawnIndex + 1}` : move.to === 57 ? `sent pawn ${move.pawnIndex + 1} HOME` : `moved pawn ${move.pawnIndex + 1}`;
  const captureText = captured ? ` Captured ${captured}'s pawn.` : "";
  return { message: `${player.name} rolled ${roll} and ${action}.${captureText}${extra ? " Roll again." : ""}`, extraTurn: extra };
}

function ludoMoveCandidates(playerIndex, roll) {
  const pawns = state.ludo.pawns[playerIndex];
  return pawns
    .map((position, pawnIndex) => {
      if (position === 57) return null;
      if (position < 0) {
        if (roll !== 6) return null;
        return { pawnIndex, from: position, to: 0, opens: true, finishes: false, captures: ludoLandingCaptures(playerIndex, 0) };
      }
      const to = position + roll;
      if (to > 57) return null;
      return { pawnIndex, from: position, to, opens: false, finishes: to === 57, captures: ludoLandingCaptures(playerIndex, to) };
    })
    .filter(Boolean);
}

function chooseLudoMove(candidates) {
  return candidates.slice().sort((a, b) => {
    if (a.finishes !== b.finishes) return a.finishes ? -1 : 1;
    if (a.captures !== b.captures) return b.captures - a.captures;
    if (a.opens !== b.opens) return a.opens ? 1 : -1;
    return b.to - a.to;
  })[0];
}

function ludoLandingCaptures(playerIndex, landingProgress) {
  if (landingProgress < 0 || landingProgress >= 52) return 0;
  const landing = ludoBoardIndex(playerIndex, landingProgress);
  if (LUDO_SAFE_TILES.includes(landing)) return 0;
  return state.ludo.pawns.reduce((total, pawns, rivalIndex) => {
    if (rivalIndex === playerIndex) return total;
    return total + pawns.filter((position) => position >= 0 && position < 52 && ludoBoardIndex(rivalIndex, position) === landing).length;
  }, 0);
}

function captureLudoRival(playerIndex, pawnIndex) {
  const progress = state.ludo.pawns[playerIndex][pawnIndex];
  if (progress < 0 || progress >= 52) return "";
  const landing = ludoBoardIndex(playerIndex, progress);
  if (LUDO_SAFE_TILES.includes(landing)) return "";
  const players = gamePlayers();
  for (let rivalIndex = 0; rivalIndex < state.ludo.pawns.length; rivalIndex += 1) {
    if (rivalIndex === playerIndex) continue;
    for (let rivalPawn = 0; rivalPawn < state.ludo.pawns[rivalIndex].length; rivalPawn += 1) {
      const position = state.ludo.pawns[rivalIndex][rivalPawn];
      if (position < 0 || position >= 52) continue;
      if (ludoBoardIndex(rivalIndex, position) === landing) {
        state.ludo.pawns[rivalIndex][rivalPawn] = -1;
        return players[rivalIndex]?.name || `Player ${rivalIndex + 1}`;
      }
    }
  }
  return "";
}

function ludoBoardIndex(playerIndex, progress) {
  return (progress + LUDO_START_OFFSETS[playerIndex]) % 52;
}

function ludoPawnPoint(playerIndex, pawnIndex, progress, path) {
  if (progress < 0) return ludoYardPoint(playerIndex, pawnIndex);
  if (progress === 57) return ludoFinishedPoint(playerIndex, pawnIndex);
  if (progress >= 52) return ludoHomeLanePoint(playerIndex, progress - 51, pawnIndex);
  const pathIndex = ludoBoardIndex(playerIndex, progress);
  const [x, y] = path[pathIndex];
  const offsets = [
    [-9, -9],
    [9, -9],
    [-9, 9],
    [9, 9],
  ];
  const [dx, dy] = offsets[pawnIndex] || [0, 0];
  return { x: x + dx, y: y + dy };
}

function playSnakesTurn(playerIndex, roll, players) {
  if (state.snakes.winner) return { message: `${state.snakes.winner} already won. Reset for a new round.`, extraTurn: false };
  const player = players[playerIndex];
  const current = state.snakes.positions[playerIndex] || 1;
  if (current + roll > 100) {
    return { message: `${player.name} rolled ${roll}. Exact roll needed for 100.`, extraTurn: roll === 6 };
  }
  let next = current + roll;
  const jump = snakeJumps()[next];
  let jumpText = "";
  if (jump) {
    jumpText = jump.type === "ladder" ? ` climbed ${next} to ${jump.to}` : ` slid ${next} to ${jump.to}`;
    next = jump.to;
  }
  state.snakes.positions[playerIndex] = next;
  if (next === 100) {
    state.snakes.winner = player.name;
    return { message: `${player.name} landed on 100 and won Snake & Ladder.`, extraTurn: false };
  }
  const extra = roll === 6;
  return { message: `${player.name} rolled ${roll}${jumpText}.${extra ? " Roll again." : ""}`, extraTurn: extra };
}

function renderLudo() {
  const players = gamePlayers();
  syncGameSlots(players);
  const activePlayer = players[state.ludo.turn % players.length];
  const isMyTurn = activePlayer.id === state.user?.id;
  ludoDice.textContent = diceFace(state.ludo.lastRoll);
  ludoStatus.textContent = state.ludo.message || "New Ludo round. Roll a 6 to open one pawn.";
  if (!state.ludo.winner && !isMyTurn) {
    ludoStatus.textContent = `${ludoStatus.textContent} Turn: ${activePlayer.name}.`;
  }
  ludoRollBtn.textContent = state.ludo.winner ? "Round finished" : "Your turn: Roll dice";
  ludoRollBtn.disabled = Boolean(state.ludo.winner) || !isMyTurn;
  ludoRollBtn.classList.toggle("hidden", !state.ludo.winner && !isMyTurn);
  const path = ludoPathPoints();
  const cell = 40;
  const homes = [
    { x: 0, y: 360, color: "#16b75f", label: "GREEN" },
    { x: 0, y: 0, color: "#e7333f", label: "RED" },
    { x: 360, y: 0, color: "#1d8dff", label: "BLUE" },
    { x: 360, y: 360, color: "#ffc928", label: "YELLOW" },
  ];
  const homeTiles = homes
    .map((home) => `
      <g class="ludo-home classic">
        <rect x="${home.x + 10}" y="${home.y + 10}" width="220" height="220" rx="26" fill="${home.color}"></rect>
        <rect x="${home.x + 48}" y="${home.y + 48}" width="144" height="144" rx="22"></rect>
        <circle cx="${home.x + 84}" cy="${home.y + 84}" r="24"></circle>
        <circle cx="${home.x + 156}" cy="${home.y + 84}" r="24"></circle>
        <circle cx="${home.x + 84}" cy="${home.y + 156}" r="24"></circle>
        <circle cx="${home.x + 156}" cy="${home.y + 156}" r="24"></circle>
        <text x="${home.x + 120}" y="${home.y + 128}">${home.label}</text>
      </g>
    `)
    .join("");
  const laneTiles = [
    ...ludoLane(7, 8, 6, "green", "y"),
    ...ludoLane(1, 7, 6, "red", "x"),
    ...ludoLane(7, 1, 6, "blue", "y"),
    ...ludoLane(8, 7, 6, "yellow", "x"),
  ]
    .map((tile) => `
      <rect class="ludo-lane ${tile.color}" x="${tile.x * cell}" y="${tile.y * cell}" width="${cell}" height="${cell}" rx="5"></rect>
    `)
    .join("");
  const pathTiles = path
    .map(([x, y], index) => {
      const startIndex = LUDO_START_OFFSETS.indexOf(index);
      const isStart = startIndex >= 0;
      const isSafe = LUDO_SAFE_TILES.includes(index);
      const colorClass = isStart ? LUDO_PLAYER_COLORS[startIndex] : "";
      const marker = isStart ? "●" : isSafe ? "★" : "";
      return `
        <g class="ludo-svg-tile ${isSafe ? "safe" : ""} ${isStart ? `start ${colorClass}` : ""}">
          <rect x="${x - 20}" y="${y - 20}" width="40" height="40" rx="5"></rect>
          <text x="${x}" y="${y + 5}">${marker}</text>
        </g>
      `;
    })
    .join("");
  const tokens = players
    .map((player, playerIndex) => {
      return state.ludo.pawns[playerIndex]
        .map((position, pawnIndex) => {
          const { x, y } = ludoPawnPoint(playerIndex, pawnIndex, position, path);
          return `
            <g class="svg-token pawn-token" transform="translate(${x}, ${y})">
              <path d="M0,-20 C10,-20 15,-8 8,-1 L16,15 C17,19 14,22 10,22 L-10,22 C-14,22 -17,19 -16,15 L-8,-1 C-15,-8 -10,-20 0,-20Z" fill="${player.color}"></path>
              <text y="10">${pawnIndex + 1}</text>
            </g>
          `;
        })
        .join("");
    })
    .join("");
  ludoTrack.innerHTML = `
    <svg class="ludo-svg-board" viewBox="0 0 600 600" aria-label="Ludo board">
      <rect class="board-bg ludo-bg" x="2" y="2" width="596" height="596" rx="24"></rect>
      ${homeTiles}
      ${pathTiles}
      ${laneTiles}
      <g class="ludo-center">
        <polygon points="240,240 360,240 300,300"></polygon>
        <polygon points="360,240 360,360 300,300"></polygon>
        <polygon points="360,360 240,360 300,300"></polygon>
        <polygon points="240,360 240,240 300,300"></polygon>
        <circle cx="300" cy="300" r="34"></circle>
        <text x="300" y="306">HOME</text>
      </g>
      ${tokens}
    </svg>
  `;
}

function renderSnakes() {
  const players = gamePlayers();
  syncGameSlots(players);
  const activePlayer = players[state.snakes.turn % players.length];
  const isMyTurn = activePlayer.id === state.user?.id;
  snakesDice.textContent = diceFace(state.snakes.lastRoll);
  snakesStatus.textContent = state.snakes.message || "New Snake & Ladder round. First exact 100 wins.";
  if (!state.snakes.winner && !isMyTurn) {
    snakesStatus.textContent = `${snakesStatus.textContent} Turn: ${activePlayer.name}.`;
  }
  snakesRollBtn.textContent = state.snakes.winner ? "Round finished" : "Your turn: Roll dice";
  snakesRollBtn.disabled = Boolean(state.snakes.winner) || !isMyTurn;
  snakesRollBtn.classList.toggle("hidden", !state.snakes.winner && !isMyTurn);
  const jumps = snakeJumps();
  const tiles = Array.from({ length: 100 }, (_, item) => {
    const cell = 100 - item;
    const { x, y } = snakeCellCenter(cell);
    const type = jumps[cell]?.type || "";
    const colorClass = `shade-${cell % 5}`;
    return `
      <g class="snake-svg-tile ${type} ${colorClass} ${cell === 1 ? "start" : ""} ${cell === 100 ? "finish" : ""}">
        <rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="8"></rect>
        <text x="${x - 15}" y="${y - 8}">${cell}</text>
      </g>
    `;
  }).join("");
  const ladders = Object.entries(jumps)
    .filter(([, jump]) => jump.type === "ladder")
    .map(([from, jump]) => ladderSvg(Number(from), jump.to))
    .join("");
  const snakeColors = ["#57b83f", "#f04b59", "#1f9fe8", "#ff9f24", "#a45bd8", "#15a889", "#ee3d94", "#7fc82e"];
  const snakes = Object.entries(jumps)
    .filter(([, jump]) => jump.type === "snake")
    .map(([from, jump], index) => snakeSvg(Number(from), jump.to, snakeColors[index % snakeColors.length]))
    .join("");
  const tokens = players
    .map((player, index) => {
      const { x, y } = snakeCellCenter(state.snakes.positions[index] || 1);
      const offset = (index - 1.5) * 8;
      return `
        <g class="svg-token" transform="translate(${x + offset}, ${y + offset})">
          <circle r="15" fill="${player.color}"></circle>
          <text y="5">${escapeHtml(player.avatar)}</text>
        </g>
      `;
    })
    .join("");
  snakesBoard.innerHTML = `
    <svg class="snake-svg-board" viewBox="0 0 600 600" aria-label="Snake and ladder board">
      <defs>
        <radialGradient id="snakeBoardGlow" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stop-color="#fff7dc"></stop>
          <stop offset="100%" stop-color="#dbc18e"></stop>
        </radialGradient>
      </defs>
      <rect class="board-bg snake-bg" x="8" y="8" width="584" height="584" rx="28"></rect>
      ${tiles}
      ${ladders}
      ${snakes}
      ${tokens}
    </svg>
  `;
}

function snakeCellCenter(cell) {
  const rowFromBottom = Math.floor((cell - 1) / 10);
  const colInRow = (cell - 1) % 10;
  const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  return { x: 48 + col * 56, y: 552 - rowFromBottom * 56 };
}

function snakeJumps() {
  return {
    4: { to: 25, type: "ladder" },
    9: { to: 31, type: "ladder" },
    20: { to: 38, type: "ladder" },
    28: { to: 84, type: "ladder" },
    40: { to: 59, type: "ladder" },
    51: { to: 67, type: "ladder" },
    63: { to: 81, type: "ladder" },
    71: { to: 91, type: "ladder" },
    17: { to: 7, type: "snake" },
    54: { to: 34, type: "snake" },
    62: { to: 19, type: "snake" },
    64: { to: 60, type: "snake" },
    87: { to: 24, type: "snake" },
    93: { to: 73, type: "snake" },
    95: { to: 75, type: "snake" },
    98: { to: 79, type: "snake" },
  };
}

function ludoYardPoint(playerIndex, pawnIndex) {
  const homes = [
    { x: 0, y: 360 },
    { x: 0, y: 0 },
    { x: 360, y: 0 },
    { x: 360, y: 360 },
  ];
  const slots = [
    [84, 84],
    [156, 84],
    [84, 156],
    [156, 156],
  ];
  const home = homes[playerIndex] || homes[0];
  const [x, y] = slots[pawnIndex] || slots[0];
  return { x: home.x + x, y: home.y + y };
}

function ludoHomeLanePoint(playerIndex, step, pawnIndex) {
  const clamped = Math.max(1, Math.min(6, step));
  const lanes = [
    [7, 14 - clamped],
    [clamped, 7],
    [7, clamped],
    [14 - clamped, 7],
  ];
  const [cellX, cellY] = lanes[playerIndex] || lanes[0];
  const offsets = [
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7],
  ];
  const [dx, dy] = offsets[pawnIndex] || [0, 0];
  return { x: cellX * 40 + 20 + dx, y: cellY * 40 + 20 + dy };
}

function ludoFinishedPoint(playerIndex, pawnIndex) {
  const offsets = [
    [-17, -17],
    [17, -17],
    [-17, 17],
    [17, 17],
  ];
  const [dx, dy] = offsets[pawnIndex] || [0, 0];
  return { x: 300 + dx + (playerIndex - 1.5) * 5, y: 300 + dy + (playerIndex - 1.5) * 5 };
}

function ludoLane(startX, startY, count, color, direction = "y") {
  return Array.from({ length: count }, (_, index) => ({
    x: startX + (direction === "x" ? index : 0),
    y: startY + (direction === "y" ? index : 0),
    color,
  }));
}

function ludoPathPoints() {
  const cells = [
    [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6],
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0], [8, 1],
    [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8],
    [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14],
  ];
  return cells.map(([x, y]) => [x * 40 + 20, y * 40 + 20]);
}

function ladderSvg(from, to) {
  const start = snakeCellCenter(from);
  const end = snakeCellCenter(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const nx = (-dy / length) * 8;
  const ny = (dx / length) * 8;
  const rungCount = 6;
  const rungs = Array.from({ length: rungCount }, (_, index) => {
    const t = (index + 1) / (rungCount + 1);
    const x = start.x + dx * t;
    const y = start.y + dy * t;
    return `<line class="ladder-rung" x1="${x - nx}" y1="${y - ny}" x2="${x + nx}" y2="${y + ny}"></line>`;
  }).join("");
  return `
    <g class="ladder-art">
      <line class="ladder-shadow" x1="${start.x - nx}" y1="${start.y - ny}" x2="${end.x - nx}" y2="${end.y - ny}"></line>
      <line class="ladder-shadow" x1="${start.x + nx}" y1="${start.y + ny}" x2="${end.x + nx}" y2="${end.y + ny}"></line>
      <line x1="${start.x - nx}" y1="${start.y - ny}" x2="${end.x - nx}" y2="${end.y - ny}"></line>
      <line x1="${start.x + nx}" y1="${start.y + ny}" x2="${end.x + nx}" y2="${end.y + ny}"></line>
      ${rungs}
    </g>
  `;
}

function snakeSvg(from, to, color) {
  const head = snakeCellCenter(from);
  const tail = snakeCellCenter(to);
  const dx = head.x - tail.x;
  const dy = head.y - tail.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const normalX = (-dy / length) * 58;
  const normalY = (dx / length) * 58;
  const wave = head.x > tail.x ? 1 : -1;
  const c1x = tail.x + dx * 0.18 + normalX * wave;
  const c1y = tail.y + dy * 0.18 + normalY * wave;
  const c2x = tail.x + dx * 0.44 - normalX * wave * 0.92;
  const c2y = tail.y + dy * 0.44 - normalY * wave * 0.92;
  const midX = tail.x + dx * 0.56;
  const midY = tail.y + dy * 0.56;
  const c3x = tail.x + dx * 0.76 + normalX * wave * 0.82;
  const c3y = tail.y + dy * 0.76 + normalY * wave * 0.82;
  const bodyPath = `M${tail.x} ${tail.y} C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)} S${c3x.toFixed(1)} ${c3y.toFixed(1)}, ${head.x} ${head.y}`;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const radians = Math.atan2(dy, dx);
  const tongueX = head.x + Math.cos(radians) * 54;
  const tongueY = head.y + Math.sin(radians) * 54;
  const scaleMarks = Array.from({ length: 13 }, (_, item) => {
    const t = (item + 1) / 14;
    const point = cubicPoint(
      { x: tail.x, y: tail.y },
      { x: c1x, y: c1y },
      { x: c2x, y: c2y },
      { x: midX, y: midY },
      t < 0.55 ? t / 0.55 : 1,
    );
    const secondPoint = cubicPoint(
      { x: midX, y: midY },
      { x: midX + (midX - c2x) * 0.35, y: midY + (midY - c2y) * 0.35 },
      { x: c3x, y: c3y },
      { x: head.x, y: head.y },
      t < 0.55 ? 0 : (t - 0.55) / 0.45,
    );
    const p = t < 0.55 ? point : secondPoint;
    const radius = 6 + Math.sin(t * Math.PI) * 3.5;
    const markClass = item % 2 ? "snake-pattern light" : "snake-pattern dark";
    return `
      <g class="${markClass}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle})">
        <path d="M0,-${radius.toFixed(1)} L${(radius * 0.88).toFixed(1)},0 L0,${radius.toFixed(1)} L-${(radius * 0.88).toFixed(1)},0Z"></path>
      </g>
    `;
  }).join("");
  return `
    <g class="snake-art" style="--snake-color: ${color}">
      <path class="snake-body-shadow" d="${bodyPath}"></path>
      <path class="snake-body-outline" d="${bodyPath}"></path>
      <path class="snake-body" d="${bodyPath}"></path>
      <path class="snake-body-highlight" d="${bodyPath}"></path>
      ${scaleMarks}
      <path class="snake-belly" d="${bodyPath}"></path>
      <path class="snake-tail" d="M${tail.x} ${tail.y} l${(-Math.cos(radians) * 22).toFixed(1)} ${(-Math.sin(radians) * 22).toFixed(1)}"></path>
      <g class="snake-face" transform="translate(${head.x} ${head.y}) rotate(${angle})">
        <path class="snake-head" d="M-14,-24 C6,-34 36,-24 42,-4 C49,20 18,32 -10,23 C0,12 0,-12 -14,-24Z"></path>
        <path class="snake-snout" d="M18,-13 C34,-11 42,-5 42,2 C41,10 31,14 17,13 C24,5 24,-5 18,-13Z"></path>
        <path class="snake-smile" d="M22,8 C29,13 36,10 40,4"></path>
        <circle class="eye" cx="12" cy="-13" r="7.2"></circle>
        <circle class="eye" cx="12" cy="9" r="7.2"></circle>
        <circle class="pupil" cx="14.4" cy="-12" r="2.7"></circle>
        <circle class="pupil" cx="14.4" cy="10" r="2.7"></circle>
        <circle class="eye-shine" cx="10.5" cy="-15.5" r="1.8"></circle>
        <circle class="eye-shine" cx="10.5" cy="7.5" r="1.8"></circle>
        <circle class="nostril" cx="33" cy="-4" r="1.8"></circle>
        <circle class="nostril" cx="33" cy="5" r="1.8"></circle>
      </g>
      <path class="snake-tongue" d="M${head.x + Math.cos(radians) * 32} ${head.y + Math.sin(radians) * 32} L${tongueX.toFixed(1)} ${tongueY.toFixed(1)} m0 0 l10 -7 m-10 7 l10 7"></path>
    </g>
  `;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const mt = 1 - clamped;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * clamped * p1.x + 3 * mt * clamped ** 2 * p2.x + clamped ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * clamped * p1.y + 3 * mt * clamped ** 2 * p2.y + clamped ** 3 * p3.y,
  };
}

function renderSearchResults(results) {
  searchResults.innerHTML = "";
  if (!results.length) {
    searchStatus.textContent = "No videos found here. Try a different search or open YouTube.";
    return;
  }
  searchStatus.textContent = `${results.length} videos found. Tap Play and everyone hears it.`;
  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <img alt="" loading="lazy">
      <div><h4></h4><p>youtube.com/watch</p></div>
      <div class="result-actions">
        <button type="button" class="primary-button load-btn">Play now</button>
        <button type="button" class="secondary-button queue-btn">Add next</button>
      </div>
    `;
    card.querySelector("img").src = result.thumbnail;
    card.querySelector("h4").textContent = result.title;
    card.querySelector("p").textContent = "Tap Play now. If YouTube blocks embed, choose another result.";
    card.querySelector(".load-btn").addEventListener("click", () => loadVideoForRoom(result.videoId, result.title));
    card.querySelector(".queue-btn").addEventListener("click", () => addQueueItem(result));
    searchResults.appendChild(card);
  });
}

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function diceFace(value) {
  return ["🎲", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value || 0];
}

function applySnapshot(room, force = false) {
  if (!state.playerReady || !room.videoId) return;
  const desired = currentDesiredPosition(room);
  const currentVideo = state.player.getVideoData?.().video_id;
  const currentTime = state.player.getCurrentTime?.() || 0;
  const needsLoad = force || currentVideo !== room.videoId;
  const needsSeek = force || Math.abs(currentTime - desired) > 2.2;

  state.suppressPlayerEventsUntil = Date.now() + 1200;
  if (needsLoad) {
    state.player.loadVideoById(room.videoId, desired);
    if (room.status !== "playing") state.player.pauseVideo();
  } else if (needsSeek) {
    state.player.seekTo(desired, true);
  }

  if (room.status === "playing") state.player.playVideo();
  else state.player.pauseVideo();
  applyDjConsole();
  renderStatus(room);
}

function currentDesiredPosition(room) {
  if (room.status !== "playing") return room.position || 0;
  return (room.position || 0) + Math.max(0, Date.now() - room.updatedAt) / 1000;
}

function renderStatus(room) {
  const word = room.status === "playing" ? "Playing" : "Paused";
  statusText.textContent = `${word} at ${formatTime(currentDesiredPosition(room))}`;
}

function renderDjConsole() {
  bassBoostInput.value = state.mix.bass;
  volumeInput.value = state.mix.volume;
  bassBoostValue.textContent = `${state.mix.bass}`;
  volumeValue.textContent = state.mix.volume >= 100 ? "100% MAX" : `${state.mix.volume}%`;
  const playerMode = !state.playerReady ? "Player loading" : state.room?.videoId ? "Live mix" : "Load video";
  mixQualityLabel.textContent = state.mix.volume > 92 ? "Max volume" : state.mix.bass > 70 ? "Bass boosted" : playerMode;
  document.documentElement.style.setProperty("--bass-level", `${state.mix.bass}%`);
  document.documentElement.style.setProperty("--volume-level", `${state.mix.volume}%`);
}

function applyDjConsole() {
  if (!state.playerReady || !state.player) return;
  const volume = clamp(state.mix.volume, 0, 100);
  state.mix.volume = volume;
  try {
    if (volume > 0) state.player.unMute?.();
    state.player.setVolume?.(volume);
    if (volume === 0) state.player.mute?.();
  } catch {
    // YouTube can reject volume changes before a video is fully ready.
  }
}

function applyRoomMix(mix, fromRoomRender = false) {
  if (!mix || (fromRoomRender && Date.now() < state.localMixUntil)) return;
  state.mix = {
    bass: clamp(Number(mix.bass), 0, 100),
    volume: clamp(Number(mix.volume), 0, 100),
  };
  renderDjConsole();
  applyDjConsole();
}

function scheduleMixSync() {
  clearTimeout(state.mixSyncTimer);
  state.mixSyncTimer = setTimeout(syncMixNow, 350);
}

async function syncMixNow() {
  if (!state.user || !state.room) return;
  clearTimeout(state.mixSyncTimer);
  try {
    const data = await api("/api/mix", { ...authBody(), ...state.mix });
    if (data.room) {
      state.room = data.room;
      renderRoom(data.room);
    }
  } catch {
    mixQualityLabel.textContent = "Sync paused";
  }
}

function clamp(value, min, max) {
  const number = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, number));
}

function burstReaction(emoji) {
  const item = document.createElement("span");
  item.className = "float-reaction";
  item.textContent = emoji;
  item.style.left = `${16 + Math.random() * 68}%`;
  reactionLayer.appendChild(item);
  setTimeout(() => item.remove(), 1600);
}

function appendChat(name, text, avatar = "🎧") {
  const item = document.createElement("div");
  item.className = "chat-message";
  item.innerHTML = `<span class="chat-avatar"></span><div><strong></strong><span class="chat-text"></span></div>`;
  item.querySelector(".chat-avatar").textContent = avatar;
  item.querySelector("strong").textContent = name;
  item.querySelector(".chat-text").textContent = text;
  chatLog.appendChild(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function appendSystem(message) {
  const item = document.createElement("div");
  item.className = "system-message";
  item.textContent = message;
  chatLog.appendChild(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function api(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

async function apiGet(path) {
  const response = await fetch(path);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function authBody() {
  return { roomId: state.room.roomId, userId: state.user.id, sessionToken: state.user.sessionToken || "" };
}

function extractVideoId(value) {
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.has("v")) return url.searchParams.get("v");
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    return "";
  }
  return "";
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function describeControl(action) {
  if (action === "load") return "loaded a new video";
  if (action === "play") return "pressed play";
  if (action === "pause") return "paused";
  if (action === "seek") return "synced playback";
  return "updated playback";
}
