const { 
  initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendEmailVerification,
  getFirestore, doc, setDoc, getDoc, deleteUser, sendPasswordResetEmail
} = window.firebase;

const firebaseConfig = {
  apiKey: "AIzaSyC_YES_I20XByZpXjCN2p1Vp5gueS4Op24",
  authDomain: "hsp-auth-22845.firebaseapp.com",
  projectId: "hsp-auth-22845",
  storageBucket: "hsp-auth-22845.firebasestorage.app",
  messagingSenderId: "1034282361573",
  appId: "1:1034282361573:web:a15b970a18ae7033552a0c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Firebase 초기화 완료');

let tempUserData = null;
let signupEmail = '';
let signupPassword = '';

function isHanilEmail(email) {
  return email.endsWith('@hanilgo.cnehs.kr');  
}

// 프로필 이미지 미리보기 기능
function setupProfileImagePreview() {
  const avatarInput = document.getElementById('avatar');
  const fileLabel = document.querySelector('.file-upload-label');
  
  if (avatarInput && fileLabel) {
    avatarInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      if (file) {
        alert('현재 버전에서는 프로필 이미지 업로드가 지원되지 않습니다. 기본 아바타를 사용합니다.');
        e.target.value = '';
      }
    });
    
    const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
    if (fileUploadWrapper) {
      fileUploadWrapper.style.display = 'none';
    }
  }
}

// 프로필 모달 표시
function showProfileModal() {
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const profileModal = document.getElementById('profileModal');
  
  if (loginModal) loginModal.style.display = 'none';
  if (signupModal) signupModal.style.display = 'none';
  
  if (profileModal) {
    profileModal.style.display = 'flex';
    
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) nicknameInput.value = '';
  }
}

// 이메일 인증 대기 상태 UI 업데이트
function updateUIForEmailVerification() {
  const saveBtn = document.getElementById('saveProfileBtn');
  const checkVerificationBtn = document.getElementById('checkVerificationBtn');
  const buttonContainer = saveBtn?.parentElement;
  
  if (saveBtn) {
    saveBtn.style.display = 'none';
  }
  
  if (checkVerificationBtn) {
    checkVerificationBtn.style.display = 'inline-block';
    checkVerificationBtn.disabled = false;
    
    if (buttonContainer) {
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between';
      buttonContainer.style.alignItems = 'center';
      buttonContainer.style.gap = '10px';
    }
  }
}

// 이메일 인증 확인 및 회원가입 완료
async function completeSignup() {
  const user = auth.currentUser;
  
  if (!user) {
    alert('로그인 상태가 아닙니다.');
    return;
  }

  // 사용자 정보 새로고침
  await user.reload();
  const refreshedUser = auth.currentUser;

  if (!refreshedUser.emailVerified) {
    alert('아직 이메일 인증이 완료되지 않았습니다.\n메일함에서 인증 링크를 클릭해주세요.');
    return;
  }

  // 이메일 인증이 완료된 경우에만 데이터베이스에 저장
  if (tempUserData) {
    try {
      // 프로필 업데이트
      await updateProfile(refreshedUser, {
        displayName: tempUserData.nickname,
        photoURL: tempUserData.avatarUrl
      });

      // Firestore에 프로필 데이터 저장
      await setDoc(doc(db, 'profiles', refreshedUser.uid), {
        uid: refreshedUser.uid,
        email: tempUserData.email,
        nickname: tempUserData.nickname,
        avatar_url: tempUserData.avatarUrl,
        created_at: new Date()
      });

      alert('회원가입이 완료되었습니다!');
      
      // 임시 데이터 초기화
      tempUserData = null;
      
      // 모달 닫기
      document.getElementById('profileModal').style.display = 'none';
      
      // 사용자 프로필 표시
      showUserProfile();
      
    } catch (error) {
      console.error('회원가입 완료 중 오류:', error);
      alert('회원가입 완료 중 오류가 발생했습니다.');
    }
  }
}

// 프로필 저장 및 회원가입 (이메일 인증 전)
async function saveProfile() {
  const nickname = document.getElementById('nickname').value.trim();
  const saveBtn = document.getElementById('saveProfileBtn');
  
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }
  
  if (nickname.length < 2 || nickname.length > 20) {
    alert('닉네임은 2자 이상 20자 이하로 입력해주세요.');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '계정 생성 중...';
  }

  // signupEmail, signupPassword 사용
  const email = signupEmail;
  const password = signupPassword;
  
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=80&bold=true`;
  
  try {
    console.log('회원가입 시도:', { email, nickname });

    if (!isHanilEmail(email)) {
      throw new Error('한일고 이메일(@hanilgo.cnehs.kr)만 가입할 수 있습니다.');
    }

    // Firebase 계정 생성 (데이터베이스 저장 전)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('계정 생성 성공:', user);

    // 임시 데이터 저장 (이메일 인증 후 실제 저장용)
    tempUserData = {
      email: email,
      nickname: nickname,
      avatarUrl: avatarUrl
    };

    // 이메일 인증 메일 발송
    await sendEmailVerification(user);
    
    alert('인증 이메일이 발송되었습니다.\n이메일을 확인하고 인증을 완료한 후 "이메일 인증 확인" 버튼을 클릭해주세요.');

    // UI 업데이트 - 인증 대기 상태로 변경
    updateUIForEmailVerification();

  } catch (error) {
    console.error('계정 생성 중 오류:', error);
    let errorMessage = '계정 생성 중 오류가 발생했습니다.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '이미 사용 중인 이메일입니다.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '비밀번호가 너무 약습니다. 6자 이상 입력해주세요.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 주소입니다.';
    }
    
    alert(errorMessage);
  } finally {
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

    // 이메일 인증 여부 확인
    if (!user.emailVerified) {
      alert('이메일 인증이 필요합니다. 이메일을 확인하고 인증을 완료해주세요.');
      await signOut(auth);
      return;
    }

    console.log('로그인 성공:', user);    
    document.getElementById('loginModal').style.display = 'none';
    
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

// 프로필 표시
async function showUserProfile() {
  console.log('프로필 표시 시도');
  
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('사용자 정보 없음');
      // script.js의 updateUIForAuthState 함수 호출
      if (typeof updateUIForAuthState === 'function') {
        updateUIForAuthState(false);
      }
      return;
    }

    console.log('현재 사용자:', user);

    const docRef = doc(db, 'profiles', user.uid);
    const docSnap = await getDoc(docRef);

    let profileData;
    
    if (docSnap.exists()) {
      profileData = docSnap.data();
      console.log('프로필 데이터:', profileData);
    } else {
      console.log('프로필 데이터 없음, 기본값 사용');
      const nickname = user.displayName || user.email.split('@')[0];
      profileData = {
        nickname: nickname,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=35&bold=true`
      };
    }

    // 모든 모달 닫기
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const profileModal = document.getElementById('profileModal');
    if (loginModal) loginModal.style.display = 'none';
    if (signupModal) signupModal.style.display = 'none';
    if (profileModal) profileModal.style.display = 'none';

    // UI 업데이트 - script.js의 함수 호출
    if (typeof updateUIForAuthState === 'function') {
      updateUIForAuthState(true, profileData);
    }

  } catch (error) {
    console.error('프로필 표시 중 오류:', error);
    if (typeof updateUIForAuthState === 'function') {
      updateUIForAuthState(false);
    }
  }
}

// 로그아웃
async function logout() {
  console.log('로그아웃 시도');
  try {
    // 임시 데이터 초기화
    tempUserData = null;
    
    await signOut(auth);
    
    if (typeof updateUIForAuthState === 'function') {
      updateUIForAuthState(false);
    }
    
  } catch (error) {
    console.error('로그아웃 오류:', error);
    alert('로그아웃 중 오류가 발생했습니다.');
  }
}

// 프로필 이미지 미리보기 설정
setupProfileImagePreview();

// 인증 상태 변화 감지
onAuthStateChanged(auth, async (user) => {
  console.log('Auth 상태 변경:', user);

  if (user) {
    await user.reload(); // 사용자 정보 새로고침
    const refreshedUser = auth.currentUser;

    if (!refreshedUser.emailVerified) {
      console.log('이메일 미인증 상태입니다.');
      
      // 이메일 미인증 상태에서는 프로필을 표시하지 않음
      if (typeof updateUIForAuthState === 'function') {
        updateUIForAuthState(false);
      }
      return;
    }

    showUserProfile();
  } else {
    if (typeof updateUIForAuthState === 'function') {
      updateUIForAuthState(false);
    }
  }
});

// DOM이 로드된 후 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소 가져오기
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginModal = document.getElementById('loginModal');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const signupModal = document.getElementById('signupModal');
  const closeSignupModal = document.getElementById('closeSignupModal');
  const openSignupLink = document.getElementById('openSignupLink');
  const backToLoginLink = document.getElementById('backToLoginLink');
  const openProfileModalBtn = document.getElementById('openProfileModalBtn');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const checkVerificationBtn = document.getElementById('checkVerificationBtn');
  const doLoginBtn = document.getElementById('doLogin');
  const openPasswordResetLink = document.getElementById('openPasswordResetLink');
  const passwordResetModal = document.getElementById('passwordResetModal');
  const closePasswordResetModal = document.getElementById('closePasswordResetModal');
  const backToLoginFromReset = document.getElementById('backToLoginFromReset');
  const sendResetEmailBtn = document.getElementById('sendResetEmailBtn');
  const profileBox = document.getElementById('profile-box');
  if (profileBox) {
    profileBox.addEventListener('click', function(e) {
      if (e.target.closest('button')) return;
      const section = e.target.closest('.profile-section');
      if (section) {
        openProfileEditModal();
      }
    });
  }


  console.log('비밀번호 재설정 요소 확인:', { 
    openPasswordResetLink, 
    passwordResetModal, 
    sendResetEmailBtn 
  });

  // 비밀번호 찾기 링크 클릭
  if (openPasswordResetLink) {
    openPasswordResetLink.onclick = (e) => {
      e.preventDefault();
      console.log('비밀번호 재설정 링크 클릭');
      if (loginModal) loginModal.style.display = 'none';
      if (passwordResetModal) passwordResetModal.style.display = 'flex';
    };
  }

  // 비밀번호 재설정 모달 닫기
  if (closePasswordResetModal) {
    closePasswordResetModal.onclick = () => {
      if (passwordResetModal) passwordResetModal.style.display = 'none';
    };
  }

  // 로그인으로 돌아가기
  if (backToLoginFromReset) {
    backToLoginFromReset.onclick = (e) => {
      e.preventDefault();
      if (passwordResetModal) passwordResetModal.style.display = 'none';
      if (loginModal) loginModal.style.display = 'flex';
      // 입력 필드 초기화
      const resetEmailInput = document.getElementById('resetEmail');
      if (resetEmailInput) resetEmailInput.value = '';
    };
  }

  // 비밀번호 재설정 이메일 보내기 버튼
  if (sendResetEmailBtn) {
    sendResetEmailBtn.onclick = sendPasswordReset;
  }

  console.log('요소 확인:', { loginBtn, doLoginBtn, openProfileModalBtn });

  // 이벤트 리스너 설정
  if (loginBtn) {
    loginBtn.onclick = () => {
      console.log('로그인 버튼 클릭');
      if (loginModal) loginModal.style.display = 'flex';
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  if (closeLoginModal) {
    closeLoginModal.onclick = () => {
      if (loginModal) loginModal.style.display = 'none';
    };
  }

  if (closeSignupModal) {
    closeSignupModal.onclick = () => {
      if (signupModal) signupModal.style.display = 'none';
    };
  }

  if (openSignupLink) {
    openSignupLink.onclick = (e) => {
      e.preventDefault();
      if (loginModal) loginModal.style.display = 'none';
      if (signupModal) signupModal.style.display = 'flex';
    };
  }

  if (backToLoginLink) {
    backToLoginLink.onclick = (e) => {
      e.preventDefault();
      if (signupModal) signupModal.style.display = 'none';
      if (loginModal) loginModal.style.display = 'flex';
    };
  }

  if (openProfileModalBtn) {
    openProfileModalBtn.onclick = () => {
      // 이메일, 비밀번호 값 저장
      signupEmail = document.getElementById('signupEmail').value.trim();
      signupPassword = document.getElementById('signupPassword').value.trim();

      if (!signupEmail || !signupPassword) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      
      if (signupModal) signupModal.style.display = 'none';
      showProfileModal();
    };
  }

  if (closeProfileModal) {
    closeProfileModal.onclick = () => {
      if (profileModal) profileModal.style.display = 'none';
      tempUserData = null;
    };
  }

  if (saveProfileBtn) {
    saveProfileBtn.onclick = saveProfile;
  }

  if (checkVerificationBtn) {
    checkVerificationBtn.onclick = completeSignup;
  }

  if (doLoginBtn) {
    doLoginBtn.onclick = () => {
      console.log('로그인 버튼 클릭됨');
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      login(email, password);
    };
  } else {
    console.error('doLogin 버튼을 찾을 수 없습니다');
  }

 window.onclick = (e) => {
    if (e.target === loginModal) loginModal.style.display = 'none';
    if (e.target === signupModal) signupModal.style.display = 'none';
    if (e.target === profileModal) {
      profileModal.style.display = 'none';
      tempUserData = null;
    }
    // ✅ 비밀번호 재설정 모달 추가
    if (e.target === passwordResetModal) {
      passwordResetModal.style.display = 'none';
      const resetEmailInput = document.getElementById('resetEmail');
      if (resetEmailInput) resetEmailInput.value = '';
    }
  };

  // 비밀번호 재설정 모달에서 Enter 키 처리
  const resetEmailInput = document.getElementById('resetEmail');
  if (resetEmailInput) {
    resetEmailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendPasswordReset();
      }
    });
  }
});

// 비밀번호 재설정 이메일 보내기
async function sendPasswordReset() {
  const email = document.getElementById('resetEmail').value.trim();
  const sendBtn = document.getElementById('sendResetEmailBtn');
  
  if (!email) {
    alert('이메일 주소를 입력해주세요.');
    return;
  }
  
  if (!isHanilEmail(email)) {
    alert('한일고 이메일(@hanilgo.cnehs.kr)만 사용할 수 있습니다.');
    return;
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = '이메일 전송 중...';
  }

  try {
    console.log('비밀번호 재설정 이메일 전송 시도:', email);
    
    await sendPasswordResetEmail(auth, email);
    
    alert('비밀번호 재설정 이메일이 전송되었습니다.\n이메일을 확인하고 안내에 따라 비밀번호를 재설정해주세요.');
    
    // 모달 닫기
    document.getElementById('passwordResetModal').style.display = 'none';
    
    // 입력 필드 초기화
    document.getElementById('resetEmail').value = '';
    
  } catch (error) {
    console.error('비밀번호 재설정 이메일 전송 오류:', error);
    
    let errorMessage = '비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = '등록되지 않은 이메일 주소입니다.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 주소입니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
    }
    
    alert(errorMessage);
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = '비밀번호 재설정 이메일 보내기';
    }
  }
}

// 프로필 편집 관련 JavaScript 코드

// 프로필 편집 모달 열기 함수
function openProfileEditModal() {
    const user = window.firebase ? window.firebase.getAuth().currentUser : null;
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    // 현재 프로필 정보 표시
    const currentProfileImage = document.getElementById('currentProfileImage');
    const currentNickname = document.getElementById('currentNickname');
    const currentEmail = document.getElementById('currentEmail');
    const newNicknameInput = document.getElementById('newNickname');

    // 현재 사용자 정보로 모달 채우기
    if (currentProfileImage && user.photoURL) {
        currentProfileImage.src = user.photoURL;
    }
    if (currentNickname && user.displayName) {
        currentNickname.textContent = user.displayName;
        newNicknameInput.value = user.displayName; // 현재 닉네임을 입력 필드에도 설정
    }
    if (currentEmail && user.email) {
        currentEmail.textContent = user.email;
    }

    // 모달 표시
    const modal = document.getElementById('profileEditModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 프로필 편집 모달 닫기 함수
function closeProfileEditModal() {
    const modal = document.getElementById('profileEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 입력 필드 초기화
    const newNicknameInput = document.getElementById('newNickname');
    if (newNicknameInput) {
        newNicknameInput.value = '';
    }
    
    // 성공 메시지 숨기기
    const successMessage = document.getElementById('editSuccessMessage');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// 닉네임 저장 함수
async function saveNickname() {
    const newNickname = document.getElementById('newNickname').value.trim();
    const saveBtn = document.getElementById('saveNicknameBtn');
    
    if (!newNickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    
    if (newNickname.length < 2 || newNickname.length > 20) {
        alert('닉네임은 2자 이상 20자 이하로 입력해주세요.');
        return;
    }

    // Firebase 인증과 Firestore 가져오기
    if (!window.firebase) {
        alert('Firebase가 로드되지 않았습니다.');
        return;
    }

    const auth = window.firebase.getAuth();
    const user = auth.currentUser;
    
    if (!user) {
        alert('로그인 상태가 아닙니다.');
        return;
    }

    // 버튼 비활성화
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';
    }

    try {
        const { getFirestore, doc, setDoc, updateProfile } = window.firebase;
        const db = getFirestore();

        // 새 아바타 URL 생성
        const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newNickname)}&background=667eea&color=fff&size=80&bold=true`;

        // Firebase Auth 프로필 업데이트
        await updateProfile(user, {
            displayName: newNickname,
            photoURL: newAvatarUrl
        });

        // Firestore 프로필 데이터 업데이트
        await setDoc(doc(db, 'profiles', user.uid), {
            uid: user.uid,
            email: user.email,
            nickname: newNickname,
            avatar_url: newAvatarUrl,
            updated_at: new Date()
        }, { merge: true }); // merge: true로 기존 데이터 유지하면서 업데이트

        // 성공 메시지 표시
        const successMessage = document.getElementById('editSuccessMessage');
        if (successMessage) {
            successMessage.style.display = 'block';
        }

        // 현재 프로필 정보 업데이트
        const currentNickname = document.getElementById('currentNickname');
        const currentProfileImage = document.getElementById('currentProfileImage');
        if (currentNickname) {
            currentNickname.textContent = newNickname;
        }
        if (currentProfileImage) {
            currentProfileImage.src = newAvatarUrl;
        }

        // 메인 페이지의 프로필 UI도 업데이트
        if (typeof showUserProfile === 'function') {
            setTimeout(() => {
                showUserProfile();
            }, 1000);
        }

        // 2초 후 모달 닫기
        setTimeout(() => {
            closeProfileEditModal();
        }, 2000);

    } catch (error) {
        console.error('프로필 업데이트 중 오류:', error);
        alert('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
        // 버튼 활성화
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    }
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // 프로필 편집 모달 닫기 버튼
    const closeBtn = document.getElementById('closeProfileEditModal');
    if (closeBtn) {
        closeBtn.onclick = closeProfileEditModal;
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.onclick = closeProfileEditModal;
    }

    // 저장 버튼
    const saveBtn = document.getElementById('saveNicknameBtn');
    if (saveBtn) {
        saveBtn.onclick = saveNickname;
    }

    // 닉네임 입력 필드에서 Enter 키 처리
    const nicknameInput = document.getElementById('newNickname');
    if (nicknameInput) {
        nicknameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNickname();
            }
        });
    }

    // 모달 외부 클릭 시 닫기
    const modal = document.getElementById('profileEditModal');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeProfileEditModal();
            }
        };
    }
});

function updateUIForAuthState(isLoggedIn, profileData = null) {
  const profileBox = document.getElementById('profile-box');
  const themeIcon = document.body.classList.contains('light-mode') ? '☀️' : '🌙';

  if (isLoggedIn && profileData) {
    const nickname = profileData.nickname || 'USER';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=35&bold=true`;
    const avatarUrl = profileData.avatar_url || defaultAvatar; // 안전하게 정의

    profileBox.innerHTML = `
      <div class="profile-section" style="display: flex; align-items: center; gap: 10px;">
        <img src="${avatarUrl}" alt="프로필"
          style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;"
          onerror="this.src='${defaultAvatar}'">
        <span style="color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${nickname}</span>
        <button id="logoutBtn" type="button">로그아웃</button>
        <button id="toggleThemeBtn" type="button">${themeIcon}</button>
      </div>
    `;
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('toggleThemeBtn').onclick = toggleTheme;
  } else {
    profileBox.innerHTML = `
      <button id="loginBtn" onclick="document.getElementById('loginModal').style.display='flex'">로그인</button>
    `;
  }
}


window.updateUIForAuthState = updateUIForAuthState;

// 전역 함수로 내보내기 (다른 스크립트에서 사용할 수 있도록)
window.openProfileEditModal = openProfileEditModal;
window.closeProfileEditModal = closeProfileEditModal;
window.saveNickname = saveNickname;

// 전역 함수로 내보내기
window.logout = logout;
window.showUserProfile = showUserProfile;
