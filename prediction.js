// prediction.js
// Firebase 객체/인증(db, auth)는 window.firebase와 window.db, window.auth로 이미 정의되어 있다고 가정

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