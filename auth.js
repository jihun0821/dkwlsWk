if (!window.firebase) {
  console.error('window.firebase is undefined! firebase 초기화가 먼저 실행되어야 합니다.');
} else {
  // 구조분해는 필요한 것만
  const {
    initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, updateProfile, sendEmailVerification,
    getFirestore, doc, setDoc, getDoc, deleteUser
  } = window.firebase;

  const auth = window.auth;
  const db = window.db;

  let tempUserData = null;

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
      if (fileUploadWrapper) fileUploadWrapper.style.display = 'none';
    }
  }

  function showProfileModal() {
    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    if (authModal) authModal.style.display = 'none';
    if (profileModal) {
      profileModal.style.display = 'flex';
      const nicknameInput = document.getElementById('nickname');
      if (nicknameInput) nicknameInput.value = '';
    }
  }

  // 이메일 인증 확인 및 회원가입 완료
  async function completeSignup() {
    const user = auth.currentUser;
    if (!user) {
      alert('로그인 상태가 아닙니다.');
      return;
    }
    await user.reload();
    const refreshedUser = auth.currentUser;
    if (!refreshedUser.emailVerified) {
      alert('아직 이메일 인증이 완료되지 않았습니다.\n메일함에서 인증 링크를 클릭해주세요.');
      return;
    }
    if (tempUserData) {
      try {
        await updateProfile(refreshedUser, {
          displayName: tempUserData.nickname,
          photoURL: tempUserData.avatarUrl
        });
        await setDoc(doc(db, 'profiles', refreshedUser.uid), {
          uid: refreshedUser.uid,
          email: tempUserData.email,
          nickname: tempUserData.nickname,
          avatar_url: tempUserData.avatarUrl,
          created_at: new Date()
        });
        alert('회원가입이 완료되었습니다!');
        tempUserData = null;
        document.getElementById('profileModal').style.display = 'none';
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=80&bold=true`;
    try {
      if (!isHanilEmail(email)) {
        throw new Error('한일고 이메일(@hanilgo.cnehs.kr)만 가입할 수 있습니다.');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      tempUserData = {
        email: email,
        nickname: nickname,
        avatarUrl: avatarUrl
      };
      await sendEmailVerification(user);
      alert('인증 이메일이 발송되었습니다.\n이메일을 확인하고 인증을 완료한 후 "인증 확인" 버튼을 클릭해주세요.');
      updateUIForEmailVerification();
    } catch (error) {
      let errorMessage = '계정 생성 중 오류가 발생했습니다.';
      if (error.code === 'auth/email-already-in-use') errorMessage = '이미 사용 중인 이메일입니다.';
      else if (error.code === 'auth/weak-password') errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
      else if (error.code === 'auth/invalid-email') errorMessage = '유효하지 않은 이메일 주소입니다.';
      alert(errorMessage);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장하고 가입';
      }
    }
  }

  function updateUIForEmailVerification() {
    const saveBtn = document.getElementById('saveProfileBtn');
    const checkVerificationBtn = document.getElementById('checkVerificationBtn');
    const buttonContainer = saveBtn?.parentElement;
    if (saveBtn) saveBtn.style.display = 'none';
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

  // 로그인 처리
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        alert('이메일 인증이 필요합니다. 이메일을 확인하고 인증을 완료해주세요.');
        await signOut(auth);
        return;
      }
      document.getElementById('authModal').style.display = 'none';
      showUserProfile();
    } catch (error) {
      let errorMessage = '로그인 실패';
      if (error.code === 'auth/user-not-found') errorMessage = '존재하지 않는 사용자입니다.';
      else if (error.code === 'auth/wrong-password') errorMessage = '비밀번호가 올바르지 않습니다.';
      else if (error.code === 'auth/invalid-email') errorMessage = '유효하지 않은 이메일 주소입니다.';
      else if (error.code === 'auth/too-many-requests') errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.';
      alert(errorMessage);
    }
  }

  // 프로필 표시
  async function showUserProfile() {
    try {
      const user = auth.currentUser;
      if (!user) {
        if (typeof updateUIForAuthState === 'function') updateUIForAuthState(false);
        return;
      }
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      let profileData;
      if (docSnap.exists()) {
        profileData = docSnap.data();
      } else {
        const nickname = user.displayName || user.email.split('@')[0];
        profileData = {
          nickname: nickname,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=35&bold=true`
        };
      }
      const authModal = document.getElementById('authModal');
      const profileModal = document.getElementById('profileModal');
      if (authModal) authModal.style.display = 'none';
      if (profileModal) profileModal.style.display = 'none';
      if (typeof updateUIForAuthState === 'function') updateUIForAuthState(true, profileData);
    } catch (error) {
      if (typeof updateUIForAuthState === 'function') updateUIForAuthState(false);
    }
  }

  // 로그아웃
  async function logout() {
    try {
      tempUserData = null;
      await signOut(auth);
      if (typeof updateUIForAuthState === 'function') updateUIForAuthState(false);
    } catch (error) {
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  }

  // 이벤트 리스너 및 DOM 요소 가져오기
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const doLoginBtn = document.getElementById('doLogin');
  const doSignUpBtn = document.getElementById('doSignUp');

  setupProfileImagePreview();

  if (loginBtn) {
    loginBtn.onclick = () => {
      authModal.style.display = 'flex';
    };
  }
  if (logoutBtn) logoutBtn.onclick = logout;
  if (closeAuthModal) closeAuthModal.onclick = () => { authModal.style.display = 'none'; };
  if (closeProfileModal) {
    closeProfileModal.onclick = () => {
      profileModal.style.display = 'none';
      tempUserData = null;
    };
  }
  if (saveProfileBtn) saveProfileBtn.onclick = saveProfile;
  if (doLoginBtn) {
    doLoginBtn.onclick = () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      login(email, password);
    };
  }
  if (doSignUpBtn) {
    doSignUpBtn.onclick = () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      showProfileModal();
    };
  }

  window.onclick = (e) => {
    if (e.target === authModal) authModal.style.display = 'none';
    if (e.target === profileModal) {
      profileModal.style.display = 'none';
      tempUserData = null;
    }
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (!refreshedUser.emailVerified) {
        if (typeof updateUIForAuthState === 'function') updateUIForAuthState(false);
        return;
      }
      showUserProfile();
    } else {
      if (typeof updateUIForAuthState === 'function') updateUIForAuthState(false);
    }
  });

  const checkVerificationBtn = document.getElementById('checkVerificationBtn');
  if (checkVerificationBtn) checkVerificationBtn.onclick = completeSignup;

  // 전역 함수로 내보내기
  window.logout = logout;
  window.showUserProfile = showUserProfile;
  window.auth = auth;
  window.db = db;
}
