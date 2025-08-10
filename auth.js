// 설정 및 상수
const CONFIG = {
  EMAIL_DOMAIN: '@hanilgo.cnehs.kr',
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 20,
  AVATAR_BASE_URL: 'https://ui-avatars.com/api/',
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyC_YES_I20XByZpXjCN2p1Vp5gueS4Op24",
    authDomain: "hsp-auth-22845.firebaseapp.com",
    projectId: "hsp-auth-22845",
    storageBucket: "hsp-auth-22845.firebasestorage.app",
    messagingSenderId: "1034282361573",
    appId: "1:1034282361573:web:a15b970a18ae7033552a0c"
  }
};

const ERROR_MESSAGES = {
  INVALID_EMAIL: '한일고 이메일(@hanilgo.cnehs.kr)만 가입할 수 있습니다.',
  NICKNAME_REQUIRED: '닉네임을 입력해주세요.',
  NICKNAME_LENGTH: '닉네임은 2자 이상 20자 이하로 입력해주세요.',
  EMAIL_PASSWORD_REQUIRED: '이메일과 비밀번호를 입력해주세요.',
  LOGIN_REQUIRED: '로그인이 필요합니다.',
  EMAIL_VERIFICATION_REQUIRED: '이메일 인증이 필요합니다.',
  TEMP_DATA_MISSING: '임시 사용자 데이터가 없습니다.',
  PROFILE_IMAGE_NOT_SUPPORTED: '현재 버전에서는 프로필 이미지 업로드가 지원되지 않습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
};

const LOADING_MESSAGES = {
  CREATING_ACCOUNT: '계정 생성 중...',
  SENDING_EMAIL: '이메일 전송 중...',
  LOGGING_IN: '로그인 중...',
  SAVING_PROFILE: '프로필 저장 중...'
};

// 에러 처리 클래스
class ErrorHandler {
  /**
   * Firebase Auth 에러를 사용자 친화적인 메시지로 변환
   * @param {Error} error - Firebase 에러 객체
   * @returns {string} 사용자 친화적인 에러 메시지
   */
  static handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.',
      'auth/invalid-email': '유효하지 않은 이메일 주소입니다.',
      'auth/user-not-found': '존재하지 않는 사용자입니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/too-many-requests': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
    };
    
    return errorMessages[error.code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * 에러 로깅 및 사용자 알림
   * @param {Error} error - 에러 객체
   * @param {string} context - 에러 발생 컨텍스트
   */
  static logAndNotify(error, context) {
    console.error(`${context} 오류:`, error);
    const message = this.handleAuthError(error);
    alert(message);
  }
}

// 유틸리티 클래스
class Utils {
  /**
   * 모달 닫기
   * @param {string} modalId - 모달 요소 ID
   */
  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  /**
   * 모달 열기
   * @param {string} modalId - 모달 요소 ID
   */
  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }

  /**
   * 입력 폼 초기화
   * @param {string} formId - 폼 요소 ID
   */
  static clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  }

  /**
   * 모든 모달 닫기
   */
  static closeAllModals() {
    const modals = ['loginModal', 'signupModal', 'profileModal', 'passwordResetModal'];
    modals.forEach(modalId => this.closeModal(modalId));
  }

  /**
   * 아바타 URL 생성
   * @param {string} nickname - 닉네임
   * @param {number} size - 아바타 크기
   * @returns {string} 아바타 URL
   */
  static generateAvatarUrl(nickname, size = 80) {
    return `${CONFIG.AVATAR_BASE_URL}?name=${encodeURIComponent(nickname)}&background=667eea&color=fff&size=${size}&bold=true`;
  }
}

// 검증 클래스
class Validator {
  /**
   * 한일고 이메일 검증
   * @param {string} email - 이메일 주소
   * @returns {boolean} 검증 결과
   */
  static isHanilEmail(email) {
    return email.endsWith(CONFIG.EMAIL_DOMAIN);
  }

  /**
   * 이메일 형식 검증
   * @param {string} email - 이메일 주소
   * @returns {boolean} 검증 결과
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@hanilgo\.cnehs\.kr$/;
    return emailRegex.test(email);
  }

  /**
   * 비밀번호 검증
   * @param {string} password - 비밀번호
   * @returns {boolean} 검증 결과
   */
  static validatePassword(password) {
    return password.length >= 6;
  }

  /**
   * 닉네임 검증
   * @param {string} nickname - 닉네임
   * @returns {boolean} 검증 결과
   */
  static validateNickname(nickname) {
    return nickname.length >= CONFIG.NICKNAME_MIN_LENGTH && 
           nickname.length <= CONFIG.NICKNAME_MAX_LENGTH;
  }
}

// 로딩 상태 관리 클래스
class LoadingManager {
  /**
   * 로딩 상태 표시
   * @param {HTMLElement} element - 버튼 요소
   * @param {string} text - 로딩 텍스트
   */
  static showLoading(element, text) {
    if (element) {
      element.disabled = true;
      element.dataset.originalText = element.textContent;
      element.textContent = text;
    }
  }

  /**
   * 로딩 상태 해제
   * @param {HTMLElement} element - 버튼 요소
   */
  static hideLoading(element) {
    if (element) {
      element.disabled = false;
      element.textContent = element.dataset.originalText || element.textContent;
    }
  }
}

// 이벤트 관리 클래스
class EventManager {
  constructor() {
    this.listeners = [];
  }

  /**
   * 이벤트 리스너 추가
   * @param {HTMLElement} element - 대상 요소
   * @param {string} event - 이벤트 타입
   * @param {Function} handler - 이벤트 핸들러
   */
  addListener(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler);
      this.listeners.push({ element, event, handler });
    }
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

// 메인 인증 관리 클래스
class AuthManager {
  constructor() {
    this.tempUserData = null;
    this.signupEmail = '';
    this.signupPassword = '';
    this.eventManager = new EventManager();
    this.verificationCheckInterval = null;
    
    this.initializeFirebase();
    this.setupEventListeners();
    this.setupAuthStateListener();
  }

  /**
   * Firebase 초기화
   */
  initializeFirebase() {
    try {
      const { 
        initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
        signOut, onAuthStateChanged, updateProfile, sendEmailVerification,
        getFirestore, doc, setDoc, getDoc, sendPasswordResetEmail
      } = window.firebase;

      this.firebase = {
        initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
        signOut, onAuthStateChanged, updateProfile, sendEmailVerification,
        getFirestore, doc, setDoc, getDoc, sendPasswordResetEmail
      };

      this.app = this.firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
      this.auth = this.firebase.getAuth(this.app);
      this.db = this.firebase.getFirestore(this.app);

      console.log('Firebase 초기화 완료');
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
      throw new Error('Firebase 초기화에 실패했습니다.');
    }
  }

  /**
   * ✅ AuthManager 클래스에 getUserPoints 메서드 추가
   * @param {string} uid - 사용자 UID
   * @returns {number} 사용자 포인트
   */
  async getUserPoints(uid) {
    try {
      console.log("AuthManager.getUserPoints - 포인트 조회 시작 - UID:", uid);
      
      const pointsDocRef = this.firebase.doc(this.db, "user_points", uid);
      const pointsDoc = await this.firebase.getDoc(pointsDocRef);
      
      if (pointsDoc.exists()) {
        const points = pointsDoc.data().points || 0;
        console.log("AuthManager.getUserPoints - Firestore에서 조회된 포인트:", points);
        return points;
      } else {
        console.log("AuthManager.getUserPoints - 포인트 문서가 존재하지 않음, 0으로 초기화");
        await this.firebase.setDoc(pointsDocRef, { points: 0, uid: uid });
        return 0;
      }
    } catch (error) {
      console.error("AuthManager.getUserPoints - 포인트 조회 실패:", error);
      return 0;
    }
  }

  /**
   * 인증 상태 변화 리스너 설정
   */
  setupAuthStateListener() {
    this.firebase.onAuthStateChanged(this.auth, async (user) => {
      console.log('Auth 상태 변경:', user);

      if (user) {
        await user.reload();
        const refreshedUser = this.auth.currentUser;

        if (!refreshedUser.emailVerified) {
          console.log('이메일 미인증 상태');
          this.updateUIForAuthState(false);
          return;
        }

        await this.showUserProfile();
      } else {
        this.updateUIForAuthState(false);
      }
    });
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupModalEventListeners();
      this.setupFormEventListeners();
      this.setupProfileImagePreview();
    });
  }

  /**
   * 모달 관련 이벤트 리스너 설정
   */
  setupModalEventListeners() {
    // 로그인 모달
    this.eventManager.addListener(
      document.getElementById('loginBtn'),
      'click',
      () => Utils.showModal('loginModal')
    );

    this.eventManager.addListener(
      document.getElementById('closeLoginModal'),
      'click',
      () => Utils.closeModal('loginModal')
    );

    // 회원가입 모달
    this.eventManager.addListener(
      document.getElementById('openSignupLink'),
      'click',
      (e) => {
        e.preventDefault();
        Utils.closeModal('loginModal');
        Utils.showModal('signupModal');
      }
    );

    this.eventManager.addListener(
      document.getElementById('closeSignupModal'),
      'click',
      () => Utils.closeModal('signupModal')
    );

    this.eventManager.addListener(
      document.getElementById('backToLoginLink'),
      'click',
      (e) => {
        e.preventDefault();
        Utils.closeModal('signupModal');
        Utils.showModal('loginModal');
      }
    );

    // 프로필 모달
    this.eventManager.addListener(
      document.getElementById('openProfileModalBtn'),
      'click',
      () => this.handleOpenProfileModal()
    );

    this.eventManager.addListener(
      document.getElementById('closeProfileModal'),
      'click',
      () => this.handleCloseProfileModal()
    );

    // 비밀번호 재설정 모달
    this.eventManager.addListener(
      document.getElementById('openPasswordResetLink'),
      'click',
      (e) => {
        e.preventDefault();
        Utils.closeModal('loginModal');
        Utils.showModal('passwordResetModal');
      }
    );

    this.eventManager.addListener(
      document.getElementById('closePasswordResetModal'),
      'click',
      () => Utils.closeModal('passwordResetModal')
    );

    this.eventManager.addListener(
      document.getElementById('backToLoginFromReset'),
      'click',
      (e) => {
        e.preventDefault();
        Utils.closeModal('passwordResetModal');
        Utils.showModal('loginModal');
        Utils.clearForm('passwordResetForm');
      }
    );

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
      const modals = ['loginModal', 'signupModal', 'profileModal', 'passwordResetModal'];
      modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (e.target === modal) {
          Utils.closeModal(modalId);
          if (modalId === 'profileModal') {
            this.cleanup();
          }
        }
      });
    });
  }

  /**
   * 폼 관련 이벤트 리스너 설정 (수정됨)
   */
  setupFormEventListeners() {
    // 로그인 폼
    this.eventManager.addListener(
      document.getElementById('doLogin'),
      'click',
      () => this.handleLogin()
    );

    // 회원가입 - "이메일 인증 확인" 버튼
    this.eventManager.addListener(
      document.getElementById('checkVerificationBtn'),
      'click',
      () => this.handleEmailVerification()
    );

    // 기존 "저장하고 가입" 버튼 이벤트는 제거하지 않지만 실제로는 숨김 처리됨
    this.eventManager.addListener(
      document.getElementById('saveProfileBtn'),
      'click',
      () => this.handleSaveProfile() // 기존 코드 호환성을 위해 유지
    );

    // 비밀번호 재설정
    this.eventManager.addListener(
      document.getElementById('sendResetEmailBtn'),
      'click',
      () => this.handleSendPasswordReset()
    );

    // 닉네임 변경
    this.eventManager.addListener(
      document.getElementById('saveNicknameBtn'),
      'click',
      () => this.handleSaveNickname()
    );

    // 로그아웃
    this.eventManager.addListener(
      document.getElementById('logoutBtn'),
      'click',
      () => this.handleLogout()
    );

    // Enter 키 이벤트
    this.setupEnterKeyEvents();
  }

  /**
   * Enter 키 이벤트 설정
   */
  setupEnterKeyEvents() {
    const inputs = [
      { id: 'loginPassword', handler: () => this.handleLogin() },
      { id: 'resetEmail', handler: () => this.handleSendPasswordReset() }
    ];

    inputs.forEach(({ id, handler }) => {
      const input = document.getElementById(id);
      if (input) {
        this.eventManager.addListener(input, 'keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handler();
          }
        });
      }
    });
  }

  /**
   * 프로필 이미지 미리보기 설정
   */
  setupProfileImagePreview() {
    const avatarInput = document.getElementById('avatar');
    const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
    
    if (avatarInput) {
      this.eventManager.addListener(avatarInput, 'change', (e) => {
        const file = e.target.files[0];
        if (file) {
          alert(ERROR_MESSAGES.PROFILE_IMAGE_NOT_SUPPORTED);
          e.target.value = '';
        }
      });
    }
    
    if (fileUploadWrapper) {
      fileUploadWrapper.style.display = 'none';
    }
  }

  /**
   * 프로필 모달 열기 처리 (수정됨)
   */
  handleOpenProfileModal() {
    this.signupEmail = document.getElementById('signupEmail')?.value.trim() || '';
    this.signupPassword = document.getElementById('signupPassword')?.value.trim() || '';

    if (!this.signupEmail || !this.signupPassword) {
      alert(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
      return;
    }

    if (!Validator.isHanilEmail(this.signupEmail)) {
      alert(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    Utils.closeModal('signupModal');
    this.showProfileModal();
    
    // 바로 이메일 인증 확인 버튼 표시 (닉네임 입력 후)
    this.updateUIForEmailVerification();
  }

  /**
   * 프로필 모달 닫기 처리 (수정됨 - 상태 복원)
   */
  handleCloseProfileModal() {
    // 닉네임 입력 필드 다시 활성화
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) {
      nicknameInput.disabled = false;
    }
    
    Utils.closeModal('profileModal');
    this.cleanup();
  }

  /**
   * 프로필 모달 표시
   */
  showProfileModal() {
    Utils.closeAllModals();
    Utils.showModal('profileModal');
    
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) nicknameInput.value = '';
  }

  /**
   * 로그인 처리
   */
  async handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!email || !password) {
      alert(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
      return;
    }

    const loginBtn = document.getElementById('doLogin');
    
    try {
      LoadingManager.showLoading(loginBtn, LOADING_MESSAGES.LOGGING_IN);
      
      const userCredential = await this.firebase.signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert(ERROR_MESSAGES.EMAIL_VERIFICATION_REQUIRED);
        await this.firebase.signOut(this.auth);
        return;
      }

      console.log('로그인 성공:', user);
      Utils.closeModal('loginModal');
      
    } catch (error) {
      ErrorHandler.logAndNotify(error, '로그인');
    } finally {
      LoadingManager.hideLoading(loginBtn);
    }
  }

  /**
   * 이메일 인증 확인 처리 (완전히 새로 작성)
   */
  async handleEmailVerification() {
    const nickname = document.getElementById('nickname')?.value.trim();
    const verifyBtn = document.getElementById('checkVerificationBtn');
    const isEmailSent = this.tempUserData?.emailSent || false;
    
    // 닉네임 검증
    if (!nickname) {
      alert(ERROR_MESSAGES.NICKNAME_REQUIRED);
      return;
    }
    
    if (!Validator.validateNickname(nickname)) {
      alert(ERROR_MESSAGES.NICKNAME_LENGTH);
      return;
    }
    
    if (!isEmailSent) {
      // 첫 번째 클릭: 계정 생성 + 이메일 발송
      await this.sendVerificationEmail(nickname);
    } else {
      // 두 번째 클릭: 인증 확인 및 프로필 저장
      await this.completeSignupAfterVerification(nickname);
    }
  }

  /**
   * 인증 이메일 발송 (닉네임 포함)
   */
  async sendVerificationEmail(nickname) {
    const verifyBtn = document.getElementById('checkVerificationBtn');
    
    try {
      LoadingManager.showLoading(verifyBtn, '계정 생성 중...');
      
      // Firebase 계정 생성
      const userCredential = await this.firebase.createUserWithEmailAndPassword(
        this.auth, 
        this.signupEmail, 
        this.signupPassword
      );
      const user = userCredential.user;
      
      console.log('계정 생성 성공:', user);
      
      // 임시 데이터 저장 (닉네임 포함)
      this.tempUserData = {
        email: this.signupEmail,
        nickname: nickname,
        avatarUrl: Utils.generateAvatarUrl(nickname),
        emailSent: true,
        userId: user.uid
      };
      
      // 인증 이메일 발송
      await this.firebase.sendEmailVerification(user);
      
      alert('인증 이메일이 발송되었습니다.\n이메일을 확인하고 인증 링크를 클릭한 후, 다시 이 버튼을 눌러주세요.');
      
      // 닉네임 입력 필드 비활성화 (변경 방지)
      const nicknameInput = document.getElementById('nickname');
      if (nicknameInput) {
        nicknameInput.disabled = true;
      }
      
      // 버튼 상태 변경: 인증 대기 중
      this.updateUIForWaitingVerification();
      
    } catch (error) {
      ErrorHandler.logAndNotify(error, '계정 생성');
    } finally {
      LoadingManager.hideLoading(verifyBtn);
    }
  }

  /**
   * 이메일 인증 완료 후 최종 가입 처리
   */
  async completeSignupAfterVerification(nickname) {
    const user = this.auth.currentUser;
    const verifyBtn = document.getElementById('checkVerificationBtn');
    
    if (!user) {
      alert(ERROR_MESSAGES.LOGIN_REQUIRED);
      return;
    }
    
    try {
      LoadingManager.showLoading(verifyBtn, '회원가입 완료 중...');
      
      // 사용자 정보 새로고침
      await user.reload();
      const refreshedUser = this.auth.currentUser;
      
      if (!refreshedUser.emailVerified) {
        alert('아직 이메일 인증이 완료되지 않았습니다.\n메일함에서 인증 링크를 클릭해주세요.');
        return;
      }
      
      if (!this.tempUserData) {
        alert(ERROR_MESSAGES.TEMP_DATA_MISSING);
        return;
      }
      
      // 최신 닉네임으로 업데이트 (사용자가 수정했을 수도 있음)
      this.tempUserData.nickname = nickname;
      this.tempUserData.avatarUrl = Utils.generateAvatarUrl(nickname);
      
      // 프로필 정보 저장
      await Promise.all([
        this.firebase.updateProfile(refreshedUser, {
          displayName: this.tempUserData.nickname,
          photoURL: this.tempUserData.avatarUrl
        }),
        this.firebase.setDoc(this.firebase.doc(this.db, 'profiles', refreshedUser.uid), {
          uid: refreshedUser.uid,
          email: this.tempUserData.email,
          nickname: this.tempUserData.nickname,
          avatar_url: this.tempUserData.avatarUrl,
          created_at: new Date()
        })
      ]);
      
      alert('회원가입이 완료되었습니다!');
      
      this.cleanup();
      Utils.closeModal('profileModal');
      
    } catch (error) {
      ErrorHandler.logAndNotify(error, '회원가입 완료');
    } finally {
      LoadingManager.hideLoading(verifyBtn);
    }
  }

  /**
   * 프로필 저장 및 회원가입 처리 (기존 호환성용 - 실제로는 숨김)
   */
  async handleSaveProfile() {
    const nickname = document.getElementById('nickname')?.value.trim();
    const saveBtn = document.getElementById('saveProfileBtn');
    
    if (!nickname) {
      alert(ERROR_MESSAGES.NICKNAME_REQUIRED);
      return;
    }
    
    if (!Validator.validateNickname(nickname)) {
      alert(ERROR_MESSAGES.NICKNAME_LENGTH);
      return;
    }

    if (!Validator.isHanilEmail(this.signupEmail)) {
      alert(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    try {
      LoadingManager.showLoading(saveBtn, LOADING_MESSAGES.CREATING_ACCOUNT);

      const userCredential = await this.firebase.createUserWithEmailAndPassword(
        this.auth, 
        this.signupEmail, 
        this.signupPassword
      );
      const user = userCredential.user;

      console.log('계정 생성 성공:', user);

      this.tempUserData = {
        email: this.signupEmail,
        nickname: nickname,
        avatarUrl: Utils.generateAvatarUrl(nickname)
      };

      await this.firebase.sendEmailVerification(user);
      
      alert('인증 이메일이 발송되었습니다.\n이메일을 확인하고 인증을 완료한 후 "이메일 인증 확인" 버튼을 클릭해주세요.');

      this.updateUIForEmailVerification();

    } catch (error) {
      ErrorHandler.logAndNotify(error, '계정 생성');
    } finally {
      LoadingManager.hideLoading(saveBtn);
    }
  }

  /**
   * 닉네임 변경 처리
   */
  async handleSaveNickname() {
    const newNickname = document.getElementById('newNickname')?.value.trim();
    
    if (!newNickname) {
      alert(ERROR_MESSAGES.NICKNAME_REQUIRED);
      return;
    }
    
    if (!Validator.validateNickname(newNickname)) {
      alert(ERROR_MESSAGES.NICKNAME_LENGTH);
      return;
    }
    
    const user = this.auth.currentUser;
    if (!user) {
      alert(ERROR_MESSAGES.LOGIN_REQUIRED);
      return;
    }
    
    try {
      await Promise.all([
        this.firebase.setDoc(
          this.firebase.doc(this.db, 'profiles', user.uid),
          { nickname: newNickname },
          { merge: true }
        ),
        this.firebase.updateProfile(user, { displayName: newNickname })
      ]);
      
      const editSuccessMessage = document.getElementById('editSuccessMessage');
      if (editSuccessMessage) {
        editSuccessMessage.style.display = "block";
      }
      
      this.updateUIForAuthState(true);
      
      setTimeout(() => {
        Utils.closeModal('profileEditModal');
      }, 1000);
      
    } catch (error) {
      ErrorHandler.logAndNotify(error, '닉네임 수정');
    }
  }

  /**
   * 비밀번호 재설정 이메일 발송 처리
   */
  async handleSendPasswordReset() {
    const email = document.getElementById('resetEmail')?.value.trim();
    const sendBtn = document.getElementById('sendResetEmailBtn');
    
    if (!email) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }
    
    if (!Validator.isHanilEmail(email)) {
      alert(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    try {
      LoadingManager.showLoading(sendBtn, LOADING_MESSAGES.SENDING_EMAIL);
      
      await this.firebase.sendPasswordResetEmail(this.auth, email);
      
      alert('비밀번호 재설정 이메일이 전송되었습니다.\n이메일을 확인하고 안내에 따라 비밀번호를 재설정해주세요.');
      
      Utils.closeModal('passwordResetModal');
      Utils.clearForm('passwordResetForm');
      
    } catch (error) {
      ErrorHandler.logAndNotify(error, '비밀번호 재설정 이메일 전송');
    } finally {
      LoadingManager.hideLoading(sendBtn);
    }
  }

  /**
   * 로그아웃 처리
   */
  async handleLogout() {
    try {
      this.cleanup();
      await this.firebase.signOut(this.auth);
      
    } catch (error) {
      ErrorHandler.logAndNotify(error, '로그아웃');
    }
  }

  /**
   * ✅ 사용자 프로필 표시 (포인트 포함) - getUserPoints를 this.getUserPoints로 수정
   */
  async showUserProfile() {
    try {
      const user = this.auth.currentUser;
      
      if (!user) {
        console.log('사용자 정보 없음');
        this.updateUIForAuthState(false);
        return;
      }

      console.log('현재 사용자:', user);

      const docRef = this.firebase.doc(this.db, 'profiles', user.uid);
      const docSnap = await this.firebase.getDoc(docRef);

      let profileData = {
        email: user.email,
        nickname: user.displayName || user.email.split('@')[0],
        avatar_url: user.photoURL
      };
      
      if (docSnap.exists()) {
        profileData = { ...profileData, ...docSnap.data() };
        console.log('프로필 데이터:', profileData);
      } else {
        console.log('프로필 데이터 없음, 기본값 사용');
        const nickname = user.displayName || user.email.split('@')[0];
        profileData = {
          ...profileData,
          nickname: nickname,
          avatar_url: Utils.generateAvatarUrl(nickname, 35)
        };
      }

      // ✅ 포인트 조회 - this.getUserPoints 사용
      console.log("auth.js - showUserProfile - 포인트 조회 시작");
      const userPoints = await this.getUserPoints(user.uid);
      console.log("auth.js - showUserProfile - 조회된 포인트:", userPoints);
      profileData.points = userPoints;

      // ✅ 전역 변수에도 프로필 데이터 저장
      window.currentUserProfile = profileData;

      Utils.closeAllModals();
      this.updateUIForAuthState(true, profileData);

    } catch (error) {
      console.error('프로필 표시 중 오류:', error);
      this.updateUIForAuthState(false);
    }
  }

  /**
   * 이메일 인증 대기 상태 UI 업데이트 (수정됨)
   */
  updateUIForEmailVerification() {
    const saveBtn = document.getElementById('saveProfileBtn');
    const checkVerificationBtn = document.getElementById('checkVerificationBtn');
    const buttonContainer = saveBtn?.parentElement;
    
    // "저장하고 가입" 버튼 숨김
    if (saveBtn) {
      saveBtn.style.display = 'none';
    }
    
    // "이메일 인증 확인" 버튼 표시
    if (checkVerificationBtn) {
      checkVerificationBtn.style.display = 'inline-block';
      checkVerificationBtn.disabled = false;
      checkVerificationBtn.textContent = '이메일 인증 확인';
      checkVerificationBtn.style.backgroundColor = '#667eea'; // 기본 색상
      
      if (buttonContainer) {
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.alignItems = 'center';
      }
    }
  }

  /**
   * 인증 메일 발송 후 대기 상태 UI 업데이트
   */
  updateUIForWaitingVerification() {
    const checkVerificationBtn = document.getElementById('checkVerificationBtn');
    
    if (checkVerificationBtn) {
      checkVerificationBtn.textContent = '이메일 인증을 완료한 후 클릭하세요';
      checkVerificationBtn.disabled = false;
      checkVerificationBtn.style.backgroundColor = '#f39c12'; // 대기 상태 색상
      
      // 주기적으로 인증 상태 확인
      this.startVerificationCheck();
    }
  }

  /**
   * 인증 상태 주기적 확인
   */
  startVerificationCheck() {
    if (this.verificationCheckInterval) {
      clearInterval(this.verificationCheckInterval);
    }
    
    this.verificationCheckInterval = setInterval(async () => {
      const user = this.auth.currentUser;
      if (user) {
        await user.reload();
        const refreshedUser = this.auth.currentUser;
        
        if (refreshedUser.emailVerified) {
          // 인증 완료되면 버튼 상태 변경
          const checkVerificationBtn = document.getElementById('checkVerificationBtn');
          if (checkVerificationBtn) {
            checkVerificationBtn.textContent = '인증 완료! 회원가입 완료하기';
            checkVerificationBtn.style.backgroundColor = '#4CAF50'; // 완료 상태 색상
          }
          
          // 인터벌 정리
          clearInterval(this.verificationCheckInterval);
          this.verificationCheckInterval = null;
        }
      }
    }, 2000); // 2초마다 확인
  }

  /**
   * 인증 상태에 따른 UI 업데이트
   * @param {boolean} isAuthenticated - 인증 상태
   * @param {Object} profileData - 프로필 데이터
   */
  updateUIForAuthState(isAuthenticated, profileData = null) {
    if (typeof window.updateUIForAuthState === 'function') {
      window.updateUIForAuthState(isAuthenticated, profileData);
    }
  }

  /**
   * 임시 데이터 및 상태 초기화 (수정됨)
   */
  cleanup() {
    this.tempUserData = null;
    this.signupEmail = '';
    this.signupPassword = '';
    
    // 인증 확인 인터벌 정리
    if (this.verificationCheckInterval) {
      clearInterval(this.verificationCheckInterval);
      this.verificationCheckInterval = null;
    }
    
    // 닉네임 입력 필드 복원
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) {
      nicknameInput.disabled = false;
      nicknameInput.value = '';
    }
  }

  /**
   * 인스턴스 정리
   */
  destroy() {
    this.eventManager.removeAllListeners();
    this.cleanup();
  }
}

// 전역 인스턴스 생성
const authManager = new AuthManager();

// ✅ authManager를 전역으로 노출
window.authManager = authManager;

// 전역 함수 내보내기 (하위 호환성)
window.logout = () => authManager.handleLogout();
window.showUserProfile = () => authManager.showUserProfile();
