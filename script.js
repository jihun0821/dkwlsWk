// ✅ renderMatches 함수 - 메인(index.html)과 schedule.html에서만 실행
async function renderMatches() {
    // 리더보드 페이지에서는 경기 렌더링을 하지 않음
    if (isLeaderboardPage()) {
        console.log("리더보드 페이지 - renderMatches 실행 건너뜀");
        return;
    }

    // index.html, schedule.html 에서만 실행
    const isSchedulePage = window.location.pathname.includes("schedule.html");
    const isIndexPage = window.location.pathname.endsWith("/") || window.location.pathname.includes("index.html");

    if (!isSchedulePage && !isIndexPage) {
        console.log("해당 페이지에서 renderMatches 실행 건너뜀");
        return;
    }

    const matchContainer = document.querySelector("section.main");
    if (!matchContainer) {
        console.log("경기 컨테이너가 없음 - renderMatches 실행 건너뜀");
        return;
    }

    console.log("renderMatches 실행 시작");
    const allMatches = Object.values(await getAllMatchData());

    // ✅ 페이지네이션 적용 (index.html, schedule.html 동일)
    const matchesToShow = allMatches.slice((currentPage - 1) * matchesPerPage, currentPage * matchesPerPage);

    // 기존 경기 목록 제거
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

    if (pagination) {
        pagination.insertAdjacentHTML("beforebegin", html);
    } else {
        matchContainer.innerHTML += html;
    }

    setupMatchClickListeners();
    updateButtons(); // 페이지 버튼도 함께 갱신
    console.log("renderMatches 실행 완료");
}
