// Firebase SDK 모듈 import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔧 여기에 본인의 Firebase 설정 코드 넣기
const firebaseConfig = {
  apiKey: "AIzaSyD1o9QvXaOBtzW_ExTA9amyNBp9_PmjWVg",
  authDomain: "hsp-auth.firebaseapp.com",
  projectId: "hsp-auth",
  storageBucket: "hsp-auth.firebasestorage.app",
  messagingSenderId: "35817307884",
  appId: "1:35817307884:web:034178e6d881fc4f336fc9"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    showUserProfile(user);
  } else {
    updateUIForAuthState(false);
  }
});

// 로그인/회원가입 상태에 따른 UI 변경
function updateUIForAuthState(isLoggedIn, nickname) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBox = document.getElementById('profile-box');

  if (isLoggedIn) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    profileBox.innerHTML = `<strong>${nickname}</strong>`;
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    profileBox.innerHTML = '';
  }
}

// 사용자 프로필 로드 (없으면 점수 0으로 생성)
async function showUserProfile(user) {
  const ref = doc(db, "scores", user.uid);
  const docSnap = await getDoc(ref);
  const nickname = user.email.split('@')[0];

  if (!docSnap.exists()) {
    await setDoc(ref, { score: 0 });
  }
  updateUIForAuthState(true, nickname);
}

// 로그인 함수
window.login = async function (email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("로그인 성공");
  } catch (error) {
    alert("로그인 실패: " + error.message);
  }
};

// 회원가입 함수
window.signup = async function (email, password) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "scores", userCred.user.uid), { score: 0 });
    alert("회원가입 성공");
  } catch (error) {
    alert("회원가입 실패: " + error.message);
  }
};

// 로그아웃 함수
window.logout = async function () {
  await signOut(auth);
  updateUIForAuthState(false);
  alert("로그아웃되었습니다.");
};

// 현재 로그인된 사용자 가져오기
window.getCurrentUser = function () {
  return auth.currentUser;
};

// 점수 증가/감소 함수
window.updateUserScore = async function (delta) {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");
  const ref = doc(db, "scores", user.uid);
  await updateDoc(ref, { score: increment(delta) });
};
