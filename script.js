// 테마 버튼
const matchDetailsPanel = document.getElementById("matchDetailsPanel");
const overlay = document.getElementById("overlay");
const closePanelBtn = document.getElementById("closePanelBtn");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");

let currentPage = 6;
const matchesPerPage = 5;

function getTotalPages() {
  return Math.ceil(Object.keys(getAllMatchData()).length / matchesPerPage);
}

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let db, auth;

window.onload = async function () {
  const savedTheme = localStorage.getItem("theme");
  const body = document.body;
  if (savedTheme === "light") body.classList.add("light-mode");
  else body.classList.remove("light-mode");

  // Firebase SDK 로드 및 초기화
  if (window.firebase && window.firebase.getFirestore && window.firebase.getAuth) {
    db = window.firebase.getFirestore();
    auth = window.firebase.getAuth();
  } else {
    console.error("Firebase SDK가 아직 로드되지 않았습니다.");
    return;
  }
  await showUserProfile();

  const pagination = document.querySelector('.pagination-container');
  if (pagination) {
    renderMatches();
    updateButtons();
  } else {
    setupMatchClickListeners();
  }
};

function updateUIForAuthState(isLoggedIn, profileData = null) {
  const profileBox = document.getElementById('profile-box');
  const themeIcon = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
  if (isLoggedIn && profileData) {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nickname || 'USER')}&background=667eea&color=fff&size=35&bold=true`;
    const avatarUrl = profileData.avatar_url || defaultAvatar;
    profileBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${avatarUrl}" alt="프로필"
          style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;"
          onerror="this.src='${defaultAvatar}'">
        <span style="color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${profileData.nickname || '사용자'}</span>
        <button id="logoutBtn" type="button">로그아웃</button>
        <button id="toggleThemeBtn" type="button">${themeIcon}</button>
      </div>
    `;
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('toggleThemeBtn').onclick = toggleTheme;
  } else {
    profileBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <button id="loginBtn" type="button">로그인</button>
        <button id="toggleThemeBtn" type="button">${themeIcon}</button>
      </div>
    `;
    document.getElementById('loginBtn').onclick = () => {
      document.getElementById('authModal').style.display = 'flex';
    };
    document.getElementById('toggleThemeBtn').onclick = toggleTheme;
  }
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
  showUserProfile();
}

function isUserLoggedIn() {
  return !!localStorage.getItem("userEmail");
}

async function saveVoteToFirestore(matchId, voteType) {
  const user = auth.currentUser;
  if (!user) return;
  const voteRef = window.firebase.doc(db, 'votes', `${matchId}_${user.uid}`);
  const voteSnap = await window.firebase.getDoc(voteRef);
  if (voteSnap.exists()) return null;
  await window.firebase.setDoc(voteRef, {
    matchId,
    uid: user.uid,
    voteType,
    votedAt: new Date()
  });
  return true;
}

async function getVotingStatsFromFirestore(matchId) {
  const stats = { homeWin: 0, draw: 0, awayWin: 0, total: 0 };
  const querySnapshot = await window.firebase.getDocs(
    window.firebase.query(
      window.firebase.collection(db, 'votes'),
      window.firebase.where('matchId', '==', matchId)
    )
  );
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.voteType in stats) {
      stats[data.voteType]++;
      stats.total++;
    }
  });
  return stats;
}

async function hasUserVoted(matchId) {
  const user = auth.currentUser;
  if (!user) return false;
  const voteRef = window.firebase.doc(db, 'votes', `${matchId}_${user.uid}`);
  const voteSnap = await window.firebase.getDoc(voteRef);
  return voteSnap.exists();
}

function renderVotingGraph(container, stats) {
  const totalVotes = stats.total;
  if (totalVotes === 0) {
    container.innerHTML = `
      <div class="voting-stats">
        <div class="no-votes-message">
          <p>아직 투표가 없습니다.</p>
        </div>
      </div>
    `;
    return;
  }
  const homePercent = Math.round((stats.homeWin / totalVotes) * 100);
  const drawPercent = Math.round((stats.draw / totalVotes) * 100);
  const awayPercent = Math.round((stats.awayWin / totalVotes) * 100);
  container.innerHTML = `
    <div class="voting-stats">
      <div class="stat-row">
        <div class="stat-value">${homePercent}%</div>
        <div class="stat-bar">
          <div class="home-stat" style="width: ${homePercent}%"></div>
          <div class="draw-stat" style="width: ${drawPercent}%"></div>
          <div class="away-stat" style="width: ${awayPercent}%"></div>
        </div>
        <div class="stat-value">${awayPercent}%</div>
      </div>
      <div class="stat-labels">
        <span class="home-label">홈 승 (${stats.homeWin})</span>
        <span class="draw-label">무승부 (${stats.draw})</span>
        <span class="away-label">원정 승 (${stats.awayWin})</span>
      </div>
    </div>
  `;
}

function openPanel(matchId) {
  loadMatchDetails(matchId);
  matchDetailsPanel.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closePanel() {
  matchDetailsPanel.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function getAllMatchData() {
  return {
    "1": getMatchDetailsById("1"),
    "2": getMatchDetailsById("2"),
    "3": getMatchDetailsById("3"),
    "4": getMatchDetailsById("4"),
    "5": getMatchDetailsById("5"),
    "6": getMatchDetailsById("6"),
    "7": getMatchDetailsById("7"),
    "8": getMatchDetailsById("8"),
    "9": getMatchDetailsById("21"),
    "10": getMatchDetailsById("22"),
    "11": getMatchDetailsById("23"),
    "12": getMatchDetailsById("9"),
    "13": getMatchDetailsById("10"),
    "14": getMatchDetailsById("11"),
    "15": getMatchDetailsById("12"),
    "16": getMatchDetailsById("13"),
    "17": getMatchDetailsById("14"),
    "18": getMatchDetailsById("15"),
    "19": getMatchDetailsById("16"),
    "20": getMatchDetailsById("17"),
    "21": getMatchDetailsById("18"),
    "22": getMatchDetailsById("19"),
    "23": getMatchDetailsById("24"),
    "24": getMatchDetailsById("20"),
    "25": getMatchDetailsById("25"),
    "26": getMatchDetailsById("26"),
    "27": getMatchDetailsById("27"),
    "28": getMatchDetailsById("28")
  };
}

function renderMatches() {
  const matchContainer = document.querySelector("section.main");
  const allMatches = Object.values(getAllMatchData());
  const matchesToShow = allMatches.slice((currentPage - 1) * matchesPerPage, currentPage * matchesPerPage);
  document.querySelectorAll(".match-list").forEach(el => el.remove());
  const pagination = document.querySelector(".pagination-container");
  const html = matchesToShow.map(match => `
    <div class="match-list">
      <div class="match" data-match-id="${match.id}">
        <div class="match-info">
          <div class="match-date">${match.date}</div>
          <div class="match-teams">
            <span class="team home">${match.homeTeam}</span>
            <span class="score">${match.status === "cancelled" ? "취소" : `${match.homeScore} - ${match.awayScore}`}</span>
            <span class="team away">${match.awayTeam}</span>
          </div>
        </div>
      </div>
    </div>
  `).join("");
  pagination.insertAdjacentHTML("beforebegin", html);
  setupMatchClickListeners();
  updateButtons();
}

function updateButtons() {
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === getTotalPages();
}

prevBtn?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderMatches();
  }
});
nextBtn?.addEventListener('click', () => {
  if (currentPage < getTotalPages()) {
    currentPage++;
    renderMatches();
  }
});

document.querySelector('.search-bar')?.addEventListener('input', function (e) {
  const keyword = e.target.value.toLowerCase();
  document.querySelectorAll('section.main .match').forEach(match => {
    match.style.display = match.textContent.toLowerCase().includes(keyword) ? 'block' : 'none';
  });
});

// -----------------------
// 경기 상세정보 패널에 탭 UI, 라인업, 채팅 기능 추가
// -----------------------

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"'`]/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  }[s]));
}

function renderPanelTabs(matchDetails, matchId) {
  return `
    <div class="tab-container">
      <div class="tabs">
        <div class="tab active" data-tab="lineup">라인업</div>
        <div class="tab" data-tab="chat">채팅</div>
      </div>
      <div class="tab-contents">
        <div class="tab-content lineup-content active">
          ${renderLineup(matchDetails)}
        </div>
        <div class="tab-content chat-content">
          ${renderChatBox(matchId)}
        </div>
      </div>
    </div>
  `;
}

function renderLineup(match) {
  function players(list) {
    return `<div class="players-container">${list.map((n) => `<div class="player">${escapeHtml(n)}</div>`).join("")}</div>`;
  }
  function sideBlock(side, data) {
    return `
      <div class="lineup-team lineup-${side}">
        <div class="lineup-group"><span class="position-label">3학년</span>${players(data.third || [])}</div>
        <div class="lineup-group"><span class="position-label">2학년</span>${players(data.second || [])}</div>
        <div class="lineup-group"><span class="position-label">1학년</span>${players(data.first || [])}</div>
      </div>
    `;
  }
  return `
    <div class="lineup-field">
      <div class="lineup-bg"></div>
      <div class="lineup-sides">
        ${sideBlock("home", match.lineups.home)}
        <div class="vs-label">VS</div>
        ${sideBlock("away", match.lineups.away)}
      </div>
    </div>
  `;
}

function renderChatBox(matchId) {
  return `
    <div class="chat-messages" id="chatMessages"></div>
    <form class="chat-form" id="chatForm">
      <input type="text" id="chatInput" autocomplete="off" maxlength="120" placeholder="메시지를 입력하세요" />
      <button type="submit" id="sendChatBtn">전송</button>
    </form>
    <div class="chat-login-notice" style="display:none;">
      <button class="login-btn" onclick="document.getElementById('authModal').style.display='flex'">로그인 후 채팅하기</button>
    </div>
  `;
}

function chatCollection(matchId) {
  return window.firebase.collection(db, 'match_chats', matchId, 'messages');
}

function setupPanelTabs(matchId) {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach((tab, index) => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      contents[index].classList.add('active');
      if (tab.dataset.tab === "chat") {
        setupChat(matchId);
      }
    };
  });
  if (tabs.length > 0 && contents.length > 0) {
    tabs[0].classList.add('active');
    contents[0].classList.add('active');
  }
}

function setupChat(matchId) {
  const chatBox = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const loginNotice = document.querySelector('.chat-login-notice');
  chatBox.innerHTML = "";
  if (!auth.currentUser) {
    loginNotice.style.display = "block";
    chatForm.style.display = "none";
    chatBox.innerHTML = "<p style='text-align:center;color:#aaa;'>로그인 후 채팅을 이용할 수 있습니다.</p>";
    return;
  } else {
    loginNotice.style.display = "none";
    chatForm.style.display = "flex";
  }
  if (window.chatUnsubscribe) window.chatUnsubscribe();
  window.chatUnsubscribe = window.firebase.onSnapshot(
    window.firebase.query(
      chatCollection(matchId),
      window.firebase.where('matchId', '==', matchId)
    ),
    (snapshot) => {
      let html = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        const isMe = msg.uid === auth.currentUser.uid;
        html += `
          <div class="chat-msg${isMe ? " me" : ""}">
            <span class="chat-nick">${escapeHtml(msg.nickname)}</span>
            <span class="chat-text">${escapeHtml(msg.text)}</span>
            <span class="chat-time">${msg.time ? new Date(msg.time.seconds * 1000).toLocaleTimeString() : ""}</span>
          </div>
        `;
      });
      chatBox.innerHTML = html;
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  );
  chatForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    const user = auth.currentUser;
    if (!user) return;
    const profileSnap = await window.firebase.getDoc(window.firebase.doc(db, 'profiles', user.uid));
    const nickname = profileSnap.exists() ? profileSnap.data().nickname : user.email.split('@')[0];
    await window.firebase.setDoc(
      window.firebase.doc(chatCollection(matchId), Date.now().toString() + "_" + user.uid),
      {
        matchId,
        uid: user.uid,
        nickname,
        text,
        time: new Date()
      }
    );
    chatInput.value = "";
    setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
  };
}

async function loadMatchDetails(matchId) {
  const matchDetails = getMatchDetailsById(matchId);
  panelTitle.textContent = `${matchDetails.homeTeam} vs ${matchDetails.awayTeam}`;
  const isLoggedIn = !!auth.currentUser;
  const userVoted = isLoggedIn ? await hasUserVoted(matchId) : false;
  const stats = await getVotingStatsFromFirestore(matchId);

  let predictionHtml = "";
  if (matchDetails.status === "scheduled") {
    if (!isLoggedIn || userVoted) {
      predictionHtml = `<h3>승부예측 결과</h3><div id="votingStats"></div>`;
    } else {
      predictionHtml = `
        <h3>승부예측</h3>
        <div class="prediction-btns">
          <button class="prediction-btn home-win" data-vote="homeWin">1</button>
          <button class="prediction-btn draw" data-vote="draw">X</button>
          <button class="prediction-btn away-win" data-vote="awayWin">2</button>
        </div>`;
    }
  } else {
    predictionHtml = `<h3>승부예측 결과</h3><div id="votingStats"></div>`;
  }

  panelContent.innerHTML = `
    <div class="match-date">${matchDetails.date}</div>
    <div class="match-league">${matchDetails.league}</div>
    <div class="match-score">
      <div class="team-name">${matchDetails.homeTeam}</div>
      <div class="score-display">${matchDetails.homeScore} - ${matchDetails.awayScore}</div>
      <div class="team-name">${matchDetails.awayTeam}</div>
    </div>
    <div class="prediction-container">${predictionHtml}</div>
    <hr>
    ${renderPanelTabs(matchDetails, matchId)}
  `;

  const statsContainer = panelContent.querySelector('#votingStats');
  if (statsContainer) renderVotingGraph(statsContainer, stats);

  const buttons = panelContent.querySelectorAll('.prediction-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const voteType = btn.getAttribute("data-vote");
      const success = await saveVoteToFirestore(matchId, voteType);
      if (success) {
        const updatedStats = await getVotingStatsFromFirestore(matchId);
        const container = btn.closest('.prediction-container');
        container.innerHTML = `<h3>승부예측 결과</h3><div id="votingStats"></div>`;
        renderVotingGraph(container.querySelector('#votingStats'), updatedStats);
      }
    });
  });
  setupPanelTabs(matchId);
}

closePanelBtn?.addEventListener("click", closePanel);
overlay?.addEventListener("click", closePanel);

function setupMatchClickListeners() {
  document.querySelectorAll('.match').forEach(match => {
    match.addEventListener('click', () => {
      const matchId = match.dataset.matchId;
      openPanel(matchId);
    });
  });
}
