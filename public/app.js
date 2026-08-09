const state = {
  user: null,
  room: null,
  player: null,
  playerReady: false,
  playerFallbackMode: false,
  playerInitStarted: false,
  playerLoadFallbackShown: false,
  nativeRoomTab: "watch",
  lastSeq: 0,
  suppressPlayerEventsUntil: 0,
  pollTimer: null,
  wasDisconnected: false,
  selectedAvatar: "🎧",
  lastTypingAt: 0,
  activeGame: "ludo",
  ludo: {
    status: "waiting",
    players: [],
    colors: ["red"],
    ready: {},
    turn: 0,
    turnNumber: 1,
    pawns: Array.from({ length: 4 }, () => [-1, -1, -1, -1]),
    pendingRoll: null,
    winner: null,
    lastRoll: null,
    message: "Press Ready. Host starts Ludo when 1-4 players are ready.",
  },
  snakes: { turn: 0, positions: [1, 1, 1, 1], winner: null, lastRoll: null },
  mix: { bass: 40, volume: 85 },
  mixSyncTimer: null,
  localMixUntil: 0,
  auth: null,
  authMode: "login",
  pendingAuthEmail: "",
  pendingAccountName: "",
  profile: null,
  nicknameTimer: null,
  nicknameAvailable: false,
  pendingImage: null,
  speechRecognition: null,
  listening: false,
  config: {},
  installPrompt: null,
};

const API_ORIGIN = "https://youtube-watch-party-8com.onrender.com";
const isNativeRuntime = () =>
  location.protocol === "capacitor:" ||
  location.protocol === "ionic:" ||
  Boolean(window.Capacitor?.isNativePlatform?.());
const apiUrl = (path) => (isNativeRuntime() && path.startsWith("/api/") ? `${API_ORIGIN}${path}` : path);

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
const authChoiceButtons = Array.from(document.querySelectorAll(".auth-choice button"));
const authEmailInput = $("#authEmailInput");
const createAccountFields = $("#createAccountFields");
const accountNameInput = $("#accountNameInput");
const dobInput = $("#dobInput");
const ageGateText = $("#ageGateText");
const stayLoggedInInput = $("#stayLoggedInInput");
const emailError = $("#emailError");
const otpForm = $("#otpForm");
const otpHelpText = $("#otpHelpText");
const otpDigits = Array.from(document.querySelectorAll(".otp-digit"));
const otpError = $("#otpError");
const resendOtpBtn = $("#resendOtpBtn");
const changeEmailBtn = $("#changeEmailBtn");
const backToWelcomeBtn = $("#backToWelcomeBtn");
const profileForm = $("#profileForm");
const nicknameInput = $("#nicknameInput");
const nicknameStatus = $("#nicknameStatus");
const displayNameInput = $("#displayNameInput");
const profileError = $("#profileError");
const profilePreviewAvatar = $("#profilePreviewAvatar");
const profilePreviewNickname = $("#profilePreviewNickname");
const profilePreviewName = $("#profilePreviewName");
const profilePreviewStatus = $("#profilePreviewStatus");
const homeAvatar = $("#homeAvatar");
const homeNickname = $("#homeNickname");
const installAppBtn = $("#installAppBtn");
const enableNotificationsBtn = $("#enableNotificationsBtn");
const logoutBtn = $("#logoutBtn");
const logoutAllBtn = $("#logoutAllBtn");
const joinForm = $("#joinForm");
const createRoomBtn = $("#createRoomBtn");
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
const roomFriendList = $("#roomFriendList");
const friendList = $("#friendList");
const friendInviteList = $("#friendInviteList");
const friendRequestList = $("#friendRequestList");
const friendCount = $("#friendCount");
const friendInviteCount = $("#friendInviteCount");
const friendRequestCount = $("#friendRequestCount");
const profileSummary = $("#profileSummary");
const profilePrivacyBtn = $("#profilePrivacyBtn");
const profileNotificationsBtn = $("#profileNotificationsBtn");
const queueList = $("#queueList");
const playQueueBtn = $("#playQueueBtn");
const promptText = $("#promptText");
const newPromptBtn = $("#newPromptBtn");
const ludoGame = $("#ludoGame");
const ludoBoard = $("#ludoBoard");
const ludoStatus = $("#ludoStatus");
const ludoDice = $("#ludoDice");
const ludoRollBtn = $("#ludoRollBtn");
const ludoResetBtn = $("#ludoResetBtn");
const ludoTurnBadge = $("#ludoTurnBadge");
const ludoReadyBtn = $("#ludoReadyBtn");
const ludoStartBtn = $("#ludoStartBtn");
const ludoReadyText = $("#ludoReadyText");
const snakesGame = $("#snakesGame");
const snakesBoard = $("#snakesBoard");
const snakesStatus = $("#snakesStatus");
const snakesDice = $("#snakesDice");
const snakesRollBtn = $("#snakesRollBtn");
const snakesResetBtn = $("#snakesResetBtn");
const turnBadge = $("#turnBadge");
const historyList = $("#historyList");
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const photoInput = $("#photoInput");
const attachPhotoBtn = $("#attachPhotoBtn");
const micBtn = $("#micBtn");
const attachmentPreview = $("#attachmentPreview");
const typingText = $("#typingText");
const playerOverlay = $("#playerOverlay");
const reactionLayer = $("#reactionLayer");
const subscribeLink = $("#subscribeLink");

const adultDate = new Date();
adultDate.setFullYear(adultDate.getFullYear() - 18);
if (dobInput) dobInput.max = adultDate.toISOString().slice(0, 10);
const toastDock = $("#toastDock");
const roomSharePreview = $("#roomSharePreview");
const sharePreviewTitle = $("#sharePreviewTitle");
const sharePreviewText = $("#sharePreviewText");
const copyInviteBtn = $("#copyInviteBtn");
const installRoomAppBtn = $("#installRoomAppBtn");
const hostControls = $("#hostControls");
const toggleRoomLockBtn = $("#toggleRoomLockBtn");
const hostControlText = $("#hostControlText");
const bottomNav = $("#bottomNav");
const mainStack = $(".main-stack");
const playerPanel = $(".player-panel");

const themeNames = {
  "late-night": "🌙 Late Night",
  "study-lofi": "📚 Study Lofi",
  party: "Room",
  movie: "🍿 Movie",
  heartbreak: "💔 Heartbreak",
  anime: "✨ Anime",
};

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

setupAppShellMode();
registerAppUpdater();
restoreAuthSession();
loadAppConfig();
renderDjConsole();
renderInstallButtons();

refreshRoomsBtn?.addEventListener("click", loadPublicRooms);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  renderInstallButtons();
});

window.addEventListener("appinstalled", () => {
  state.installPrompt = null;
  showToast("App installed", "Zynlivo is now on your home screen.", "system");
  renderInstallButtons();
});

continueEmailBtn?.addEventListener("click", () => showAuthStep("email"));
loginEmailBtn?.addEventListener("click", () => showAuthStep("email"));
backToWelcomeBtn?.addEventListener("click", () => showAuthStep("email"));

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
  if (state.authMode === "create") {
    const name = accountNameInput?.value.trim() || "";
    if (name.length < 2) {
      emailError.textContent = "Enter your name to create an account.";
      accountNameInput?.focus();
      return;
    }
    const age = calculateAge(dobInput?.value || "");
    if (age === null) {
      emailError.textContent = "Enter your date of birth to confirm you are 18+.";
      dobInput?.focus();
      return;
    }
    if (age < 18) {
      emailError.textContent = "You must be 18 or older to create an account.";
      dobInput?.focus();
      return;
    }
    state.pendingAccountName = name;
  } else {
    state.pendingAccountName = "";
  }
  try {
    await requestEmailOtp(email);
  } catch (error) {
    emailError.textContent = friendlyAuthError(error.message);
  }
});

otpForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  otpError.textContent = "";
  const otp = otpDigits.map((input) => input.value.trim()).join("");
  if (!/^\d{6}$/.test(otp)) {
    otpError.textContent = "Enter the six-digit OTP.";
    return;
  }
  try {
    const data = await api("/api/auth/verify-otp", { email: state.pendingAuthEmail, otp });
    setAuthSession(data.sessionToken, data.account, stayLoggedInInput?.checked !== false);
    clearOtpInputs();
    if (!data.account.profileComplete && state.pendingAccountName && nicknameInput) {
      nicknameInput.value = state.pendingAccountName;
      renderProfilePreview();
    }
    if (data.account.profileComplete) showHome();
    else showAuthStep("profile");
  } catch (error) {
    otpError.textContent = friendlyAuthError(error.message);
  }
});

resendOtpBtn?.addEventListener("click", async () => {
  otpError.textContent = "";
  try {
    await requestEmailOtp(state.pendingAuthEmail || authEmailInput.value.trim(), true);
  } catch (error) {
    otpError.textContent = friendlyAuthError(error.message);
  }
});

changeEmailBtn?.addEventListener("click", () => {
  clearOtpInputs();
  showAuthStep("email");
  authEmailInput.focus();
});

otpDigits.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 1);
    if (input.value && otpDigits[index + 1]) otpDigits[index + 1].focus();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && otpDigits[index - 1]) otpDigits[index - 1].focus();
  });
  input.addEventListener("paste", (event) => {
    const digits = event.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, 6) || "";
    if (digits.length < 2) return;
    event.preventDefault();
    digits.split("").forEach((digit, offset) => {
      if (otpDigits[offset]) otpDigits[offset].value = digit;
    });
    otpDigits[Math.min(digits.length, 6) - 1]?.focus();
  });
});

nicknameInput?.addEventListener("input", () => {
  clearTimeout(state.nicknameTimer);
  const nickname = nicknameInput.value.trim();
  const localError = validateNicknameText(nickname);
  if (localError) {
    nicknameStatus.textContent = localError;
    nicknameStatus.className = "field-status danger";
    return;
  }
  nicknameStatus.textContent = "This name will show in chat, games, and room members.";
  nicknameStatus.className = "field-status success";
  renderProfilePreview();
});

[displayNameInput].forEach((input) => {
  input?.addEventListener("input", renderProfilePreview);
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileError.textContent = "";
  try {
    const data = await api("/api/profile", {
      sessionToken: state.auth?.sessionToken,
      nickname: nicknameInput.value.trim(),
      displayName: nicknameInput.value.trim(),
      avatar: state.selectedAvatar,
      status: "Ready",
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

logoutAllBtn?.addEventListener("click", () => logoutBtn?.click());

enableNotificationsBtn?.addEventListener("click", enableNotifications);
installAppBtn?.addEventListener("click", installApp);
installRoomAppBtn?.addEventListener("click", installApp);

joinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  joinError.textContent = "";
  const params = new URLSearchParams(location.search);
  const roomId = roomInput.value.trim() || params.get("room") || "";
  try {
    if (!state.auth?.sessionToken) throw new Error("Please log in first.");
    if (!roomId) throw new Error("Enter a room code or tap Create Room.");
    const data = await api("/api/join", { authSessionToken: state.auth.sessionToken, roomId, action: "join" });
    enterRoom(data);
  } catch (error) {
    joinError.textContent = error.message;
  }
});

createRoomBtn?.addEventListener("click", async () => {
  joinError.textContent = "";
  try {
    if (!state.auth?.sessionToken) throw new Error("Please log in first.");
    const data = await api("/api/join", { authSessionToken: state.auth.sessionToken, action: "create" });
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
  if (!state.playerReady) {
    if (state.room?.videoId) {
      renderYouTubeIframeFallback(state.room.videoId, currentDesiredPosition(state.room), true);
      sendControl("play", currentDesiredPosition(state.room));
    }
    return;
  }
  applyDjConsole();
  state.player.playVideo?.();
  sendControl("play", state.player.getCurrentTime());
});

pauseBtn.addEventListener("click", () => {
  if (!state.playerReady) {
    if (state.room?.videoId) sendControl("pause", currentDesiredPosition(state.room));
    return;
  }
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

copyInviteBtn?.addEventListener("click", async () => {
  if (!state.room) return;
  const host = state.room.users.find((user) => user.id === state.room.hostId);
  const text = `${host?.name || "A friend"} invited you to Zynlivo room ${state.room.roomId}: ${location.origin}${location.pathname}?room=${encodeURIComponent(state.room.roomId)}`;
  await navigator.clipboard.writeText(text);
  copyInviteBtn.textContent = "Invite copied";
  setTimeout(() => {
    copyInviteBtn.textContent = "Copy invite";
  }, 1400);
});

toggleRoomLockBtn?.addEventListener("click", async () => {
  if (!state.room) return;
  try {
    const data = await api("/api/host/lock", { ...authBody(), locked: !state.room.locked });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    appendSystem(error.message);
  }
});

bottomNav?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scroll-target]");
  if (!button) return;
  if (isAppLikeRoomLayout() && button.dataset.nativeTab) {
    setNativeRoomTab(button.dataset.nativeTab);
    return;
  }
  document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

claimHostBtn.addEventListener("click", async () => {
  try {
    const data = await api("/api/host/claim", authBody());
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    appendSystem(error.message);
  }
});

leaveBtn.addEventListener("click", async () => {
  if (state.room && state.user) await api("/api/leave", authBody()).catch(() => {});
  state.room = null;
  state.user = null;
  clearTimeout(state.pollTimer);
  history.replaceState(null, "", location.pathname);
  bottomNav?.classList.add("hidden");
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
  if (!text && !state.pendingImage) return;
  chatInput.value = "";
  const image = state.pendingImage;
  clearAttachmentPreview();
  await api("/api/chat", { ...authBody(), text, image });
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

attachPhotoBtn?.addEventListener("click", () => {
  photoInput?.click();
});

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  photoInput.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    appendSystem("Only photos/images can be attached. PDFs and files are blocked.");
    return;
  }
  if (file.size > 2_500_000) {
    appendSystem("Photo is too large. Please choose an image under 2.5 MB.");
    return;
  }
  try {
    const dataUrl = await fileToDataUrl(file);
    state.pendingImage = {
      name: file.name.slice(0, 80),
      type: file.type,
      data: dataUrl,
    };
    renderAttachmentPreview();
  } catch {
    appendSystem("Could not attach that image. Try another photo.");
  }
});

micBtn?.addEventListener("click", () => {
  toggleSpeechInput();
});

document.querySelectorAll("[data-profile-option]").forEach((button) => {
  button.addEventListener("click", () => showFriendSection(button.dataset.profileOption));
});

profilePrivacyBtn?.addEventListener("click", () => {
  showToast("Privacy", "Only accepted friends can see online alerts or direct invites. One-time watchers cannot see your history.", "system");
});

profileNotificationsBtn?.addEventListener("click", () => {
  enableNotifications();
});

authChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    authChoiceButtons.forEach((choice) => choice.classList.toggle("selected", choice === button));
    const isCreate = button.textContent.trim().toLowerCase().includes("create");
    state.authMode = isCreate ? "create" : "login";
    const heading = emailForm?.querySelector("h2");
    const copy = emailForm?.querySelector(".muted-copy");
    const submit = emailForm?.querySelector("button[type='submit']");
    createAccountFields?.classList.toggle("hidden", !isCreate);
    if (accountNameInput) accountNameInput.required = isCreate;
    if (dobInput) dobInput.required = isCreate;
    if (emailError) emailError.textContent = "";
    if (heading) heading.textContent = isCreate ? "Create account" : "Login";
    if (copy) {
      copy.textContent = isCreate
        ? "Add your details and verify your email with a secure OTP."
        : "Enter your email and we will send a six-digit OTP.";
    }
    if (submit) submit.textContent = isCreate ? "Create account" : "Send login code";
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

snakesRollBtn.addEventListener("click", async () => {
  await rollRoomGame("snakes", snakesStatus);
});

snakesDice?.addEventListener("click", async () => {
  if (!snakesRollBtn.disabled) await rollRoomGame("snakes", snakesStatus);
});

ludoRollBtn.addEventListener("click", async () => {
  if (state.ludo.pendingRoll?.playerId === state.user?.id) {
    ludoStatus.textContent = "Tap one of the glowing pawns on the board to move.";
    ludoBoard?.classList.add("selecting-pawn");
    setTimeout(() => ludoBoard?.classList.remove("selecting-pawn"), 900);
    return;
  }
  await rollRoomGame("ludo", ludoStatus);
});

ludoDice?.addEventListener("click", async () => {
  if (!ludoRollBtn.disabled) await rollRoomGame("ludo", ludoStatus);
});

ludoReadyBtn?.addEventListener("click", async () => {
  await ludoReady();
});

ludoStartBtn?.addEventListener("click", async () => {
  await ludoStart();
});

snakesResetBtn.addEventListener("click", async () => {
  if (!confirm("Reset this Snake & Ladder round?")) return;
  await resetRoomGame("snakes", snakesStatus);
});

ludoResetBtn.addEventListener("click", async () => {
  if (!confirm("Reset this Ludo round?")) return;
  await resetRoomGame("ludo", ludoStatus);
});

function showAuthStep(step) {
  document.body.classList.add("app-ready");
  joinView.classList.remove("hidden");
  homeView.classList.add("hidden");
  partyView.classList.add("hidden");
  setAppView("login");
  [authWelcome, emailForm, otpForm, profileForm].forEach((element) => element?.classList.add("hidden"));
  if (step === "email") emailForm.classList.remove("hidden");
  else if (step === "otp") otpForm.classList.remove("hidden");
  else if (step === "profile") profileForm.classList.remove("hidden");
  else emailForm.classList.remove("hidden");
}

async function requestEmailOtp(email, isResend = false) {
  const cleanEmail = email.trim();
  if (!cleanEmail) throw new Error("Enter your email address.");
  const data = await api("/api/auth/request-otp", { email: cleanEmail });
  state.pendingAuthEmail = cleanEmail;
  if (otpHelpText) otpHelpText.textContent = `Enter the six-digit code sent to ${cleanEmail}.`;
  clearOtpInputs();
  showAuthStep("otp");
  otpDigits[0]?.focus();
  showToast(isResend ? "OTP resent" : "OTP sent", data.message || "Check your email for the six-digit code.", "system");
}

function clearOtpInputs() {
  otpDigits.forEach((input) => {
    input.value = "";
  });
}

function calculateAge(dateValue) {
  if (!dateValue) return null;
  const dob = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function friendlyAuthError(message = "") {
  if (/too many otp|too many/i.test(message)) return "Too many OTP requests. Please wait one minute, then try again.";
  return message || "Something went wrong. Please try again.";
}

function showHome() {
  document.body.classList.add("app-ready");
  hydrateHomeProfile();
  joinView.classList.add("hidden");
  partyView.classList.add("hidden");
  homeView.classList.remove("hidden");
  bottomNav?.classList.add("hidden");
  setAppView("home");
  renderInstallButtons();
  const params = new URLSearchParams(location.search);
  if (params.get("room")) roomInput.value = params.get("room");
  refreshFriends();
}

function enterRoom(data) {
  document.body.classList.add("app-ready");
  state.user = data.user;
  state.room = data.room;
  state.lastSeq = data.room.seq;
  history.replaceState(null, "", `?room=${encodeURIComponent(data.room.roomId)}`);
  joinView.classList.add("hidden");
  homeView.classList.add("hidden");
  partyView.classList.remove("hidden");
  bottomNav?.classList.remove("hidden");
  setAppView("room");
  arrangeNativeRoomLayout();
  setNativeRoomTab("watch");
  renderRoom(data.room);
  renderInstallButtons();
  applySnapshot(data.room);
  clearTimeout(state.pollTimer);
  pollEvents();
}

function setupAppShellMode() {
  const isNative = Boolean(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.getPlatform?.() === "ios" || window.Capacitor?.getPlatform?.() === "android");
  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
  const isMobileViewport = window.matchMedia?.("(max-width: 760px)")?.matches || window.innerWidth <= 760;
  const appLike = Boolean(isNative || isStandalone || isMobileViewport);
  document.body.classList.toggle("app-native", appLike);
  document.body.classList.toggle("app-browser", !appLike);
  setAppView(currentAppView());
  arrangeNativeRoomLayout();
}

window.addEventListener("resize", () => {
  setupAppShellMode();
  if (state.room) setNativeRoomTab(state.nativeRoomTab);
});

function setAppView(view) {
  document.body.classList.toggle("view-login", view === "login");
  document.body.classList.toggle("view-home", view === "home");
  document.body.classList.toggle("view-room", view === "room");
}

function currentAppView() {
  if (partyView && !partyView.classList.contains("hidden")) return "room";
  if (homeView && !homeView.classList.contains("hidden")) return "home";
  return "login";
}

function arrangeNativeRoomLayout() {
  if (!document.body.classList.contains("app-native") || !mainStack || !playerPanel || !chatLog) return;
  const chatCard = chatLog.closest(".chat-card");
  if (!chatCard || chatCard.parentElement === mainStack) return;
  mainStack.insertBefore(chatCard, playerPanel.nextElementSibling);
  chatCard.classList.add("native-room-chat");
}

function setNativeRoomTab(tab) {
  state.nativeRoomTab = ["watch", "chat", "play", "squad"].includes(tab) ? tab : "watch";
  document.body.dataset.nativeTab = state.nativeRoomTab;
  bottomNav?.querySelectorAll("[data-native-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.nativeTab === state.nativeRoomTab);
  });
  if (isAppLikeRoomLayout()) window.scrollTo({ top: 0, behavior: "smooth" });
}

function isAppLikeRoomLayout() {
  return document.body.classList.contains("app-native") || (window.matchMedia?.("(max-width: 760px)")?.matches ?? false);
}

async function installApp() {
  if (isStandaloneApp()) {
    showToast("Already installed", "You are using the app view.", "system");
    return;
  }
  if (state.installPrompt) {
    const prompt = state.installPrompt;
    state.installPrompt = null;
    prompt.prompt();
    await prompt.userChoice.catch(() => null);
    renderInstallButtons();
    return;
  }
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  showToast(
    "Install Zynlivo",
    isiOS ? "Tap Share, then Add to Home Screen." : "Use your browser menu and tap Install app.",
    "system",
  );
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function renderInstallButtons() {
  const installed = isStandaloneApp();
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const show = !installed && (state.installPrompt || isiOS);
  [installAppBtn, installRoomAppBtn].forEach((button) => {
    if (!button) return;
    button.classList.toggle("hidden", !show);
    button.textContent = isiOS && !state.installPrompt ? "Add to Home" : "Install app";
  });
}

function setAuthSession(sessionToken, account, persist = true) {
  state.auth = { sessionToken };
  state.profile = account;
  if (persist) localStorage.setItem("watchPartySession", sessionToken);
  else localStorage.removeItem("watchPartySession");
  hydrateHomeProfile();
}

function hydrateHomeProfile() {
  const profile = state.profile || {};
  homeAvatar.textContent = profile.avatar || "🎧";
  homeNickname.textContent = profile.nickname ? `@${profile.nickname}` : "@profile";
  const onlineFriends = (profile.friends || []).filter((friend) => friend.online).length;
  if (profileSummary) {
    profileSummary.textContent = `${profile.nickname || "Your profile"} · friends only online alerts · ${onlineFriends} friend${onlineFriends === 1 ? "" : "s"} online`;
  }
  if (nameInput) nameInput.value = profile.displayName || profile.nickname || "";
  if (emailInput) emailInput.value = profile.email || "";
  if (vibeInput) vibeInput.value = "Ready";
  if (profile.avatar && avatarPicker) {
    state.selectedAvatar = profile.avatar;
    avatarPicker.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("selected", button.dataset.avatar === profile.avatar);
    });
  }
  renderHomeFriends();
}

function renderHomeFriends() {
  if (!friendList || !friendInviteList) return;
  const profile = state.profile || {};
  const invites = profile.roomInvites || [];
  const requests = profile.friendRequests || [];
  const friends = profile.friends || [];
  if (friendInviteCount) friendInviteCount.textContent = `${invites.length} invite${invites.length === 1 ? "" : "s"}`;
  if (friendRequestCount) friendRequestCount.textContent = `${requests.length} pending`;
  if (friendCount) friendCount.textContent = `${friends.length} friend${friends.length === 1 ? "" : "s"}`;
  friendInviteList.innerHTML = "";
  if (!invites.length) {
    friendInviteList.innerHTML = `<div class="privacy-note">No room invites right now.</div>`;
    friendInviteList.classList.add("empty-note");
  } else {
    friendInviteList.classList.remove("empty-note");
    invites.slice().reverse().forEach((invite) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "friend-row";
      button.innerHTML = `<span>${invite.fromAvatar || "🎧"}</span><strong></strong><small></small>`;
      button.querySelector("strong").textContent = `${invite.fromName || "Friend"} invited you`;
      button.querySelector("small").textContent = `Join room ${invite.roomId}`;
      button.addEventListener("click", () => {
        roomInput.value = invite.roomId;
        roomInput.focus();
      });
      friendInviteList.appendChild(button);
    });
  }
  if (friendRequestList) {
    friendRequestList.innerHTML = "";
    if (!requests.length) {
      friendRequestList.innerHTML = `<div class="privacy-note">No friend requests right now.</div>`;
      friendRequestList.classList.add("empty-note");
    } else {
      friendRequestList.classList.remove("empty-note");
      requests.slice().reverse().forEach((request) => {
        const row = document.createElement("div");
        row.className = "friend-row request-row";
        row.innerHTML = `<span></span><strong></strong><div class="request-actions"><button type="button" class="secondary-button accept-btn">Accept</button><button type="button" class="ghost-button reject-btn">Reject</button></div>`;
        row.querySelector("span").textContent = request.fromAvatar || "🎧";
        row.querySelector("strong").textContent = `${request.fromName || "Someone"} wants to be friends`;
        row.querySelector(".accept-btn").addEventListener("click", () => respondFriendRequest(request.id, "accept"));
        row.querySelector(".reject-btn").addEventListener("click", () => respondFriendRequest(request.id, "reject"));
        friendRequestList.appendChild(row);
      });
    }
  }
  friendList.innerHTML = "";
  if (!friends.length) {
    friendList.innerHTML = `<div class="privacy-note">Add friends from inside a room. Only accepted friends can see online alerts.</div>`;
    friendList.classList.add("empty-note");
    return;
  }
  friendList.classList.remove("empty-note");
  friends.forEach((friend) => {
    const row = document.createElement("div");
    row.className = "friend-row";
    row.innerHTML = `<span></span><strong></strong><small></small>`;
    row.querySelector("span").textContent = friend.avatar || "🎧";
    row.querySelector("strong").textContent = friend.nickname || "Friend";
    row.querySelector("small").textContent = friend.online ? "Online now" : "Friend";
    friendList.appendChild(row);
  });
}

function showFriendSection(section) {
  const map = {
    invites: friendInviteList,
    requests: friendRequestList,
    friends: friendList,
  };
  Object.entries(map).forEach(([key, element]) => {
    element?.classList.toggle("hidden", key !== section);
  });
  document.querySelectorAll("[data-profile-option]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.profileOption === section);
  });
}

async function respondFriendRequest(requestId, action) {
  try {
    const data = await api("/api/friends/respond", { sessionToken: state.auth?.sessionToken, requestId, action });
    state.profile = data.account;
    hydrateHomeProfile();
    showToast(action === "accept" ? "Friend added" : "Request removed", "Your friends list is updated.", "system");
  } catch (error) {
    showToast("Friend request", error.message, "system");
  }
}

function renderProfilePreview() {
  if (!profilePreviewAvatar) return;
  const nickname = nicknameInput?.value.trim() || "Your name";
  const status = "Ready";
  profilePreviewAvatar.textContent = state.selectedAvatar || "🎧";
  profilePreviewNickname.textContent = nickname;
  profilePreviewName.textContent = "";
  profilePreviewStatus.textContent = status;
}

async function restoreAuthSession() {
  const params = new URLSearchParams(location.search);
  if (params.get("room")) roomInput.value = params.get("room");
  const token = localStorage.getItem("watchPartySession");
  if (!token) {
    showAuthStep("email");
    return;
  }
  try {
    const data = await apiGet(`/api/auth/session?token=${encodeURIComponent(token)}`);
    setAuthSession(token, data.account);
    if (data.account.profileComplete) showHome();
    else showAuthStep("profile");
  } catch {
    localStorage.removeItem("watchPartySession");
    showAuthStep("email");
  }
}

async function refreshFriends() {
  if (!state.auth?.sessionToken) return;
  try {
    const data = await api("/api/friends", { sessionToken: state.auth.sessionToken });
    state.profile = data.account;
    hydrateHomeProfile();
    renderHomeFriends();
  } catch {
    renderHomeFriends();
  }
}

function validateNicknameText(nickname) {
  if (nickname.length < 2) return "Name must be at least 2 characters.";
  if (nickname.length > 24) return "Name must be 24 characters or less.";
  if (!/^[A-Za-z0-9 ._-]+$/.test(nickname)) return "Use letters, numbers, spaces, dot, underscore, or hyphen.";
  return "";
}

async function loadAppConfig() {
  try {
    const response = await fetch(apiUrl("/api/config"));
    const config = await response.json();
    state.config = config;
    document.title = config.appName || document.title;
    if (config.paymentsEnabled && config.paymentLink) {
      subscribeLink.href = config.paymentLink;
      subscribeLink.classList.remove("hidden");
    }
    if (config.officialYoutubeSearch) {
      searchStatus.textContent = "Official YouTube search is active. Search or tap a mood to play for everyone.";
    }
    if (emailError && config.emailOtpReady === false) {
      emailError.textContent = "Local OTP is not configured yet. Add Resend/SMTP env vars, then restart the local server.";
    }
    if (enableNotificationsBtn) enableNotificationsBtn.textContent = config.pushNotificationsReady ? "Notify me" : "Local alerts";
  } catch {
    // The room still works without release config.
  }
}

async function registerAppUpdater() {
  if (!("serviceWorker" in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
          showToast("App updated", "Refreshing to the latest version.", "system");
        }
      });
    });
    registration.update?.().catch(() => null);
  } catch {
    // Local previews and some embedded browsers can block service workers.
  }
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Notifications", "This browser does not support notifications.", "system");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    showToast("Notifications", "Permission was not granted.", "system");
    return;
  }
  let subscription = null;
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("/sw.js");
      if (state.config?.vapidPublicKey && registration.pushManager) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(state.config.vapidPublicKey),
        });
        subscription = subscription.toJSON ? subscription.toJSON() : subscription;
      } else {
        subscription = { endpoint: `local:${location.origin}`, keys: {}, registeredAt: Date.now() };
      }
      registration.showNotification?.("Zynlivo notifications on", { body: "Chat, invites, and game turns can alert you.", tag: "watch-party-ready" });
    }
  } catch {
    // Browsers can block service workers in preview; normal in local testing.
  }
  try {
    const data = await api("/api/notifications/subscribe", { sessionToken: state.auth?.sessionToken, subscription });
    state.profile = data.account || state.profile;
    enableNotificationsBtn.textContent = data.pushReady ? "Notifications on" : "Local alerts on";
    showToast("Notifications on", data.pushReady ? "Push is ready." : "Local alerts are on. Add VAPID keys later for closed-app push.", "system");
  } catch (error) {
    showToast("Notifications", error.message, "system");
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function loadPublicRooms() {
  try {
    const response = await fetch(apiUrl("/api/rooms"));
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
  if (videoId && !blocked) renderYouTubeIframeFallback(videoId, currentDesiredPosition(state.room || {}), false);
  statusText.innerHTML = `${reason} <a href="${watchUrl}" target="_blank" rel="noreferrer">Watch on YouTube</a>`;
  searchStatus.innerHTML = `${reason} Pick another search result, or <a href="${watchUrl}" target="_blank" rel="noreferrer">open it on YouTube</a>.`;
  playerOverlay.classList.add("ready");
}

function showPlayerLoadFallback() {
  if (state.playerReady) return;
  state.playerLoadFallbackShown = true;
  const videoId = state.room?.videoId || "";
  if (!videoId) {
    playerOverlay.classList.remove("ready");
    playerOverlay.textContent = "Paste a YouTube link or search to load a video.";
    statusText.textContent = "No video loaded";
    return;
  }
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  renderYouTubeIframeFallback(videoId, currentDesiredPosition(state.room || {}), state.room?.status === "playing");
  playerOverlay.classList.add("ready");
  statusText.innerHTML = `Using mobile YouTube fallback. <a href="${watchUrl}" target="_blank" rel="noreferrer">Open in YouTube</a>`;
}

function renderYouTubeIframeFallback(videoId, start = 0, autoplay = false) {
  if (!videoId) return;
  state.playerFallbackMode = true;
  const safeStart = Math.max(0, Math.floor(start || 0));
  const params = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    start: String(safeStart),
    autoplay: autoplay ? "1" : "0",
  });
  const frame = document.createElement("iframe");
  frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}`;
  frame.title = "YouTube player";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  const playerMount = document.getElementById("player");
  if (!playerMount) return;
  playerMount.innerHTML = "";
  playerMount.appendChild(frame);
  playerOverlay.classList.add("ready");
}

async function loadVideoForRoom(videoId, title = "YouTube video") {
  if (state.playerReady && state.player) {
    state.suppressPlayerEventsUntil = Date.now() + 1200;
    if (state.player.cueVideoById) state.player.cueVideoById(videoId, 0);
    else {
      state.player.loadVideoById(videoId, 0);
      state.player.pauseVideo?.();
    }
  }
  await sendControl("load", 0, videoId, title);
  if (state.room) applySnapshot(state.room, { force: true, cueOnly: true });
  applyDjConsole();
  searchStatus.textContent = "Loaded for the room. Tap Play when everyone is ready.";
}

async function runMusicSearch(query) {
  if (!query) return;
  searchStatus.textContent = "Finding music...";
  searchResults.innerHTML = "";
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  if (youtubeSearchLink) youtubeSearchLink.href = searchUrl;
  try {
    const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Search service is loading the old build");
    }
    if (!response.ok) throw new Error(data.error || "Search failed");
    renderSearchResults(data.results || []);
  } catch (error) {
    const message = error?.message || "Search could not load here";
    searchStatus.textContent = `${message}. Try another search.`;
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

async function removeQueueItem(itemId) {
  try {
    const data = await api("/api/queue/remove", { ...authBody(), itemId });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    appendSystem(error.message);
  }
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
    const response = await fetch(apiUrl(`/api/events?${query}`));
    if (!response.ok) throw new Error("Disconnected");
    const data = await response.json();
    if (state.wasDisconnected) {
      state.wasDisconnected = false;
      appendSystem("Reconnected. Syncing room state.");
      playNotice("sync");
      if (data.snapshot) applySnapshot(data.snapshot, true);
    }
    state.room = data.snapshot;
    renderRoom(data.snapshot);
    data.events.forEach(handleEvent);
  } catch {
    if (!state.wasDisconnected) {
      state.wasDisconnected = true;
      appendSystem("Connection paused. Trying again...");
    }
  } finally {
    state.pollTimer = setTimeout(pollEvents, 900);
  }
}

function handleEvent(event) {
  state.lastSeq = Math.max(state.lastSeq, event.seq);
  if (event.type === "chat") {
    appendChat(event.payload.name, event.payload.text, event.payload.avatar, event.payload.image);
    if (event.payload.name && event.payload.userId !== state.user?.id) {
      showToast(`${event.payload.avatar || "💬"} ${event.payload.name}`, event.payload.text || "sent a photo", "chat");
      notifyBrowser(`${event.payload.name} in room ${state.room?.roomId || ""}`, event.payload.text || "sent a photo");
    }
    playNotice("chat");
  }
  if (event.type === "system") {
    showToast("Room update", event.payload.message, "system");
    notifyBrowser("Zynlivo", event.payload.message);
    playNotice("join");
  }
  if (event.type === "queue") showToast("Queue", event.payload.message, "system");
  if (event.type === "theme") showToast("Theme", `${event.payload.emoji} ${event.payload.by} switched to ${event.payload.name}.`, "system");
  if (event.type === "prompt") showToast("Game", event.payload.text, "system");
  if (event.type === "reaction") {
    burstReaction(event.payload.emoji);
    playNotice("reaction");
  }
  if (event.type === "mix") {
    applyRoomMix(event.payload.mix);
    if (event.payload.userId !== state.user.id) showToast("Sound", `${event.payload.name} changed bass/volume.`, "system");
  }
  if (event.type === "game") {
    if (event.payload.snapshot) applyGameSnapshot(event.payload.snapshot);
    showToast("Game", event.payload.message || "Game updated.", "system");
    playGameNotice(event.payload.message || "");
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
    playNotice(payload.action === "load" ? "load" : "sync");
    if (payload.userId !== state.user.id) showToast("Playback", `${payload.name} ${describeControl(payload.action)}.`, "system");
  }
}

function notifyBrowser(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  try {
    navigator.serviceWorker?.ready
      ?.then((registration) => registration.showNotification(title, { body, tag: "watch-party" }))
      .catch(() => new Notification(title, { body }));
  } catch {
    // Notification delivery is best effort.
  }
}

function playGameNotice(message) {
  const lower = message.toLowerCase();
  if (lower.includes("won")) playNotice("win");
  else if (lower.includes("climbed")) playNotice("ladder");
  else if (lower.includes("slid")) playNotice("snake");
  else playNotice("dice");
}

function playNotice(kind) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    const tones = {
      chat: 740,
      join: 660,
      reaction: 780,
      dice: 440,
      ladder: 880,
      snake: 220,
      win: 990,
      load: 620,
      sync: 360,
    };
    const secondTone = kind === "chat" ? 930 : 0;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === "chat" ? 0.032 : 0.045, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "chat" ? 0.11 : 0.18));
    gain.connect(ctx.destination);
    [tones[kind] || 480, secondTone].filter(Boolean).forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.type = kind === "snake" ? "sawtooth" : "sine";
      oscillator.connect(gain);
      oscillator.start(ctx.currentTime + index * 0.075);
      oscillator.stop(ctx.currentTime + index * 0.075 + 0.12);
    });
    setTimeout(() => ctx.close?.(), 320);
  } catch {
    // Sound is optional; browsers can block audio before user interaction.
  }
}

function showToast(title, message, kind = "system") {
  if (!toastDock) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${kind}`;
  toast.innerHTML = `<strong></strong><span></span>`;
  toast.querySelector("strong").textContent = title;
  toast.querySelector("span").textContent = String(message || "").slice(0, 90);
  toastDock.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

function renderRoom(room) {
  if (room.mix) applyRoomMix(room.mix, true);
  roomCode.textContent = room.roomId;
  peopleCount.textContent = `${room.users.length}/5`;
  const host = room.users.find((user) => user.id === room.hostId);
  roomMeta.textContent = `Host: ${host?.name || "Open"}`;
  if (sharePreviewTitle) sharePreviewTitle.textContent = `Room ${room.roomId}`;
  if (sharePreviewText) sharePreviewText.textContent = `${host?.name || "Host"} · ${room.users.length}/5 people · ${room.locked ? "Locked" : "Open"} private room`;
  if (claimHostBtn) {
    const isHost = room.hostId === state.user?.id;
    claimHostBtn.textContent = !room.hostId ? "Become host" : isHost ? "You are host" : "Host locked";
    claimHostBtn.disabled = Boolean(room.hostId && !isHost);
  }
  const isHost = room.hostId === state.user?.id;
  hostControls?.classList.toggle("hidden", !isHost);
  if (toggleRoomLockBtn) toggleRoomLockBtn.textContent = room.locked ? "Unlock room" : "Lock room";
  if (hostControlText) hostControlText.textContent = room.locked ? "Only current members can stay." : "New joins are allowed.";
  document.body.classList.remove("theme-late-night", "theme-study-lofi", "theme-party", "theme-movie", "theme-heartbreak", "theme-anime");
  document.body.classList.add(`theme-${room.theme || "party"}`);
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
  const currentUserIsHost = room.hostId === state.user?.id;
  renderRoomFriends();
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
      <button type="button" class="friend-action-btn hidden">Add friend</button>
      <button type="button" class="host-transfer-btn hidden">Make host</button>
      <button type="button" class="remove-person-btn hidden">Remove</button>
    `;
    person.querySelector(".person-avatar").textContent = user.avatar || "🎧";
    person.querySelector(".person-name").textContent = `${user.id === room.hostId ? "Host · " : ""}${label}`;
    person.querySelector(".person-vibe").textContent = `${user.online ? "online" : "away"} · ${user.vibe || "Ready"}`;
    const transferBtn = person.querySelector(".host-transfer-btn");
    const friendBtn = person.querySelector(".friend-action-btn");
    const removeBtn = person.querySelector(".remove-person-btn");
    const isFriend = (state.profile?.friends || []).some((friend) => friend.accountId === user.accountId);
    if (user.id !== state.user?.id && !isFriend) {
      friendBtn.classList.remove("hidden");
      friendBtn.textContent = "Request";
      friendBtn.addEventListener("click", () => addFriend(user.id));
    }
    if (currentUserIsHost && user.id !== state.user?.id) {
      transferBtn.classList.remove("hidden");
      transferBtn.addEventListener("click", () => transferHost(user.id));
      removeBtn.classList.remove("hidden");
      removeBtn.addEventListener("click", () => removeFromRoom(user.id));
    }
    peopleList.appendChild(person);
  });
}

function renderRoomFriends() {
  if (!roomFriendList) return;
  const friends = state.profile?.friends || [];
  roomFriendList.innerHTML = "";
  if (!friends.length) {
    roomFriendList.textContent = "Add friends from this room, then invite them directly next time.";
    roomFriendList.classList.add("empty-note");
    return;
  }
  roomFriendList.classList.remove("empty-note");
  friends.forEach((friend) => {
    const row = document.createElement("div");
    row.className = "room-friend-row";
    row.innerHTML = `<span></span><strong></strong><button type="button" class="secondary-button">Invite</button>`;
    row.querySelector("span").textContent = friend.avatar || "🎧";
    row.querySelector("strong").textContent = friend.nickname || "Friend";
    row.querySelector("button").addEventListener("click", () => inviteFriend(friend.accountId));
    roomFriendList.appendChild(row);
  });
}

async function addFriend(targetUserId) {
  try {
    const data = await api("/api/friends/add", { ...authBody(), targetUserId });
    state.profile = data.account || state.profile;
    state.room = data.room;
    renderRoom(data.room);
    showToast("Request sent", "They can accept it from their home screen.", "system");
  } catch (error) {
    appendSystem(error.message);
  }
}

async function inviteFriend(targetAccountId) {
  try {
    const data = await api("/api/friends/invite", { ...authBody(), targetAccountId });
    state.room = data.room;
    renderRoom(data.room);
    showToast("Invite sent", "Your friend will see this room on their home screen.", "system");
  } catch (error) {
    appendSystem(error.message);
  }
}

async function transferHost(targetUserId) {
  try {
    const data = await api("/api/host/transfer", { ...authBody(), targetUserId });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    appendSystem(error.message);
  }
}

async function removeFromRoom(targetUserId) {
  try {
    const data = await api("/api/host/remove", { ...authBody(), targetUserId });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    appendSystem(error.message);
  }
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
        <button type="button" class="ghost-button remove-queue-btn">Remove</button>
      </div>
    `;
    row.querySelector("img").src = item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
    row.querySelector("h4").textContent = `${index + 1}. ${item.title}`;
    row.querySelector("p").textContent = `${item.votes || 0} votes · added by ${item.addedBy || "room"}`;
    const voteBtn = row.querySelector(".vote-btn");
    voteBtn.classList.toggle("selected", (item.voterIds || []).includes(state.user?.id));
    voteBtn.addEventListener("click", () => voteQueueItem(item.id));
    row.querySelector(".play-queue-btn").addEventListener("click", () => playQueueItem(item.id));
    const removeBtn = row.querySelector(".remove-queue-btn");
    const canRemove = item.addedById === state.user?.id || room.hostId === state.user?.id;
    removeBtn.classList.toggle("hidden", !canRemove);
    removeBtn.addEventListener("click", () => removeQueueItem(item.id));
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
  if (!["ludo", "snakes"].includes(state.activeGame)) state.activeGame = "ludo";
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

async function ludoReady() {
  try {
    const data = await api("/api/game/ready", authBody());
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    ludoStatus.textContent = error.message;
  }
}

async function ludoStart() {
  try {
    const data = await api("/api/game/start", authBody());
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    ludoStatus.textContent = error.message;
  }
}

async function moveLudoPawn(pawnIndex) {
  try {
    const data = await api("/api/game/move", { ...authBody(), pawnIndex });
    state.room = data.room;
    renderRoom(data.room);
  } catch (error) {
    ludoStatus.textContent = error.message;
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

function ludoPlayers() {
  const roomUsers = state.room?.users || [];
  const byId = new Map(roomUsers.map((user) => [user.id, user]));
  const ids = Array.isArray(state.ludo.players) && state.ludo.players.length ? state.ludo.players : gamePlayers().map((player) => player.id);
  return ids.slice(0, 4).map((id, index) => {
    const user = byId.get(id) || gamePlayers()[index] || {};
    const colorName = state.ludo.colors?.[index] || ["red", "green", "yellow", "blue"][index];
    return {
      id: user.id || id || "",
      name: user.name || `Player ${index + 1}`,
      avatar: user.avatar || ["🎧", "🔥", "✨", "🍿"][index],
      colorName,
      color: LUDO_COLOR_HEX[colorName] || "#e7333f",
    };
  });
}

function applyGameSnapshot(games) {
  if (!games) return;
  if (games.ludo) {
    const ludoCount = Array.isArray(games.ludo.players) && games.ludo.players.length ? games.ludo.players.length : gamePlayers().length;
    state.ludo = {
      status: games.ludo.status || "waiting",
      players: Array.isArray(games.ludo.players) ? games.ludo.players : [],
      colors: Array.isArray(games.ludo.colors) ? games.ludo.colors : ["red"],
      ready: games.ludo.ready || {},
      turn: Number(games.ludo.turn || 0),
      turnNumber: Number(games.ludo.turnNumber || 1),
      pawns: normalizeLudoPawns(games.ludo.pawns, ludoCount),
      pendingRoll: games.ludo.pendingRoll || null,
      winner: games.ludo.winner || null,
      lastRoll: games.ludo.lastRoll || null,
      message: games.ludo.message || state.ludo.message || "Press Ready. Host starts Ludo when 1-4 players are ready.",
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
  state.ludo.turn %= players.length;
  state.snakes.positions = normalizeSlots(state.snakes.positions, players.length, 1);
  state.snakes.turn %= players.length;
}

function normalizeLudoPawns(pawns, count) {
  const next = Array.isArray(pawns) ? pawns.slice(0, count) : [];
  while (next.length < count) next.push([-1, -1, -1, -1]);
  return next.map((row) => {
    const pawnsRow = Array.isArray(row) ? row.slice(0, 4) : [];
    while (pawnsRow.length < 4) pawnsRow.push(-1);
    return pawnsRow.map((value) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(-1, Math.min(57, number)) : -1;
    });
  });
}

function normalizeSlots(slots, count, fallback) {
  const next = slots.slice(0, count);
  while (next.length < count) next.push(fallback);
  return next;
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

const LUDO_SAFE_TILES = [0, 8, 13, 21, 26, 34, 39, 47];
const LUDO_COLOR_STARTS = { red: 13, green: 0, yellow: 39, blue: 26 };
const LUDO_COLOR_HEX = { red: "#e7333f", green: "#16b75f", yellow: "#ffc928", blue: "#1d8dff" };
const LUDO_HOME_INDEX = { red: 0, blue: 1, yellow: 2, green: 3 };
function renderLudo() {
  if (!ludoGame || !ludoBoard) return;
  const players = ludoPlayers();
  state.ludo.pawns = normalizeLudoPawns(state.ludo.pawns, players.length);
  state.ludo.turn %= Math.max(1, players.length);
  const activePlayer = players[state.ludo.turn % players.length] || players[0];
  const isMyTurn = activePlayer.id === state.user?.id;
  const isHost = state.room?.hostId === state.user?.id;
  const pending = state.ludo.pendingRoll;
  const movable = new Set(pending?.playerId === state.user?.id ? pending.movable || [] : []);
  const readyCount = Object.values(state.ludo.ready || {}).filter(Boolean).length;
  const canStart = isHost && state.ludo.status === "waiting" && players.length >= 1;
  const ludoPlayable = ["active", "paused"].includes(state.ludo.status);
  ludoGame.classList.toggle("your-turn", ludoPlayable && !state.ludo.winner && isMyTurn);
  ludoDice.textContent = diceFace(state.ludo.lastRoll);
  ludoStatus.textContent = state.ludo.message || "Press Ready. Host starts Ludo when 1-4 players are ready.";
  if (ludoPlayable && !state.ludo.winner && !isMyTurn) {
    ludoStatus.textContent = `${ludoStatus.textContent} Turn: ${activePlayer.name}.`;
  }
  ludoTurnBadge.textContent =
    state.ludo.status === "waiting"
      ? "Ready lobby"
      : state.ludo.winner
        ? `${state.ludo.winner} won`
        : pending?.playerId === state.user?.id
          ? "Tap a glowing pawn"
          : isMyTurn
            ? "Your Turn"
            : `${activePlayer.name}'s turn`;
  ludoTurnBadge.classList.toggle("active", ludoPlayable && !state.ludo.winner && (isMyTurn || pending?.playerId === state.user?.id));
  if (ludoReadyText) ludoReadyText.textContent = `${readyCount}/${players.length} ready · ${players.map((player) => player.colorName).join(", ")}${players.length === 1 ? " · solo test allowed" : ""}`;
  if (ludoReadyBtn) {
    ludoReadyBtn.disabled = state.ludo.status !== "waiting" || Boolean(state.ludo.ready?.[state.user?.id]);
    ludoReadyBtn.textContent = state.ludo.ready?.[state.user?.id] ? "Ready ✓" : "Ready";
  }
  if (ludoStartBtn) {
    ludoStartBtn.disabled = !canStart;
    ludoStartBtn.classList.toggle("hidden", !isHost && state.ludo.status !== "waiting");
  }
  const pendingForMe = pending?.playerId === state.user?.id;
  if (state.ludo.status === "waiting") {
    const allReady = players.length >= 1 && players.every((player) => state.ludo.ready?.[player.id]);
    ludoRollBtn.textContent = !state.ludo.ready?.[state.user?.id] ? "Press Ready first" : isHost && allReady ? "Tap Start Ludo" : "Waiting for host";
  } else {
    ludoRollBtn.textContent = pendingForMe ? "Tap glowing pawn" : state.ludo.winner ? "Round finished" : isMyTurn ? "Your turn: Roll dice" : `${activePlayer.name}'s turn`;
  }
  ludoRollBtn.disabled = !ludoPlayable || Boolean(state.ludo.winner) || (!isMyTurn && !pendingForMe) || (Boolean(pending) && !pendingForMe);
  ludoRollBtn.classList.toggle("hidden", ludoPlayable && !state.ludo.winner && !isMyTurn && !pendingForMe);

  const cell = 40;
  const path = ludoPathPoints();
  const homes = [
    { x: 0, y: 0, color: LUDO_COLOR_HEX.red, label: "RED" },
    { x: 9, y: 0, color: LUDO_COLOR_HEX.blue, label: "BLUE" },
    { x: 9, y: 9, color: LUDO_COLOR_HEX.yellow, label: "YELLOW" },
    { x: 0, y: 9, color: LUDO_COLOR_HEX.green, label: "GREEN" },
  ];
  const homeSvg = homes.map((home, index) => {
    const slots = [[1.5, 1.5], [4.5, 1.5], [1.5, 4.5], [4.5, 4.5]];
    return `
      <g class="ludo-home-zone">
        <rect x="${home.x * cell + 8}" y="${home.y * cell + 8}" width="${6 * cell - 16}" height="${6 * cell - 16}" rx="24" fill="${home.color}"></rect>
        <rect x="${home.x * cell + 58}" y="${home.y * cell + 58}" width="124" height="124" rx="20"></rect>
        ${slots.map(([sx, sy]) => `<circle cx="${(home.x + sx) * cell}" cy="${(home.y + sy) * cell}" r="22"></circle>`).join("")}
        <text x="${(home.x + 3) * cell}" y="${(home.y + 3.15) * cell}">${home.label}</text>
      </g>
    `;
  }).join("");
  const pathSvg = path.map(([x, y], index) => {
    const isSafe = LUDO_SAFE_TILES.includes(index);
    const startColor = Object.entries(LUDO_COLOR_STARTS).find(([, start]) => start === index)?.[0] || "";
    const startClass = startColor ? `start ${startColor}` : "";
    return `
      <g class="ludo-cell ${isSafe ? "safe" : ""} ${startClass}">
        <rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" rx="6"></rect>
        <text x="${x * cell + 20}" y="${y * cell + 26}">${isSafe ? "🛡" : ""}</text>
      </g>
    `;
  }).join("");
  const laneSvg = ludoHomeLaneCells().map((tile) => `
    <rect class="ludo-home-lane ${tile.color}" x="${tile.x * cell}" y="${tile.y * cell}" width="${cell}" height="${cell}" rx="6"></rect>
  `).join("");
  const tokens = players.map((player, playerIndex) => {
    return state.ludo.pawns[playerIndex].map((progress, pawnIndex) => {
      const { x, y } = ludoPawnPoint(player.colorName, pawnIndex, progress);
      const active = activePlayer.id === player.id && !state.ludo.winner;
      const canMove = movable.has(pawnIndex);
      return `
        <g class="svg-token ludo-token ${active ? "active" : ""} ${canMove ? "movable" : ""}" data-pawn="${pawnIndex}" transform="translate(${x} ${y})">
          ${canMove ? '<circle class="ludo-hit-target" cx="0" cy="2" r="32"></circle>' : ""}
          <path d="M0,-20 C11,-20 17,-9 9,-1 L17,16 C18,21 14,24 9,24 L-9,24 C-14,24 -18,21 -17,16 L-9,-1 C-17,-9 -11,-20 0,-20Z" fill="${player.color}"></path>
          <text y="9">${pawnIndex + 1}</text>
        </g>
      `;
    }).join("");
  }).join("");
  ludoBoard.innerHTML = `
    <svg class="ludo-svg-board" viewBox="0 0 600 600" aria-label="Advanced Ludo board">
      <rect class="board-bg ludo-bg" x="5" y="5" width="590" height="590" rx="26"></rect>
      ${homeSvg}
      ${pathSvg}
      ${laneSvg}
      <g class="ludo-center">
        <polygon class="p1" points="240,240 360,240 300,300"></polygon>
        <polygon class="p3" points="360,240 360,360 300,300"></polygon>
        <polygon class="p0" points="360,360 240,360 300,300"></polygon>
        <polygon class="p2" points="240,360 240,240 300,300"></polygon>
        <circle cx="300" cy="300" r="34"></circle>
        <text x="300" y="307">HOME</text>
      </g>
      ${tokens}
    </svg>
  `;
  ludoBoard.querySelectorAll(".ludo-token.movable").forEach((token) => {
    token.addEventListener("click", () => moveLudoPawn(Number(token.dataset.pawn)));
  });
}

function ludoBoardIndex(colorName, progress) {
  return (progress + (LUDO_COLOR_STARTS[colorName] || 0)) % 52;
}

function ludoPawnPoint(colorName, pawnIndex, progress) {
  if (progress < 0) return ludoYardPoint(colorName, pawnIndex);
  if (progress === 57) return ludoFinishedPoint(colorName, pawnIndex);
  if (progress >= 52) return ludoHomeLanePoint(colorName, progress - 52, pawnIndex);
  const [cellX, cellY] = ludoPathPoints()[ludoBoardIndex(colorName, progress)];
  const offsets = [[-9, -9], [9, -9], [-9, 9], [9, 9]];
  const [dx, dy] = offsets[pawnIndex] || [0, 0];
  return { x: cellX * 40 + 20 + dx, y: cellY * 40 + 20 + dy };
}

function ludoYardPoint(colorName, pawnIndex) {
  const homeOrigins = [[0, 0], [9, 0], [9, 9], [0, 9]];
  const slots = [[1.5, 1.5], [4.5, 1.5], [1.5, 4.5], [4.5, 4.5]];
  const [ox, oy] = homeOrigins[LUDO_HOME_INDEX[colorName] ?? 0] || homeOrigins[0];
  const [sx, sy] = slots[pawnIndex] || slots[0];
  return { x: (ox + sx) * 40, y: (oy + sy) * 40 };
}

function ludoHomeLanePoint(colorName, step, pawnIndex) {
  const lanes = {
    green: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
    red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
    blue: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  };
  const lane = lanes[colorName] || lanes.red;
  const [cellX, cellY] = lane[Math.max(0, Math.min(5, step))] || [7, 7];
  const offsets = [[-6, -6], [6, -6], [-6, 6], [6, 6]];
  const [dx, dy] = offsets[pawnIndex] || [0, 0];
  return { x: cellX * 40 + 20 + dx, y: cellY * 40 + 20 + dy };
}

function ludoFinishedPoint(colorName, pawnIndex) {
  const offsets = [[-17, -17], [17, -17], [-17, 17], [17, 17]];
  const [dx, dy] = offsets[pawnIndex] || [0, 0];
  const shift = (LUDO_HOME_INDEX[colorName] ?? 0) - 1.5;
  return { x: 300 + dx + shift * 4, y: 300 + dy + shift * 4 };
}

function ludoHomeLaneCells() {
  return [
    ...[[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]].map(([x, y]) => ({ x, y, color: "green" })),
    ...[[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]].map(([x, y]) => ({ x, y, color: "red" })),
    ...[[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]].map(([x, y]) => ({ x, y, color: "blue" })),
    ...[[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]].map(([x, y]) => ({ x, y, color: "yellow" })),
  ];
}

function ludoPathPoints() {
  return [
    [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6],
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0],
    [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8],
    [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14],
  ];
}

function renderSnakes() {
  const players = gamePlayers();
  syncGameSlots(players);
  const activePlayer = players[state.snakes.turn % players.length];
  const isMyTurn = activePlayer.id === state.user?.id;
  snakesGame.classList.toggle("your-turn", !state.snakes.winner && isMyTurn);
  if (turnBadge) {
    turnBadge.textContent = state.snakes.winner ? `${state.snakes.winner} won` : isMyTurn ? "Your Turn" : `${activePlayer.name}'s turn`;
    turnBadge.classList.toggle("active", !state.snakes.winner && isMyTurn);
  }
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
      const active = activePlayer.id === player.id && !state.snakes.winner;
      return `
        <g class="svg-token snake-token ${active ? "active" : ""}" transform="translate(${x + offset}, ${y + offset})">
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
  searchStatus.textContent = `${results.length} videos found. Load one, then tap Play when the room is ready.`;
  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <img alt="" loading="lazy">
      <div><h4></h4><p>youtube.com/watch</p></div>
      <div class="result-actions">
        <button type="button" class="primary-button load-btn">Load</button>
        <button type="button" class="secondary-button queue-btn">Add next</button>
      </div>
    `;
    card.querySelector("img").src = result.thumbnail;
    card.querySelector("h4").textContent = result.title;
    card.querySelector("p").textContent = "Load it first. If YouTube blocks embed, choose another result.";
    card.querySelector(".load-btn").addEventListener("click", () => loadVideoForRoom(result.videoId, result.title));
    card.querySelector(".queue-btn").addEventListener("click", () => addQueueItem(result));
    searchResults.appendChild(card);
  });
}

function diceFace(value) {
  return ["🎲", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value || 0];
}

function applySnapshot(room, options = false) {
  if (!room.videoId) return;
  const force = typeof options === "boolean" ? options : Boolean(options?.force);
  const cueOnly = typeof options === "object" && Boolean(options?.cueOnly);
  const desired = currentDesiredPosition(room);
  if (!state.playerReady) {
    if (force || state.playerFallbackMode || state.playerLoadFallbackShown) {
      renderYouTubeIframeFallback(room.videoId, desired, room.status === "playing");
    }
    renderStatus(room);
    return;
  }
  const currentVideo = state.player.getVideoData?.()?.video_id || "";
  const currentTime = state.player.getCurrentTime?.() || 0;
  const needsLoad = force || currentVideo !== room.videoId;
  const needsSeek = force || Math.abs(currentTime - desired) > 2.2;

  state.suppressPlayerEventsUntil = Date.now() + 1200;
  if (needsLoad) {
    if (cueOnly && state.player.cueVideoById) state.player.cueVideoById(room.videoId, desired);
    else state.player.loadVideoById(room.videoId, desired);
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
  showToast("Reaction", emoji, "reaction");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAttachmentPreview() {
  if (!attachmentPreview || !state.pendingImage) return;
  attachmentPreview.classList.remove("hidden");
  attachmentPreview.innerHTML = `
    <img alt="Selected chat attachment">
    <div>
      <strong>Photo ready</strong>
      <span></span>
    </div>
    <button type="button" aria-label="Remove attached photo">Remove</button>
  `;
  attachmentPreview.querySelector("img").src = state.pendingImage.data;
  attachmentPreview.querySelector("span").textContent = state.pendingImage.name || "Image attachment";
  attachmentPreview.querySelector("button").addEventListener("click", clearAttachmentPreview);
}

function clearAttachmentPreview() {
  state.pendingImage = null;
  if (!attachmentPreview) return;
  attachmentPreview.classList.add("hidden");
  attachmentPreview.innerHTML = "";
}

function toggleSpeechInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendSystem("Mic typing is not supported in this browser. Try Chrome or Android browser.");
    return;
  }
  if (state.speechRecognition && state.listening) {
    state.speechRecognition.stop();
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-IN";
  recognition.interimResults = true;
  recognition.continuous = false;
  state.speechRecognition = recognition;
  state.listening = true;
  micBtn?.classList.add("listening");
  micBtn?.setAttribute("aria-label", "Stop listening");
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();
    if (transcript) chatInput.value = transcript.slice(0, 400);
  };
  recognition.onerror = () => {
    appendSystem("Mic could not hear clearly. Tap mic and try again.");
  };
  recognition.onend = () => {
    state.listening = false;
    micBtn?.classList.remove("listening");
    micBtn?.setAttribute("aria-label", "Speak message");
    chatInput.focus();
  };
  try {
    recognition.start();
  } catch {
    state.listening = false;
    micBtn?.classList.remove("listening");
    appendSystem("Mic permission was not available. Allow microphone access and try again.");
  }
}

function appendChat(name, text, avatar = "🎧", image = null) {
  const item = document.createElement("div");
  item.className = "chat-message";
  item.innerHTML = `<span class="chat-avatar"></span><div><strong></strong><span class="chat-text"></span></div>`;
  item.querySelector(".chat-avatar").textContent = avatar;
  item.querySelector("strong").textContent = name;
  item.querySelector(".chat-text").textContent = text;
  if (image?.data) {
    const link = document.createElement("a");
    link.href = image.data;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "chat-image-link";
    const img = document.createElement("img");
    img.src = image.data;
    img.alt = image.name || "Chat photo";
    link.appendChild(img);
    item.querySelector("div").appendChild(link);
  }
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
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

async function apiGet(path) {
  const response = await fetch(apiUrl(path));
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
