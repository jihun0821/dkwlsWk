// leaderboard.js - 리더보드 전용 스크립트

// 리더보드 페이지네이션 변수 (접두사로 충돌 방지)
const LEADERBOARD_USERS_PER_PAGE = 15;
let leaderboardCurrentPage = 1;
let leaderboardUsers = [];
let leaderboardLoading = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // Firebase 초기화 대기
    if (window.firebase && window.firebase.getAuth) {
        const auth = window.firebase.getAuth();
        
        // 인증 상태와 관계없이 리더보드 로드
        initializeLeaderboard();
        
        // 인증 상태 변경 감지 (로그인 상태 표시용)
        window.firebase.onAuthStateChanged(auth, (user) => {
            updateLoginStatus(user);
        });
    } else {
        console.error('Firebase SDK가 로드되지 않았습니다.');
        showError('Firebase 초기화 실패');
    }
});

// 리더보드 초기화
async function initializeLeaderboard() {
    if (leaderboardLoading) return;
    
    showLoading(true);
    await loadLeaderboardData();
    showLoading(false);
}

// 리더보드 데이터 로드
async function loadLeaderboardData() {
    if (!window.firebase || !window.firebase.getFirestore) {
        console.error('Firebase가 초기화되지 않았습니다.');
        showError('Firebase 연결 실패');
        return;
    }

    const db = window.firebase.getFirestore();
    leaderboardLoading = true;
    
    try {
        console.log('🔄 리더보드 데이터 로딩 시작...');

        // 1. 사용자 프로필 데이터 병렬 로드
        const [usersSnapshot, pointsSnapshot, votesSnapshot, matchesSnapshot] = await Promise.all([
            window.firebase.getDocs(window.firebase.collection(db, "profiles")),
            window.firebase.getDocs(window.firebase.collection(db, "user_points")),
            window.firebase.getDocs(window.firebase.collection(db, "votes")),
            window.firebase.getDocs(window.firebase.collection(db, "matches"))
        ]);

        console.log(`📊 데이터 로드 완료:
            - 사용자: ${usersSnapshot.size}명
            - 포인트: ${pointsSnapshot.size}건  
            - 투표: ${votesSnapshot.size}건
            - 경기: ${matchesSnapshot.size}경기`);

        // 2. 사용자 프로필 맵 생성
        const userProfiles = new Map();
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            userProfiles.set(doc.id, {
                uid: doc.id,
                nickname: data.nickname || data.email?.split('@')[0] || doc.id,
                email: data.email || ''
            });
        });

        // 3. 포인트 맵 생성  
        const userPoints = new Map();
        pointsSnapshot.forEach(doc => {
            userPoints.set(doc.id, doc.data().points || 0);
        });

        // 4. 완료된 경기 결과 맵 생성
        const finishedMatches = new Map();
        matchesSnapshot.forEach(doc => {
            const matchData = doc.data();
            if (matchData.status === "finished" && matchData.adminResult) {
                finishedMatches.set(doc.id, matchData.adminResult);
            }
        });

        // 5. 사용자별 투표 통계 계산
        const userVoteStats = new Map();
        votesSnapshot.forEach(doc => {
            const vote = doc.data();
            if (!vote.uid || !vote.matchId || !vote.voteType) return;

            if (!userVoteStats.has(vote.uid)) {
                userVoteStats.set(vote.uid, { total: 0, correct: 0 });
            }
            
            const stats = userVoteStats.get(vote.uid);
            stats.total++;
            
            // 정답 체크
            if (finishedMatches.has(vote.matchId) && 
                finishedMatches.get(vote.matchId) === vote.voteType) {
                stats.correct++;
            }
        });

        // 6. 최종 사용자 데이터 생성 및 정렬
        leaderboardUsers = Array.from(userProfiles.values()).map(profile => {
            const voteStats = userVoteStats.get(profile.uid) || { total: 0, correct: 0 };
            const points = userPoints.get(profile.uid) || 0;
            const successRate = voteStats.total > 0 ? 
                Math.round((voteStats.correct / voteStats.total) * 100) : 0;
            
            return {
                ...profile,
                points,
                totalVotes: voteStats.total,
                correctVotes: voteStats.correct,
                successRate
            };
        });

        // 정렬: 포인트 > 성공률 > 참여수 순
        leaderboardUsers.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.successRate !== a.successRate) return b.successRate - a.successRate;
            return b.totalVotes - a.totalVotes;
        });

        console.log(`✅ 리더보드 처리 완료: 총 ${leaderboardUsers.length}명`);
        
        // 첫 페이지 렌더링
        leaderboardCurrentPage = 1;
        renderLeaderboard();

    } catch (error) {
        console.error('❌ 리더보드 로드 실패:', error);
        showError('리더보드 데이터를 불러올 수 없습니다.');
    } finally {
        leaderboardLoading = false;
    }
}

// 리더보드 렌더링
function renderLeaderboard() {
    const tableBody = document.getElementById('leaderboardBody');
    const pageNum = document.getElementById('currentPageNum');
    
    if (!tableBody) {
        console.error('leaderboardBody 요소를 찾을 수 없습니다.');
        return;
    }

    // 현재 페이지 사용자들
    const startIdx = (leaderboardCurrentPage - 1) * LEADERBOARD_USERS_PER_PAGE;
    const endIdx = startIdx + LEADERBOARD_USERS_PER_PAGE;
    const pageUsers = leaderboardUsers.slice(startIdx, endIdx);

    // 빈 상태 처리
    if (leaderboardUsers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 18px; margin-bottom: 10px;">📊</div>
                    아직 리더보드 데이터가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    // 테이블 행 생성
    tableBody.innerHTML = pageUsers.map((user, idx) => {
        const rank = startIdx + idx + 1;
        const nickname = escapeHtml(user.nickname);
        
        // 순위별 스타일
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        return `
            <tr class="leaderboard-row ${rankClass}">
                <td class="rank-cell">
                    ${rank <= 3 ? getRankIcon(rank) : rank}
                </td>
                <td class="nickname-cell">${nickname}</td>
                <td class="games-cell">${user.totalVotes}</td>
                <td class="rate-cell">
                    <span class="success-rate ${getSuccessRateClass(user.successRate)}">${user.successRate}%</span>
                </td>
                <td class="points-cell">
                    <span class="points">${user.points}P</span>
                </td>
            </tr>
        `;
    }).join('');

    // 페이지 번호 업데이트
    if (pageNum) {
        const totalPages = Math.ceil(leaderboardUsers.length / LEADERBOARD_USERS_PER_PAGE);
        pageNum.textContent = `${leaderboardCurrentPage} / ${totalPages}`;
    }

    updatePaginationButtons();
}

// 순위 아이콘 반환
function getRankIcon(rank) {
    const icons = ['🥇', '🥈', '🥉'];
    return icons[rank - 1] || rank;
}

// 성공률 클래스 반환
function getSuccessRateClass(rate) {
    if (rate >= 80) return 'excellent';
    if (rate >= 60) return 'good';
    if (rate >= 40) return 'average';
    return 'poor';
}

// HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 페이지네이션 버튼 상태 업데이트
function updatePaginationButtons() {
    const totalPages = Math.ceil(leaderboardUsers.length / LEADERBOARD_USERS_PER_PAGE);
    
    // 이전/다음 버튼은 HTML에서 onclick으로 처리되므로
    // 여기서는 로그만 출력
    console.log(`페이지 상태: ${leaderboardCurrentPage}/${totalPages}`);
}

// 이전 페이지
function prevPage() {
    if (leaderboardCurrentPage > 1) {
        leaderboardCurrentPage--;
        renderLeaderboard();
        scrollToTop();
    }
}

// 다음 페이지
function nextPage() {
    const totalPages = Math.ceil(leaderboardUsers.length / LEADERBOARD_USERS_PER_PAGE);
    if (leaderboardCurrentPage < totalPages) {
        leaderboardCurrentPage++;
        renderLeaderboard();
        scrollToTop();
    }
}

// 페이지 새로고침
function refreshLeaderboard() {
    if (leaderboardLoading) return;
    
    showLoading(true);
    loadLeaderboardData().finally(() => {
        showLoading(false);
    });
}

// 로딩 상태 표시
function showLoading(show) {
    const tableBody = document.getElementById('leaderboardBody');
    if (!tableBody) return;

    if (show) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner">🔄</div>
                    <div style="margin-top: 10px; color: #666;">리더보드를 불러오는 중...</div>
                </td>
            </tr>
        `;
    }
}

// 에러 메시지 표시
function showError(message) {
    const tableBody = document.getElementById('leaderboardBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
                <div style="color: #e74c3c; font-size: 18px; margin-bottom: 10px;">⚠️</div>
                <div style="color: #666; margin-bottom: 15px;">${message}</div>
                <button onclick="refreshLeaderboard()" class="retry-btn" 
                        style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    다시 시도
                </button>
            </td>
        </tr>
    `;
}

// 로그인 상태 업데이트 (옵션)
function updateLoginStatus(user) {
    // 로그인 상태에 따른 UI 업데이트가 필요한 경우 여기에 구현
    console.log('로그인 상태:', user ? '로그인됨' : '로그아웃됨');
}

// 맨 위로 스크롤
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 전역 함수 노출
window.prevPage = prevPage;
window.nextPage = nextPage;
window.refreshLeaderboard = refreshLeaderboard;

// 키보드 단축키 (옵션)
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT') return; // 입력 중일 때는 무시
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            e.preventDefault();
            prevPage();
            break;
        case 'ArrowRight':  
        case 'd':
            e.preventDefault();
            nextPage();
            break;
        case 'r':
            e.preventDefault();
            refreshLeaderboard();
            break;
    }
});

// 자동 새로고침 (5분마다, 옵션)
setInterval(() => {
    if (!leaderboardLoading && document.visibilityState === 'visible') {
        console.log('🔄 자동 새로고침...');
        loadLeaderboardData();
    }
}, 5 * 60 * 1000); // 5분
