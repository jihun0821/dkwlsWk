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

window.onload = function () {
    const savedTheme = localStorage.getItem("theme");
    const body = document.body;

    if (savedTheme === "light") {
        body.classList.add("light-mode");
    } else {
        body.classList.remove("light-mode");
    }

    // ✅ Firebase SDK 로드 후에 초기화
    if (window.firebase && window.firebase.getFirestore && window.firebase.getAuth) {
        db = window.firebase.getFirestore();
        auth = window.firebase.getAuth();
    } else {
        console.error("Firebase SDK가 아직 로드되지 않았습니다.");
        return;
    }

    // ✅ Firebase 초기화 이후 실행
    showUserProfile();

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
  // UI 갱신(아이콘 즉시 변경)
  showUserProfile();
}

function isUserLoggedIn() {
    return !!localStorage.getItem("userEmail");
}

// Firebase 투표 저장
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
    
    // 총 투표수가 0인 경우 처리
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

// Firebase 기반 loadMatchDetails 함수 (중복 제거, 이것만 사용)
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
}

function setupMatchClickListeners() {
    document.querySelectorAll('.match').forEach(match => {
        match.addEventListener('click', () => {
            const matchId = match.dataset.matchId;
            openPanel(matchId);
        });
    });
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
        "28": getMatchDetailsById("28"),
        "29": getMatchDetailsById("29")
        "30": getMatchDetailsById("30")
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
    updateButtons(); // 페이지 버튼도 함께 갱신
}

function updateButtons() {
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === getTotalPages();
}

// 페이지네이션 이벤트 (중복되지 않게 1회만!)
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

// 검색창 필터링
document.querySelector('.search-bar')?.addEventListener('input', function (e) {
    const keyword = e.target.value.toLowerCase();
    document.querySelectorAll('section.main .match').forEach(match => {
        match.style.display = match.textContent.toLowerCase().includes(keyword) ? 'block' : 'none';
    });
});

// 패널 닫기 버튼 및 오버레이 클릭 시 닫힘 처리
closePanelBtn?.addEventListener("click", closePanel);
overlay?.addEventListener("click", closePanel);
