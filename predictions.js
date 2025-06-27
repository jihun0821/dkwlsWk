// predictions.js
let currentUser = null;
let currentCategory = null;
let selectedOption = null;

// Firebase 초기화 대기
window.addEventListener('DOMContentLoaded', () => {
    // 인증 상태 변경 감지
    if (window.firebase && window.firebase.onAuthStateChanged) {
        const auth = window.firebase.getAuth();
        window.firebase.onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                loadUserPredictions();
                loadChartData();
            }
        });
    }
});

const predictionOptions = {
    scorer: [
        '이승민', '김태현', '박준호', '최민수', '정우진',
        '한동원', '김민성', '이재혁', '박성훈', '조영수'
    ],
    champion: [
        // 우승팀 예측용 실질적 선택지 (select에서만 사용)
        'C101','C102','C103','C104','C105','C106',
        'C201','C202','C203','C204','C205','C206','C207',
        'C301','C302','C303','C304','C305','C306','C307'
    ],
    assist: [
        '김현우', '박지훈', '이동현', '최준영', '정민호',
        '한승우', '김동민', '이성민', '박태준', '조민수'
    ]
};

const categoryTitles = {
    scorer: '🥅 득점왕 예측',
    champion: '🏆 우승팀 예측',
    assist: '🅰️ 도움왕 예측'
};

// 예측 모달 열기
function openPredictionModal(category) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    currentCategory = category;
    selectedOption = null;
    
    const modal = document.getElementById('predictionModal');
    const title = document.getElementById('modal-title');
    const inputContainer = document.getElementById('prediction-input-container');
    const inputBox = document.getElementById('prediction-input');
    const submitBtn = document.getElementById('submit-prediction');

    title.textContent = categoryTitles[category];
    
    // 기존 input/select 초기화
    inputContainer.innerHTML = '';
    inputContainer.style.display = 'block';
    submitBtn.disabled = true;
    modal.style.display = 'block';

if (category === 'champion') {
    // Select로 변경
    const select = document.createElement('select');
    select.id = 'prediction-select';
    select.className = 'prediction-select';
    
    // 인라인 스타일로 강제 적용 (CSS가 적용되지 않는 경우 대비)
    const isDarkMode = !document.body.classList.contains('light-mode');
    
    select.style.cssText = `
        width: 100% !important;
        padding: 12px 40px 12px 15px !important;
        font-size: 16px !important;
        font-family: inherit !important;
        border: 2px solid ${isDarkMode ? '#4a4a4a' : '#d1d5db'} !important;
        border-radius: 10px !important;
        background-color: ${isDarkMode ? '#2a2a2a' : '#ffffff'} !important;
        color: ${isDarkMode ? '#ffffff' : '#121212'} !important;
        outline: none !important;
        transition: all 0.3s ease !important;
        margin-bottom: 20px !important;
        box-sizing: border-box !important;
        cursor: pointer !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%23ffffff' : '%23374151'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
        background-repeat: no-repeat !important;
        background-position: right 12px center !important;
        background-size: 20px 20px !important;
    `;
    
    select.innerHTML = `<option value="">우승팀을 선택하세요</option>` +
        predictionOptions.champion.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    
    inputContainer.appendChild(select);

    // 호버/포커스 이벤트 추가
    select.addEventListener('mouseenter', function() {
        this.style.borderColor = '#667eea';
        this.style.backgroundColor = isDarkMode ? '#333333' : '#f9fafb';
    });
    
    select.addEventListener('mouseleave', function() {
        if (document.activeElement !== this) {
            this.style.borderColor = isDarkMode ? '#4a4a4a' : '#d1d5db';
            this.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#ffffff';
        }
    });
    
    select.addEventListener('focus', function() {
        this.style.borderColor = '#667eea';
        this.style.backgroundColor = isDarkMode ? '#333333' : '#f8f9ff';
        this.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
    });
    
    select.addEventListener('blur', function() {
        this.style.borderColor = isDarkMode ? '#4a4a4a' : '#d1d5db';
        this.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#ffffff';
        this.style.boxShadow = 'none';
    });

    select.onchange = function() {
        if (select.value) {
            selectedOption = select.value;
            submitBtn.disabled = false;
        } else {
                selectedOption = null;
                submitBtn.disabled = true;
            }
        };
    }
}

async function submitPrediction() {
    if (!currentUser || !currentCategory || !selectedOption) {
        return;
    }
    
    try {
        const db = window.firebase.getFirestore();
        const userEmail = currentUser.email;
        const timestamp = new Date().toISOString();

        // 기존 선택 불러오기
        const userPredictionsRef = window.firebase.doc(db, 'predictions', userEmail);
        const userDoc = await window.firebase.getDoc(userPredictionsRef);
        let previousChoice = null;
        if (userDoc.exists() && userDoc.data()[currentCategory]) {
            previousChoice = userDoc.data()[currentCategory].choice;
        }

        // 만약 기존 선택과 같으면 아무 것도 하지 않음
        if (previousChoice === selectedOption) {
            alert('이미 동일한 예측을 하셨습니다!');
            closePredictionModal();
            return;
        }

        // 통계 업데이트
        const statsRef = window.firebase.doc(db, 'prediction_stats', currentCategory);
        const statsDoc = await window.firebase.getDoc(statsRef);

        let currentStats = {};
        if (statsDoc.exists()) {
            currentStats = statsDoc.data();
        }

        // 기존 선택이 있었다면 감소
        if (previousChoice && currentStats[previousChoice]) {
            currentStats[previousChoice] = Math.max(0, (currentStats[previousChoice] || 0) - 1);
        }
        // 새 선택 증가
        currentStats[selectedOption] = (currentStats[selectedOption] || 0) + 1;

        // 1. 유저별 예측값 덮어쓰기
        await window.firebase.setDoc(
            userPredictionsRef,
            {
                [currentCategory]: {
                    choice: selectedOption,
                    timestamp: timestamp
                }
            },
            { merge: true }
        );
        // 2. 통계 업데이트
        await window.firebase.setDoc(statsRef, currentStats);

        // UI 업데이트
        updateUserPredictionDisplay(currentCategory, selectedOption);
        updateCategoryButton(currentCategory);
        loadChartData();
        
        closePredictionModal();
        
    } catch (error) {
        console.error('예측 저장 실패:', error);
        alert('예측 저장에 실패했습니다. 다시 시도해주세요.');
    }
}

// 사용자 예측 표시 업데이트
function updateUserPredictionDisplay(category, choice) {
    const predictionDiv = document.getElementById(`${category}-prediction`);
    predictionDiv.textContent = `내 예측: ${choice}`;
    predictionDiv.style.display = 'block';
}

// 카테고리 버튼 업데이트
function updateCategoryButton(category) {
    const button = document.querySelector(`[onclick="openPredictionModal('${category}')"]`);
    if (button) {
        button.textContent = '예측 변경';
        button.style.background = '#28a745';
    }
}

// 사용자 예측 로드
async function loadUserPredictions() {
    if (!currentUser) return;
    
    try {
        const db = window.firebase.getFirestore();
        const userDoc = await window.firebase.getDoc(
            window.firebase.doc(db, 'predictions', currentUser.email)
        );
        
        if (userDoc.exists()) {
            const predictions = userDoc.data();
            
            Object.keys(predictions).forEach(category => {
                if (predictions[category] && predictions[category].choice) {
                    updateUserPredictionDisplay(category, predictions[category].choice);
                    updateCategoryButton(category);
                }
            });
        }
    } catch (error) {
        console.error('사용자 예측 로드 실패:', error);
    }
}

// 차트 데이터 로드 및 표시
async function loadChartData() {
    try {
        const db = window.firebase.getFirestore();
        
        for (const category of Object.keys(predictionOptions)) {
            const statsDoc = await window.firebase.getDoc(
                window.firebase.doc(db, 'prediction_stats', category)
            );
            
            let stats = {};
            if (statsDoc.exists()) {
                stats = statsDoc.data();
            }
            
            renderChart(category, stats);
        }
    } catch (error) {
        console.error('차트 데이터 로드 실패:', error);
    }
}

function renderChart(category, stats) {
    const chartContainer = document.getElementById(`${category}-chart`);
    if (!chartContainer) return;

    // 득표수 내림차순, 동률시 이름 오름차순
    const sortedData = Object.entries(stats)
        .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            if (!isNaN(a[0]) && !isNaN(b[0])) return Number(a[0]) - Number(b[0]);
            return a[0].localeCompare(b[0], 'ko');
        });

    // 전체 투표수 계산
    const totalVotes = Object.values(stats).reduce((sum, v) => sum + v, 0) || 1;

    chartContainer.innerHTML = '';

    if (sortedData.length === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; color: #666;">아직 예측이 없습니다.</p>';
        return;
    }

    // 상위 3개만 기본 표시, 4위 이후는 숨김
    const visibleCount = 3;
    const hasOverflow = sortedData.length > visibleCount;
    const chartList = document.createElement('div');
    chartList.className = 'chart-list';

    sortedData.forEach(([option, votes], index) => {
        // 전체 투표수 대비 퍼센트
        const percentage = (votes / totalVotes) * 100;
        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        if (index >= visibleCount) {
            chartItem.classList.add('chart-overflow');
            chartItem.style.display = 'none';
        }

        chartItem.innerHTML = `
            <div class="chart-label">
                <span>${option}</span>
                <span>${votes}표</span>
            </div>
            <div class="chart-bar">
                <div class="chart-fill" style="width: ${percentage}%">
                    ${percentage.toFixed(1)}%
                </div>
                ${index < 3 ? `<div class="rank-badge ${index === 1 ? 'second' : index === 2 ? 'third' : ''}">${index + 1}위</div>` : ''}
            </div>
        `;
        chartList.appendChild(chartItem);
    });

    chartContainer.appendChild(chartList);

    if (hasOverflow) {
        const moreBtn = document.createElement('button');
        moreBtn.className = 'chart-more-btn';
        moreBtn.textContent = '더보기';
        moreBtn.onclick = function () {
            const overflowItems = chartList.querySelectorAll('.chart-overflow');
            const anyHidden = Array.from(overflowItems).some(item => item.style.display === 'none');
            overflowItems.forEach(item => {
                item.style.display = anyHidden ? 'block' : 'none';
            });
            moreBtn.textContent = anyHidden ? '접기' : '더보기';
        };
        chartContainer.appendChild(moreBtn);
    }
}

// 모달 외부 클릭시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('predictionModal');
    if (event.target === modal) {
        closePredictionModal();
    }
}

function closePredictionModal() {
    const modal = document.getElementById('predictionModal');
    if (modal) {
        modal.style.display = 'none';
        const inputContainer = document.getElementById('prediction-input-container');
        if (inputContainer) inputContainer.innerHTML = '';
        const submitBtn = document.getElementById('submit-prediction');
        if (submitBtn) submitBtn.disabled = true;
    }
}
window.closePredictionModal = closePredictionModal;
