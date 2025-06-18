// prediction.js
async function fetchPredictionStats() {
  const db = window.firebase.getFirestore();
  const predictionsCol = window.firebase.collection(db, "predictions");
  const snapshot = await window.firebase.getDocs(predictionsCol);

  // 득점왕/도움왕/우승팀별 집계 객체
  const stats = {
    topScorer: {},
    topAssist: {},
    championTeam: {}
  };
  let total = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    total++;
    ["topScorer", "topAssist", "championTeam"].forEach(key => {
      const val = (data[key] || "").trim();
      if (val) {
        stats[key][val] = (stats[key][val] || 0) + 1;
      }
    });
  });

  return {stats, total};
}

// 표 생성 함수
function renderPredictionStatsTable(statsObj, total) {
  function makeTable(title, stats) {
    // 득표순 정렬
    const items = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    if (items.length === 0) return `<div style="color:#aaa;">아직 예측이 없습니다.</div>`;
    return `
      <table style="width:100%;margin-bottom:1em;font-size:0.98em;">
        <thead><tr><th style="text-align:left;">${title}</th><th style="text-align:right;">득표수</th><th style="text-align:right;">%</th></tr></thead>
        <tbody>
          ${items.map(([name, cnt]) =>
            `<tr><td>${name}</td><td style="text-align:right;">${cnt}</td><td style="text-align:right;">${((cnt / total) * 100).toFixed(1)}%</td></tr>`
          ).join("")}
        </tbody>
      </table>
    `;
  }
  return `
    ${makeTable("득점왕", statsObj.topScorer)}
    ${makeTable("도움왕", statsObj.topAssist)}
    ${makeTable("우승팀", statsObj.championTeam)}
  `;
}

// 집계 결과를 화면에 표시
async function showPredictionStatsGraph() {
  const container = document.getElementById("predictionStatsGraph");
  if (!container) return;
  container.innerHTML = "로딩 중...";
  try {
    const {stats, total} = await fetchPredictionStats();
    container.innerHTML = renderPredictionStatsTable(stats, total);
  } catch (e) {
    container.innerHTML = `<div style="color:red;">집계 데이터를 불러올 수 없습니다.</div>`;
    console.error(e);
  }
}

// 페이지 로드/예측 제출 시 집계표 갱신
window.showPredictionStatsGraph = showPredictionStatsGraph;
document.addEventListener("DOMContentLoaded", showPredictionStatsGraph);

// 예측 제출 후 집계 갱신 (기존 제출 함수 끝에 호출)
const form = document.getElementById("predictionForm");
if (form) {
  form.addEventListener("submit", async function(e) {
    // ... 기존 제출 처리 ...
    setTimeout(showPredictionStatsGraph, 1000); // 예측 제출 후 1초 뒤 갱신
  });
}
document.addEventListener('DOMContentLoaded', function () {
  // 예측 영역 노출 제어
  function showPredictionSection(isLoggedIn) {
    document.getElementById('prediction-section').style.display = isLoggedIn ? 'block' : 'none';
  }

  // 로그인 상태 연동
  if (window.auth) {
    window.firebase.onAuthStateChanged(window.auth, user => {
      showPredictionSection(!!user);
      if (user) loadMyPrediction();
    });
  }

  // 예측 폼 제출
  document.getElementById('predictionForm').onsubmit = async function (e) {
    e.preventDefault();
    const user = window.auth.currentUser;
    if (!user) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    const topScorer = this.topScorer.value.trim();
    const topAssist = this.topAssist.value.trim();
    const championTeam = this.championTeam.value.trim();

    const docRef = window.firebase.doc(window.db, 'semester_predictions', user.uid);
    await window.firebase.setDoc(docRef, {
      uid: user.uid,
      topScorer, topAssist, championTeam,
      updatedAt: new Date()
    });
    document.getElementById('myPredictionResult').innerText = "예측이 저장되었습니다!";
    loadMyPrediction();
  };

  // 내 예측 불러오기
  async function loadMyPrediction() {
    const user = window.auth.currentUser;
    const myDiv = document.getElementById('myPredictionResult');
    if (!user) return;
    const docRef = window.firebase.doc(window.db, 'semester_predictions', user.uid);
    const docSnap = await window.firebase.getDoc(docRef);
    if (docSnap.exists()) {
      const d = docSnap.data();
      myDiv.innerHTML = `<b>나의 예측</b><br>득점왕: ${d.topScorer}<br>도움왕: ${d.topAssist}<br>우승팀: ${d.championTeam}`;
    } else {
      myDiv.innerHTML = '';
    }
  }
});
