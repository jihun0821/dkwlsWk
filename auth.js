// Firebase 설정 (Storage 제거)
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

// Firebase 설정 (여기에 본인의 Firebase 설정을 넣으세요)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET", // Storage 사용 안 해도 필드는 남겨둠
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화 (Storage 제거)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Firebase 초기화 완료');

// 이메일 도메인 검증
function isHanilEmail(email) {
  return email.endsWith('@hanilgo.cnehs.kr');
}

// 프로필 이미지 미리보기 기능 (기본 아바타만 지원)
function setupProfileImagePreview() {
  const avatarInput = document.getElementById('avatar');
  const fileLabel = document.querySelector('.file-upload-label');
  
  if (avatarInput && fileLabel) {
    // 파일 선택 시 알림
    avatarInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      if (file) {
        alert('현재 버전에서는 프로필 이미지 업로드가 지원되지 않습니다. 기본 아바타를 사용합니다.');
        e.target.value = ''; // 파일 선택 취소
      }
    });
    
    // 파일 업로드 UI 숨기기
    const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
    if (fileUploadWrapper) {
      fileUploadWrapper.style.display = 'none';
    }
  }
}

// 프로필 모달을 표시하고 초기화하는 함수
function showProfileModal() {
  const authModal = document.getElementById('authModal');
  const profileModal = document.getElementById('profileModal');
  
  // 인증 모달 닫기
  if (authModal) {
    authModal.style.display = 'none';
  }
  
  // 프로필 모달 표시
  if (profileModal) {
    profileModal.style.display = 'flex';
    
    // 입력 필드 초기화
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) nicknameInput.value = '';
  }
}

// Storage 없는 버전의 saveProfile 함수
async function saveProfile() {
  const nickname = document.getElementById('nickname').value.trim();
  const saveBtn = document.getElementById('saveProfileBtn');
  
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }
  
  // 닉네임 길이 체크
  if (nickname.length < 2 || nickname.length > 20) {
    alert('닉네임은 2자 이상 20자 이하로 입력해주세요.');
    return;
  }

  // 버튼 비활성화 및 로딩 표시
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
  }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // 기본 아바타 URL (다양한 스타일 중 선택 가능)
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=80&bold=true`;
  
  try {
    console.log('회원가입 시도:', { email, nickname });

    if (!isHanilEmail(email)) {
      throw new Error('한일고 이메일(@hanilgo.cnehs.kr)만 가입할 수 있습니다.');
    }

    // Firebase로 회원가입
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('회원가입 성공:', user);

    // Firebase Auth 프로필 업데이트
    await updateProfile(user, {
      displayName: nickname,
      photoURL: avatarUrl
    });

    // Firestore에 추가 프로필 정보 저장
    await setDoc(doc(db, 'profiles', user.uid), {
      uid: user.uid,
      email: email,
      nickname: nickname,
      avatar_url: avatarUrl,
      created_at: new Date()
    });

    // 프로필 모달 닫기
    document.getElementById('profileModal').style.display = 'none';
    
    alert('회원가입 성공! 이메일 인증 후 로그인하세요.');
    
    // 프로필 UI 업데이트
    showUserProfile();

  } catch (error) {
    console.error('프로필 저장 중 오류:', error);
    let errorMessage = '프로필 저장 중 오류가 발생했습니다.';
    
    // Firebase 에러 메시지 처리
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '이미 사용 중인 이메일입니다.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 주소입니다.';
    }
    
    alert(errorMessage);
  } finally {
    // 버튼 다시 활성화
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '저장하고 가입';
    }
  }
}

// 로그인 처리
async function login(email, password) {
  console.log('로그인 시도:', email);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('로그인 성공:', user);
    alert('로그인 성공');
    
    // 모달 닫기
    document.getElementById('authModal').style.display = 'none';
    
    // 프로필 표시
    showUserProfile();
    
  } catch (error) {
    console.error('로그인 오류:', error);
    
    let errorMessage = '로그인 실패';
    if (error.code === 'auth/user-not-found') {
      errorMessage = '존재하지 않는 사용자입니다.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = '비밀번호가 올바르지 않습니다.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 주소입니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.';
    }
    
    alert(errorMessage);
  }
}

// UI 업데이트 함수
function updateUIForAuthState(isLoggedIn, profileData = null) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBox = document.getElementById('profile-box');
  
  if (isLoggedIn && profileData) {
    // 로그인 상태: 로그인 버튼 숨기고 프로필 박스 표시
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    if (profileBox) {
      // 기본 아바타 URL
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nickname || 'USER')}&background=667eea&color=fff&size=35&bold=true`;
      const avatarUrl = profileData.avatar_url || defaultAvatar;
      
      profileBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
          <img src="${avatarUrl}" 
               alt="프로필" 
               style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;"
               onerror="this.src='${defaultAvatar}'">
          <span style="color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${profileData.nickname || '사용자'}</span>
          <button onclick="logout()" 
                  style="background: linear-gradient(135deg, #ff4757, #ff3742); color: white; border: none; padding: 6px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(255,71,87,0.3);">
            로그아웃
          </button>
        </div>
      `;
    }
  } else {
    // 로그아웃 상태: 로그인 버튼 표시하고 프로필 박스 숨기기
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileBox) profileBox.innerHTML = '';
  }
}

// 프로필 표시
async function showUserProfile() {
  console.log('프로필 표시 시도');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('사용자 정보 없음');
      updateUIForAuthState(false);
      return;
    }

    console.log('현재 사용자:', user);

    // Firestore에서 프로필 정보 가져오기
    const docRef = doc(db, 'profiles', user.uid);
    const docSnap = await getDoc(docRef);

    let profileData;
    
    if (docSnap.exists()) {
      profileData = docSnap.data();
      console.log('프로필 데이터:', profileData);
    } else {
      // 프로필이 없는 경우 기본 프로필 사용
      console.log('프로필 데이터 없음, 기본값 사용');
      const nickname = user.displayName || user.email.split('@')[0];
      profileData = {
        nickname: nickname,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=35&bold=true`
      };
    }

    // 모든 모달 닫기
    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    if (authModal) authModal.style.display = 'none';
    if (profileModal) profileModal.style.display = 'none';

    // UI 업데이트
    updateUIForAuthState(true, profileData);
    
  } catch (error) {
    console.error('프로필 표시 중 오류:', error);
    updateUIForAuthState(false);
  }
}

// 로그아웃
async function logout() {
  console.log('로그아웃 시도');
  try {
    await signOut(auth);
    
    // UI 업데이트
    updateUIForAuthState(false);
    
    alert('로그아웃되었습니다.');
  } catch (error) {
    console.error('로그아웃 오류:', error);
    alert('로그아웃 중 오류가 발생했습니다.');
  }
}

// 초기화: 로그인 유지 & 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료, 이벤트 바인딩 시작');
  
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');

  const doLoginBtn = document.getElementById('doLogin');
  const doSignUpBtn = document.getElementById('doSignUp');

  console.log('요소 확인:', { loginBtn, doLoginBtn, doSignUpBtn });

  // 프로필 이미지 미리보기 설정 (파일 업로드 비활성화)
  setupProfileImagePreview();

  // 로그인 버튼 클릭 시 모달 표시
  if (loginBtn) {
    loginBtn.onclick = () => {
      console.log('로그인 버튼 클릭');
      authModal.style.display = 'flex';
    };
  }

  // 로그아웃
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  // 모달 닫기
  if (closeAuthModal) {
    closeAuthModal.onclick = () => {
      authModal.style.display = 'none';
    };
  }

  if (closeProfileModal) {
    closeProfileModal.onclick = () => {
      profileModal.style.display = 'none';
    };
  }

  // 프로필 저장
  if (saveProfileBtn) {
    saveProfileBtn.onclick = saveProfile;
  }

  // 로그인 실행
  if (doLoginBtn) {
    doLoginBtn.onclick = () => {
      console.log('로그인 버튼 클릭됨');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      console.log('입력값 확인:', { email: email, passwordLength: password.length });
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      
      login(email, password);
    };
  } else {
    console.error('doLogin 버튼을 찾을 수 없습니다');
  }

  // 회원가입 실행 - 프로필 모달 표시
  if (doSignUpBtn) {
    doSignUpBtn.onclick = () => {
      console.log('회원가입 버튼 클릭됨');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      
      // 프로필 설정 모달 표시
      showProfileModal();
    };
  } else {
    console.error('doSignUp 버튼을 찾을 수 없습니다');
  }

  // 바깥 클릭 시 모달 닫기
  window.onclick = (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
    }
    if (e.target === profileModal) {
      profileModal.style.display = 'none';
    }
  };

  // Firebase Auth 상태 변경 리스너 - 자동 로그인 유지
  onAuthStateChanged(auth, (user) => {
    console.log('Auth 상태 변경:', user);
    if (user) {
      showUserProfile();
    } else {
      updateUIForAuthState(false);
    }
  });
});
