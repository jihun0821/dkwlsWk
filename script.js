// === 요소 참조 ===
const toggleThemeBtn = document.getElementById("toggleThemeBtn");
const matchDetailsPanel = document.getElementById("matchDetailsPanel");
const overlay = document.getElementById("overlay");
const closePanelBtn = document.getElementById("closePanelBtn");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");

let currentPage = 6;
const matchesPerPage = 4;
const totalPages = Math.ceil(Object.keys(getAllMatchData()).length / matchesPerPage);

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// === 테마 설정 + 초기화 ===
window.onload = function () {
    const savedTheme = localStorage.getItem("theme");
    const body = document.body;

    if (savedTheme === "light") {
        body.classList.add("light-mode");
        toggleThemeBtn.textContent = "☀️";
    } else {
        body.classList.remove("light-mode");
        toggleThemeBtn.textContent = "🌙";
    }

    // 페이지네이션이 있는 경우와 없는 경우 구분
    const pagination = document.querySelector('.pagination-container');
    if (pagination) {
        renderMatches();
        updateButtons();
    } else {
        setupMatchClickListeners(); // 정적 HTML에서의 .match 이벤트 등록
    }
};

toggleThemeBtn?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    if (document.body.classList.contains("light-mode")) {
        localStorage.setItem("theme", "light");
        toggleThemeBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "dark");
        toggleThemeBtn.textContent = "🌙";
    }
});

// === 경기 목록 렌더링 (페이지네이션) ===
function renderMatches() {
    const allMatches = Object.values(getAllMatchData());
    const start = (currentPage - 1) * matchesPerPage;
    const end = start + matchesPerPage;
    const matchesToShow = allMatches.slice(start, end);

    // 기존 match-list 삭제
    document.querySelectorAll(".match-list").forEach(el => el.remove());

    const pagination = document.querySelector(".pagination-container");
    const matchHtml = matchesToShow.map(match => `
        <div class="match-list">
            <div class="match" data-match-id="${match.id}">
                <div class="match-info">
                    <div class="match-date">${match.date}</div>
                    <div class="match-teams">
                        <span class="team home">${match.homeTeam}</span>
                        <span class="score">${match.status === "cancelled" ? "연기" : `${match.homeScore} - ${match.awayScore}`}</span>
                        <span class="team away">${match.awayTeam}</span>
                    </div>
                </div>
            </div>
            <p></p>
        </div>
    `).join("");

    pagination.insertAdjacentHTML("beforebegin", matchHtml);
    setupMatchClickListeners(); // 새로 생성된 .match에 클릭 이벤트 부여
}

function updateButtons() {
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

prevBtn?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateButtons();
        renderMatches();
    }
});

nextBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        updateButtons();
        renderMatches();
    }
});

// === 경기 데이터 가져오기 ===
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
        "23": getMatchDetailsById("20"),
        "24": getMatchDetailsById("24")
    };
}

// === 상세 정보 패널 열기 ===
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

// === 상세 정보 패널 내용 불러오기 ===
function loadMatchDetails(matchId) {
    const matchDetails = getMatchDetailsById(matchId);
    panelTitle.textContent = `${matchDetails.homeTeam} vs ${matchDetails.awayTeam}`;

    const predictionHtml = `
        <div class="prediction-container">
            <h3>승부예측 결과</h3>
            <div id="votingStats">
                <p>승부예측 기능이 현재 비활성화되었습니다.</p>
            </div>
        </div>
    `;

    panelContent.innerHTML = `
        <div class="match-detail-header">
            <div class="match-date">${matchDetails.date}</div>
            <div class="match-league">${matchDetails.league}</div>
        </div>

        <div class="match-score">
            <div class="team-info"><div class="team-name">${matchDetails.homeTeam}</div></div>
            <div class="score-display">${matchDetails.homeScore} - ${matchDetails.awayScore}</div>
            <div class="team-info"><div class="team-name">${matchDetails.awayTeam}</div></div>
        </div>

        ${predictionHtml}

        <div class="tab-container">
            <div class="tabs">
                <div class="tab active" data-tab="timeline">타임라인</div>
                <div class="tab" data-tab="lineups">라인업</div>
                <div class="tab" data-tab="stats">통계</div>
            </div>

            <div class="tab-content" id="timelineTab">타임라인 정보 없음</div>
            <div class="tab-content" id="lineupsTab" style="display:none;">라인업 정보 없음</div>
            <div class="tab-content" id="statsTab" style="display:none;">통계 정보 없음</div>
        </div>
    `;

    const tabs = panelContent.querySelectorAll('.tab');
    const tabContents = panelContent.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            this.classList.add('active');
            const tabName = this.dataset.tab;
            const activeTab = document.getElementById(`${tabName}Tab`);
            if (activeTab) activeTab.style.display = 'block';
        });
    });
}

// === .match 클릭 이벤트 연결 ===
function setupMatchClickListeners() {
    document.querySelectorAll('.match').forEach(match => {
        match.addEventListener('click', () => {
            openPanel(match.getAttribute('data-match-id'));
        });
    });

    closePanelBtn?.addEventListener('click', closePanel);
    overlay?.addEventListener('click', closePanel);
}

// === 모달 연결 ===
document.addEventListener("DOMContentLoaded", () => {
    const moreLink = document.getElementById("moreLink");
    const moreModal = document.getElementById("moreModal");
    const closeMoreModal = document.getElementById("closeMoreModal");

    if (moreLink && moreModal && closeMoreModal) {
        moreLink.addEventListener("click", function (e) {
            e.preventDefault();
            moreModal.style.display = "block";
        });

        closeMoreModal.addEventListener("click", function () {
            moreModal.style.display = "none";
        });

        window.addEventListener("click", function (e) {
            if (e.target === moreModal) {
                moreModal.style.display = "none";
            }
        });
    }
});
