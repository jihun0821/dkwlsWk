// admin-points.js

// 관리자 권한 확인 함수 (콜백방식)
export function checkAdminStatus(callback) {
    const auth = window.firebase.getAuth();
    window.firebase.onAuthStateChanged(auth, async (user) => {
        if (!user) return callback(false, null);
        const db = window.firebase.getFirestore();
        const adminDocRef = window.firebase.doc(db, "admins", user.email);
        try {
            const adminDoc = await window.firebase.getDoc(adminDocRef);
            const isAdmin = adminDoc.exists();
            callback(isAdmin, user);
        } catch (error) {
            console.error("관리자 권한 확인 실패:", error);
            callback(false, null);
        }
    });
}

// 경기 결과 선택 UI 및 로직 (관리자만)
// finished 상태의 경기 상세 패널에 붙여야 함
export function renderAdminResultSelector(matchId, container, onResultSelected) {
    // container: 관리자 UI를 넣을 DOM 요소
    container.innerHTML = `
        <div class="admin-result-selector">
            <span style="font-weight:bold;">관리자 결과 선택: </span>
            <button data-result="homeWin">홈 승</button>
            <button data-result="draw">무승부</button>
            <button data-result="awayWin">원정 승</button>
        </div>
    `;
    container.querySelectorAll("button[data-result]").forEach(btn => {
        btn.onclick = () => {
            const selected = btn.getAttribute("data-result");
            onResultSelected(selected, matchId);
        };
    });
}

// 결과 발표 및 포인트 지급
export async function awardPointsForMatch(matchId, answer) {
    const db = window.firebase.getFirestore();
    // 1. 해당 경기의 승부예측 참여자(votes 컬렉션) 중, 정답자 필터
    const voteQuery = window.firebase.query(
        window.firebase.collection(db, "votes"),
        window.firebase.where("matchId", "==", matchId),
        window.firebase.where("voteType", "==", answer)
    );
    const voteSnap = await window.firebase.getDocs(voteQuery);

    if (voteSnap.empty) {
        alert("정답자가 없습니다.");
        return;
    }

    // 2. 각 참여자별 포인트 지급
    const batch = [];
    voteSnap.forEach(doc => {
        const { uid } = doc.data();
        batch.push(_incrementUserPoints(uid, db));
    });

    await Promise.all(batch);
    alert(`정답자 ${voteSnap.size}명에게 100포인트를 지급했습니다.`);
}

// 유저 포인트 100 증가 (Firestore points 컬렉션)
async function _incrementUserPoints(uid, db) {
    const pointsRef = window.firebase.doc(db, "points", uid);
    const pointsSnap = await window.firebase.getDoc(pointsRef);
    let current = 0;
    if (pointsSnap.exists()) {
        current = pointsSnap.data().score || 0;
    }
    await window.firebase.setDoc(pointsRef, { score: current + 100 }, { merge: true });
}