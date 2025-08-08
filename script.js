// 테마 버튼
const matchDetailsPanel = document.getElementById("matchDetailsPanel");
const overlay = document.getElementById("overlay");
const closePanelBtn = document.getElementById("closePanelBtn");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");

let currentPage = 6;
const matchesPerPage = 5;

// 관리자 권한 관련 전역 변수
let isAdmin = false;

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

// 관리자 권한 확인 함수
async function checkAdminStatus() {
    const user = auth.currentUser;
    console.log("=== 관리자 권한 확인 시작 ===");
    console.log("현재 사용자:", user?.email);
    
    if (user) {
        try {
            const adminDocRef = window.firebase.doc(db, "admins", user.email);
            const adminDoc = await window.firebase.getDoc(adminDocRef);
            
            console.log("Firestore 문서 존재:", adminDoc.exists());
            console.log("문서 데이터:", adminDoc.data());
            
            isAdmin = adminDoc.exists();
            console.log("최종 isAdmin 값:", isAdmin);
            
            if (isAdmin) {
                const adminWriteBtn = document.getElementById('adminWriteBtn');
                if (adminWriteBtn) {
                    adminWriteBtn.style.display = 'block';
                }
                console.log("관리자 버튼 표시 완료");
            }
        } catch (error) {
            console.error("관리자 권한 확인 실패:", error);
            isAdmin = false;
        }
    } else {
        isAdmin = false;
        console.log("사용자 로그인되지 않음");
    }
    
    console.log("=== 관리자 권한 확인 완료 ===");
}

// 사용자 포인트 관련 함수들
async function getUserPoints(uid) {
    try {
        const pointsDocRef = window.firebase.doc(db, "user_points", uid);
        const pointsDoc = await window.firebase.getDoc(pointsDocRef);
        
        if (pointsDoc.exists()) {
            return pointsDoc.data().points || 0;
        } else {
            // 포인트 문서가 없으면 0포인트로 초기화
            await window.firebase.setDoc(pointsDocRef, { points: 0, uid: uid });
            return 0;
        }
    } catch (error) {
        console.error("포인트 조회 실패:", error);
        return 0;
    }
}

async function updateUserPoints(uid, pointsToAdd) {
    try {
        const pointsDocRef = window.firebase.doc(db, "user_points", uid);
        const pointsDoc = await window.firebase.getDoc(pointsDocRef);
        
        let currentPoints = 0;
        if (pointsDoc.exists()) {
            currentPoints = pointsDoc.data().points || 0;
        }
        
        const newPoints = currentPoints + pointsToAdd;
        await window.firebase.setDoc(pointsDocRef, { 
            points: newPoints, 
            uid: uid,
            lastUpdated: new Date()
        });
        
        return newPoints;
    } catch (error) {
        console.error("포인트 업데이트 실패:", error);
        throw error;
    }
}

// 관리자 결과 선택 및 포인트 지급 함수
async function setMatchResult(matchId, result) {
    if (!isAdmin) {
        alert("관리자 권한이 필요합니다.");
        return;
    }
    
    try {
        // 경기 상태를 finished로 변경하고 결과 저장
        const matchRef = window.firebase.doc(db, "matches", matchId);
        await window.firebase.setDoc(matchRef, {
            status: "finished",
            adminResult: result,
            resultSetAt: new Date(),
            resultSetBy: auth.currentUser.email
        }, { merge: true });
        
        // 해당 경기의 모든 투표 조회
        const votesQuery = window.firebase.query(
            window.firebase.collection(db, 'votes'),
            window.firebase.where('matchId', '==', matchId)
        );
        
        const votesSnapshot = await window.firebase.getDocs(votesQuery);
        const winnerUids = [];
        
        // 맞춘 사용자들 찾기
        votesSnapshot.forEach(doc => {
            const voteData = doc.data();
            if (voteData.voteType === result) {
                winnerUids.push(voteData.uid);
            }
        });
        
        // 맞춘 사용자들에게 100포인트 지급
        const pointPromises = winnerUids.map(async (uid) => {
            try {
                await updateUserPoints(uid, 100);
                console.log(`사용자 ${uid}에게 100포인트 지급 완료`);
            } catch (error) {
                console.error(`사용자 ${uid} 포인트 지급 실패:`, error);
            }
        });
        
        await Promise.all(pointPromises);
        
        alert(`경기 결과가 설정되었습니다. ${winnerUids.length}명의 사용자에게 100포인트가 지급되었습니다.`);
        
        // 패널 새로고침
        loadMatchDetails(matchId);
        
    } catch (error) {
        console.error("경기 결과 설정 실패:", error);
        alert("경기 결과 설정에 실패했습니다.");
    }
}

// 전역 함수로 노출 (HTML onclick에서 사용하기 위해)
window.setMatchResult = setMatchResult;

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

// showUserProfile 함수 (포인트 표시 포함)
async function showUserProfile() {
    // Firebase 인증 상태 변화 감지
    window.firebase.onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const profileDocRef = window.firebase.doc(db, "profiles", user.uid);
                const profileDoc = await window.firebase.getDoc(profileDocRef);
                
                let profileData = {
                    email: user.email,
                    nickname: user.displayName || user.email.split('@')[0],
                    avatar_url: user.photoURL
                };
                
                if (profileDoc.exists()) {
                    profileData = { ...profileData, ...profileDoc.data() };
                }
                
                // 사용자 포인트 조회
                const userPoints = await getUserPoints(user.uid);
                profileData.points = userPoints;
                
                // ✅ 관리자 권한 확인 (중요!)
                await checkAdminStatus();
                
                updateUIForAuthState(true, profileData);
            } catch (error) {
                console.error("프로필 로드 실패:", error);
                updateUIForAuthState(false);
            }
        } else {
            isAdmin = false;
            updateUIForAuthState(false);
        }
    });
}

function updateUIForAuthState(isLoggedIn, profileData = null) {
    const profileBox = document.getElementById('profile-box');
    
    if (isLoggedIn && profileData) {
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nickname || 'USER')}&background=667eea&color=fff&size=35&bold=true`;
        const avatarUrl = profileData.avatar_url || defaultAvatar;
        const points = profileData.points || 0;
        
        profileBox.innerHTML = `
            <div class="profile-bar">
                <img id="profileAvatar" src="${avatarUrl}" alt="프로필" class="profile-avatar">
                <div class="profile-info">
                    <span class="profile-nickname">${profileData.nickname || '사용자'}</span>
                    <span class="profile-points">${points}P</span>
                </div>
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
        const settingsBtn = document.getElementById('profileSettingsBtn');
        const settingsMenu = document.getElementById('profileSettingsMenu');
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.style.display = (settingsMenu.style.display === 'none' || settingsMenu.style.display === '') ? 'block' : 'none';
        };
        
        document.addEventListener('click', function hideMenu(e) {
            if (settingsMenu && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
                settingsMenu.style.display = 'none';
            }
        }, { once: true });
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') document.getElementById('themeLight').checked = true;
        else if (savedTheme === 'dark') document.getElementById('themeDark').checked = true;
        else document.getElementById('themeSystem').checked = true;
        document.getElementById('themeSystem').onclick = () => { setTheme('system'); };
        document.getElementById('themeLight').onclick = () => { setTheme('light'); };
        document.getElementById('themeDark').onclick = () => { setTheme('dark'); };
        
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

        document.getElementById('loginBtn').onclick = () => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'flex';
            } else {
                console.error('loginModal 요소를 찾을 수 없습니다.');
            }
        };
        
        const settingsBtn = document.getElementById('profileSettingsBtn');
        const settingsMenu = document.getElementById('profileSettingsMenu');
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        };
        
        document.addEventListener('click', (e) => {
            if (settingsMenu && !settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsMenu.style.display = 'none';
            }
        });
        
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
            const docRef = window.firebase.doc(db, 'profiles', user.uid);
            await window.firebase.setDoc(docRef, { nickname: newNickname }, { merge: true });
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

// loadMatchDetails 함수 (관리자 버튼 포함)
async function loadMatchDetails(matchId) {
    console.log("=== loadMatchDetails 시작 ===");
    console.log("matchId:", matchId);
    console.log("현재 isAdmin 값:", isAdmin);

    const matchDetails = await getMatchDetailsById(matchId);
    if (!matchDetails) return;

    console.log("경기 상태:", matchDetails.status);
    console.log("기존 결과:", matchDetails.adminResult);

    panelTitle.textContent = `${matchDetails.homeTeam} vs ${matchDetails.awayTeam}`;

    const isLoggedIn = !!auth.currentUser;
    const userVoted = isLoggedIn ? await hasUserVoted(matchId) : false;
    const stats = await getVotingStatsFromFirestore(matchId);

    let predictionHtml = "";

    // ✅ 관리자 버튼 표시 조건 확인 (디버깅 추가)
    const showAdminButtons = matchDetails.status === "finished" && isAdmin && !matchDetails.adminResult;
    console.log("관리자 버튼 표시 조건:");
    console.log("- 경기 상태 finished:", matchDetails.status === "finished");
    console.log("- 관리자 권한:", isAdmin);
    console.log("- 결과 미설정:", !matchDetails.adminResult);
    console.log("- 최종 표시 여부:", showAdminButtons);

    if (showAdminButtons) {
        predictionHtml = `
            <h3>경기 결과 설정 (관리자)</h3>
            <div class="admin-result-btns">
                <button class="admin-result-btn home-win" onclick="setMatchResult('${matchId}', 'homeWin')">홈팀 승</button>
                <button class="admin-result-btn draw" onclick="setMatchResult('${matchId}', 'draw')">무승부</button>
                <button class="admin-result-btn away-win" onclick="setMatchResult('${matchId}', 'awayWin')">원정팀 승</button>
            </div>
            <h3>승부예측 결과</h3><div id="votingStats"></div>
        `;
        console.log("관리자 버튼 HTML 생성 완료");
    }
    // 관리자가 결과를 이미 설정한 경우
    else if (matchDetails.status === "finished" && matchDetails.adminResult) {
        const resultText = {
            'homeWin': '홈팀 승',
            'draw': '무승부', 
            'awayWin': '원정팀 승'
        }[matchDetails.adminResult] || '결과 미정';

        predictionHtml = `
            <h3>경기 결과: ${resultText}</h3>
            <h3>승부예측 결과</h3><div id="votingStats"></div>
        `;
    }
    // 예정된 경기의 승부예측
    else if (matchDetails.status === "scheduled") {
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
    }
    // 기타 경기 상태
    else {
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

    setupPanelTabs(matchId);

    // 일반 사용자 승부예측 버튼 이벤트
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

    console.log("=== loadMatchDetails 완료 ===");
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
