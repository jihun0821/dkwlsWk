// 테마 버튼
const matchDetailsPanel = document.getElementById("matchDetailsPanel");
const overlay = document.getElementById("overlay");
const closePanelBtn = document.getElementById("closePanelBtn");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");

let currentPage = 6;
const matchesPerPage = 5;

async function getTotalPages() {
    const allMatches = await getAllMatchData();
    return Math.ceil(Object.keys(allMatches).length / matchesPerPage);
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
    
    // 페이지 로드 시 공지 표시 여부 확인
    checkNoticeVisibility();

    // 닫기 버튼에 이벤트 리스너 추가
    const closeButton = document.querySelector('.close-notice');
    if (closeButton) {
        closeButton.onclick = closeNoticeForWeek;
    }

    // 프로필 편집 모달 관련 이벤트 리스너 추가
    setupProfileEditModalEvents();
};

const themeMenuHtml = `
  <div id="profileSettingsMenu" class="settings-menu">
    <div class="settings-menu-inner">
      <div class="settings-menu-title">테마</div>
      <div class="theme-options">
        <label class="theme-label">
          <input type="radio" name="theme" value="system" id="themeSystem"> 시스템
        </label>
        <label class="theme-label">
          <input type="radio" name="theme" value="light" id="themeLight"> 라이트
        </label>
        <label class="theme-label">
          <input type="radio" name="theme" value="dark" id="themeDark"> 다크
        </label>
      </div>
      <hr class="settings-divider">
    </div>
  </div>
`;

function updateUIForAuthState(isLoggedIn, profileData = null) {
    const profileBox = document.getElementById('profile-box');
    
    if (isLoggedIn && profileData) {
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nickname || 'USER')}&background=667eea&color=fff&size=35&bold=true`;
        const avatarUrl = profileData.avatar_url || defaultAvatar;
        profileBox.innerHTML = `
            <div class="profile-bar">
                <img id="profileAvatar" src="${avatarUrl}" alt="프로필" class="profile-avatar">
                <span class="profile-nickname">${profileData.nickname || '사용자'}</span>
                <button id="logoutBtn" type="button" class="logout-btn">로그아웃</button>
                <button id="profileSettingsBtn" type="button" title="설정" class="profile-settings-btn">
                    <span class="material-symbols-outlined">&#9881;</span>
                </button>
                <div id="profileSettingsMenu" class="settings-menu">
                    <div class="settings-menu-inner">
                        <div class="settings-menu-title">테마</div>
                        <div class="theme-options">
                            <label class="theme-label">
                                <input type="radio" name="theme" value="system" id="themeSystem">
                                시스템
                            </label>
                            <label class="theme-label">
                                <input type="radio" name="theme" value="light" id="themeLight">
                                라이트
                            </label>
                            <label class="theme-label">
                                <input type="radio" name="theme" value="dark" id="themeDark">
                                다크
                            </label>
                        </div>
                        <hr class="settings-divider">
                        <button id="openProfileEditBtn" class="profile-edit-btn">프로필 편집</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('logoutBtn').onclick = logout;
        // 메뉴 열고 닫기 토글
        const settingsBtn = document.getElementById('profileSettingsBtn');
        const settingsMenu = document.getElementById('profileSettingsMenu');
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.style.display = (settingsMenu.style.display === 'none' || settingsMenu.style.display === '') ? 'block' : 'none';
        };
        // 메뉴 바깥 클릭시 닫기
        document.addEventListener('click', function hideMenu(e) {
            if (settingsMenu && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
                settingsMenu.style.display = 'none';
            }
        }, { once: true });
        // 테마 라디오 반영
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') document.getElementById('themeLight').checked = true;
        else if (savedTheme === 'dark') document.getElementById('themeDark').checked = true;
        else document.getElementById('themeSystem').checked = true;
        document.getElementById('themeSystem').onclick = () => { setTheme('system'); };
        document.getElementById('themeLight').onclick = () => { setTheme('light'); };
        document.getElementById('themeDark').onclick = () => { setTheme('dark'); };
        // 프로필 편집 버튼
        document.getElementById('openProfileEditBtn').onclick = () => {
            openProfileEditModal(profileData);
            settingsMenu.style.display = 'none';
        };
    } else {
profileBox.innerHTML = `
    <div class="profile-container">
        <button id="loginBtn" type="button">로그인</button>
        <button id="profileSettingsBtn" type="button" title="설정" class="settings-button">
            <span class="material-symbols-outlined">⚙</span>
        </button>
        <div id="profileSettingsMenu" class="settings-menu">
            <div class="settings-content">
                <div class="settings-title">테마</div>
                <div class="theme-options">
                    <label class="theme-option">
                        <input type="radio" name="theme" value="system" id="themeSystem">
                        시스템
                    </label>
                    <label class="theme-option">
                        <input type="radio" name="theme" value="light" id="themeLight">
                        라이트
                    </label>
                    <label class="theme-option">
                        <input type="radio" name="theme" value="dark" id="themeDark">
                        다크
                    </label>
                </div>
            </div>
        </div>
    </div>
`;

        
        // 로그인 버튼 이벤트
        document.getElementById('loginBtn').onclick = () => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'flex';
            } else {
                console.error('loginModal 요소를 찾을 수 없습니다.');
            }
        };
        
        // 설정 버튼 이벤트
        const settingsBtn = document.getElementById('profileSettingsBtn');
        const settingsMenu = document.getElementById('profileSettingsMenu');
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        };
        
        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (settingsMenu && !settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsMenu.style.display = 'none';
            }
        });
        
        // 테마 변경 이벤트
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') document.getElementById('themeLight').checked = true;
        else if (savedTheme === 'dark') document.getElementById('themeDark').checked = true;
        else document.getElementById('themeSystem').checked = true;
        document.getElementById('themeSystem').onclick = () => { setTheme('system'); };
        document.getElementById('themeLight').onclick = () => { setTheme('light'); };
        document.getElementById('themeDark').onclick = () => { setTheme('dark'); };
    }
}

// 시스템/라이트/다크 테마 적용 함수
function setTheme(mode) {
    if (mode === 'system') {
        localStorage.removeItem('theme');
        document.body.classList.remove('light-mode');
        document.body.classList.remove('dark-mode');
    } else if (mode === 'light') {
        localStorage.setItem('theme', 'light');
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    } else if (mode === 'dark') {
        localStorage.setItem('theme', 'dark');
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    }
    showUserProfile();
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

// === 프로필 편집 모달 열기 함수 ===
function openProfileEditModal(profileData) {
    const modal = document.getElementById('profileEditModal');
    if (!modal) return;
    document.getElementById('currentProfileImage').src = profileData.avatar_url;
    document.getElementById('currentNickname').textContent = profileData.nickname;
    document.getElementById('currentEmail').textContent = profileData.email || "";
    document.getElementById('editSuccessMessage').style.display = "none";
    document.getElementById('newNickname').value = "";
    modal.style.display = "flex";
}

// [추가!] 프로필 편집 모달 이벤트 설정
function setupProfileEditModalEvents() {
    // 프로필 편집 모달 닫기/취소 버튼 이벤트
    const closeProfileEditModal = document.getElementById('closeProfileEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileEditModal = document.getElementById('profileEditModal');
    
    if (closeProfileEditModal) {
        closeProfileEditModal.onclick = () => {
            if (profileEditModal) profileEditModal.style.display = 'none';
        };
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            if (profileEditModal) profileEditModal.style.display = 'none';
        };
    }

    // 프로필 편집 모달 배경 클릭 시 닫기
    if (profileEditModal) {
        profileEditModal.onclick = (e) => {
            if (e.target === profileEditModal) {
                profileEditModal.style.display = 'none';
            }
        };
    }
}

// === 편집 모달 이벤트 연결 ===
window.addEventListener('DOMContentLoaded', function() {
    const closeEdit = document.getElementById('closeProfileEditModal');
    const cancelEdit = document.getElementById('cancelEditBtn');
    const saveEdit = document.getElementById('saveNicknameBtn');
    
    if (closeEdit) closeEdit.onclick = () => { 
        document.getElementById('profileEditModal').style.display = "none"; 
    };
    
    if (cancelEdit) cancelEdit.onclick = () => { 
        document.getElementById('profileEditModal').style.display = "none"; 
    };
});

const saveNicknameBtn = document.getElementById('saveNicknameBtn');
if (saveNicknameBtn) {
    saveNicknameBtn.onclick = async function () {
        const newNickname = document.getElementById('newNickname').value.trim();
        if (newNickname.length < 2 || newNickname.length > 20) {
            alert('닉네임은 2자 이상 20자 이하로 입력해주세요.');
            return;
        }
        const user = auth.currentUser;
        if (!user) return;
        try {
            // Firestore 수정
            const docRef = window.firebase.doc(db, 'profiles', user.uid);
            await window.firebase.setDoc(docRef, { nickname: newNickname }, { merge: true });
            // Auth displayName도 수정
            await window.firebase.updateProfile(user, { displayName: newNickname });
            document.getElementById('editSuccessMessage').style.display = "block";
            showUserProfile();
            setTimeout(() => {
                document.getElementById('profileEditModal').style.display = "none";
            }, 1000);
        } catch (error) {
            console.error('닉네임 수정 중 오류 발생:', error);
            alert('닉네임 수정에 실패했습니다. 다시 시도해주세요.');
        }
    };
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

// ✅ Firestore에서 단일 경기 정보 가져오기 (비동기)
async function getMatchDetailsById(matchId) {
    try {
        const docRef = window.firebase.doc(db, "matches", matchId);
        const docSnap = await window.firebase.getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.warn(`경기 ID ${matchId}에 대한 데이터가 없습니다.`);
            return null;
        }
    } catch (error) {
        console.error("경기 정보 불러오기 실패:", error);
        return null;
    }
}

// Firebase 기반 loadMatchDetails 함수 (중복 제거, 이것만 사용)
async function loadMatchDetails(matchId) {
    const matchDetails = await getMatchDetailsById(matchId);
    if (!matchDetails) return;
    
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
        ${renderPanelTabs(matchDetails, matchId)}
    `;

    const statsContainer = panelContent.querySelector('#votingStats');
    if (statsContainer) renderVotingGraph(statsContainer, stats);

    setupPanelTabs(matchId); // 탭 이벤트 연결!

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

// ✅ Firestore에서 모든 경기 정보 가져오기 (비동기)
async function getAllMatchData() {
    const matchMap = {};
    try {
        const querySnapshot = await window.firebase.getDocs(window.firebase.collection(db, "matches"));
        querySnapshot.forEach((doc) => {
            matchMap[doc.id] = doc.data();
        });
    } catch (error) {
        console.error("경기 목록 불러오기 실패:", error);
    }
    return matchMap;
}

// ✅ 비동기로 변경된 renderMatches 함수
async function renderMatches() {
    const matchContainer = document.querySelector("section.main");
    const allMatches = Object.values(await getAllMatchData());
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

async function updateButtons() {
    const totalPages = await getTotalPages();
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// 페이지네이션 이벤트 (중복되지 않게 1회만!)
prevBtn?.addEventListener('click', async () => {
    if (currentPage > 1) {
        currentPage--;
        await renderMatches();
    }
});

nextBtn?.addEventListener('click', async () => {
    const totalPages = await getTotalPages();
    if (currentPage < totalPages) {
        currentPage++;
        await renderMatches();
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

// 경기 상세정보 패널에 탭 UI, 라인업, 채팅 기능 추가

// HTML 이스케이프
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

// 라인업 렌더링 (학년별)
function renderLineup(match) {
    const groupLabel = (idx) => ["1학년", "2학년", "3학년"][idx];
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

// 채팅 박스 렌더링
function renderChatBox(matchId) {
    return `
        <div class="chat-messages" id="chatMessages"></div>
        <form class="chat-form" id="chatForm">
            <input type="text" id="chatInput" autocomplete="off" maxlength="120" placeholder="메시지를 입력하세요" />
            <button type="submit" id="sendChatBtn">전송</button>
        </form>
        <div class="chat-login-notice" style="display:none;">
            <button class="login-btn" onclick="document.getElementById('loginModal').style.display='flex'">로그인 후 채팅하기</button>
        </div>
    `;
}

// 채팅 Firestore 경로
function chatCollection(matchId) {
    return window.firebase.collection(db, 'match_chats', matchId, 'messages');
}

// 패널 탭 동작 및 기능 연결 (수정된 버전)
function setupPanelTabs(matchId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach((tab, index) => {
        tab.onclick = () => {
            // 모든 탭과 콘텐츠에서 active 클래스 제거
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // 클릭된 탭과 해당 콘텐츠에 active 클래스 추가
            tab.classList.add('active');
            contents[index].classList.add('active');
            
            // 채팅 탭이 활성화된 경우 채팅 기능 초기화
            if (tab.dataset.tab === "chat") {
                setupChat(matchId);
            }
        };
    });
    
    // 기본적으로 첫 번째 탭(라인업)을 활성화
    if (tabs.length > 0 && contents.length > 0) {
        tabs[0].classList.add('active');
        contents[0].classList.add('active');
    }
}

// 채팅 기능 (실시간 반영)
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

  // 기존 setInterval로 불러오는 부분 삭제하고, onSnapshot으로 실시간 반영
  if (window.chatUnsubscribe) window.chatUnsubscribe();

  // Firestore의 onSnapshot 메서드로 실시간 수신
  // SDK v10+ 기준, import 필요: onSnapshot
  // window.firebase.onSnapshot이 있는지 확인(없으면 import 문 추가 필요)
  // 아래는 CDN 환경 가정, window.firebase에 onSnapshot이 연결되어 있다고 가정
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

  // 메시지 전송
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

// =================== [공지 일주일 닫기 기능 추가] ===================

// 공지 닫기 (일주일간)
function closeNoticeForWeek() {
    const noticeElement = document.getElementById('topNotice');
    const currentTime = new Date().getTime();
    
    // 현재 시간을 localStorage에 저장
    localStorage.setItem('noticeClosed', currentTime);
    
    // 공지 숨기기
    if (noticeElement) noticeElement.style.display = 'none';
}

// 페이지 로드 시 공지 표시 여부 확인
function checkNoticeVisibility() {
    const noticeElement = document.getElementById('topNotice');
    const noticeClosed = localStorage.getItem('noticeClosed');
    
    if (noticeElement) {
      if (noticeClosed) {
          const closedTime = parseInt(noticeClosed);
          const currentTime = new Date().getTime();
          const oneWeek = 7 * 24 * 60 * 60 * 1000; // 일주일을 밀리초로 변환
          
          // 일주일이 지났는지 확인
          if (currentTime - closedTime < oneWeek) {
              // 아직 일주일이 안 지났으면 공지 숨기기
              noticeElement.style.display = 'none';
          } else {
              // 일주일이 지났으면 localStorage에서 제거하고 공지 표시
              localStorage.removeItem('noticeClosed');
              noticeElement.style.display = 'block';
          }
      } else {
          noticeElement.style.display = 'block';
      }
    }
}
