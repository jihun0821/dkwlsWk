// 공지사항 관련 JavaScript
class NoticeManager {
    constructor() {
        this.currentPage = 1;
        this.noticesPerPage = 5;
        this.totalNotices = 0;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        await this.checkAdminStatus();
        await this.loadNotices();
        this.setupEventListeners();
    }

    async checkAdminStatus() {
        // Firebase auth 상태 확인
        if (window.firebase && window.firebase.getAuth) {
            const auth = window.firebase.getAuth();
            const user = auth.currentUser;
            
            if (user) {
                // 관리자 권한 확인 (실제 구현시 Firestore에서 확인)
                const adminEmails = [
                    'admin@hanilgo.cnehs.kr',
                    'teacher@hanilgo.cnehs.kr'
                    // 여기에 관리자 이메일 추가
                ];
                
                this.isAdmin = adminEmails.includes(user.email);
                
                if (this.isAdmin) {
                    document.getElementById('adminWriteBtn').style.display = 'block';
                }
            }
        }
    }

    setupEventListeners() {
        // 관리자 쓰기 버튼
        document.getElementById('adminWriteBtn').addEventListener('click', () => {
            document.getElementById('writeNoticeModal').style.display = 'block';
        });

        // 모달 닫기
        document.getElementById('closeWriteModal').addEventListener('click', () => {
            document.getElementById('writeNoticeModal').style.display = 'none';
        });

        document.getElementById('cancelWrite').addEventListener('click', () => {
            document.getElementById('writeNoticeModal').style.display = 'none';
        });

        // 공지사항 작성 폼
        document.getElementById('noticeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitNotice();
        });

        // More 모달
        document.getElementById('moreLink').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('moreModal').style.display = 'block';
        });

        document.getElementById('closeMoreModal').addEventListener('click', () => {
            document.getElementById('moreModal').style.display = 'none';
        });
    }

    async loadNotices() {
        const noticeList = document.getElementById('noticeList');
        
        // 샘플 데이터 (실제로는 Firebase에서 가져올 예정)
        const sampleNotices = [
            {
                id: 1,
                title: "한일고 축구 대회 일정 안내",
                content: "2025년 한일고 축구 대회가 다음과 같이 진행됩니다. 모든 참가자는 반드시 참고하시기 바랍니다.",
                author: "관리자",
                date: "2025-06-15",
                isImportant: true
            },
            {
                id: 2,
                title: "경기 예측 시스템 업데이트 안내",
                content: "경기 예측 시스템이 업데이트되었습니다. 새로운 기능과 개선사항을 확인해보세요.",
                author: "시스템관리자",
                date: "2025-06-14",
                isImportant: false
            },
            {
                id: 3,
                title: "리더보드 시스템 오픈",
                content: "이제 여러분의 예측 실력을 겨룰 수 있는 리더보드가 오픈되었습니다!",
                author: "관리자",
                date: "2025-06-13",
                isImportant: false
            },
            {
                id: 4,
                title: "사이트 이용 규칙 안내",
                content: "한일고 스포츠 예측 사이트 이용 시 지켜야 할 규칙들을 안내드립니다.",
                author: "관리자",
                date: "2025-06-12",
                isImportant: true
            },
            {
                id: 5,
                title: "첫 번째 공지사항입니다",
                content: "한일고 스포츠 예측 사이트에 오신 것을 환영합니다! 많은 이용 부탁드립니다.",
                author: "관리자",
                date: "2025-06-10",
                isImportant: false
            }
        ];

        this.totalNotices = sampleNotices.length;
        const startIndex = (this.currentPage - 1) * this.noticesPerPage;
        const endIndex = startIndex + this.noticesPerPage;
        const currentNotices = sampleNotices.slice(startIndex, endIndex);

        if (currentNotices.length === 0) {
            noticeList.innerHTML = `
                <div class="empty-notice">
                    <div class="empty-notice-icon">📋</div>
                    <div class="empty-notice-text">등록된 공지사항이 없습니다</div>
                    <div class="empty-notice-subtext">새로운 공지사항을 기다려주세요</div>
                </div>
            `;
        } else {
            noticeList.innerHTML = currentNotices.map(notice => `
                <div class="notice-item" onclick="openNoticeDetail(${notice.id})">
                    <div class="notice-item-header">
                        <h3 class="notice-item-title">${notice.title}</h3>
                        ${notice.isImportant ? '<span class="notice-badge">중요</span>' : ''}
                    </div>
                    <div class="notice-content-preview">
                        ${notice.content.length > 100 ? notice.content.substring(0, 100) + '...' : notice.content}
                    </div>
                    <div class="notice-meta">
                        <span class="notice-author">${notice.author}</span>
                        <span class="notice-date">${notice.date}</span>
                    </div>
                </div>
            `).join('');
        }

        this.renderPagination();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.totalNotices / this.noticesPerPage);
        // 변경: 공지사항 고유 id로 선택
        const paginationContainer = document.getElementById('noticePagination');

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="noticeManager.goToPage(${this.currentPage - 1})">
                이전
            </button>
        `;

        // 페이지 번호 (최대 5개씩 표시)
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" onclick="noticeManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="noticeManager.goToPage(${this.currentPage + 1})">
                다음
            </button>
        `;

        paginationHTML += `
            <span class="pagination-info">
                ${this.currentPage} / ${totalPages} 페이지 (총 ${this.totalNotices}개)
            </span>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.totalNotices / this.noticesPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.loadNotices();
        
        // 스크롤을 맨 위로
        document.querySelector('.notice-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    async submitNotice() {
        const title = document.getElementById('noticeTitle').value.trim();
        const content = document.getElementById('noticeContent').value.trim();
        const isImportant = document.getElementById('isImportant').checked;

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            // 실제로는 Firebase에 저장
            console.log('공지사항 저장:', { title, content, isImportant });
            
            // 폼 초기화
            document.getElementById('noticeForm').reset();
            document.getElementById('writeNoticeModal').style.display = 'none';
            
            alert('공지사항이 등록되었습니다.');
            this.loadNotices(); // 목록 새로고침
        } catch (error) {
            console.error('공지사항 저장 오류:', error);
            alert('공지사항 등록 중 오류가 발생했습니다.');
        }
    }
}

// 공지사항 상세보기
function openNoticeDetail(noticeId) {
    // 실제로는 상세 페이지로 이동하거나 모달로 표시
    console.log('공지사항 상세보기:', noticeId);
    alert(`공지사항 ${noticeId}번의 상세보기 기능은 준비 중입니다.`);
}

// 페이지 로드시 초기화
let noticeManager;
document.addEventListener('DOMContentLoaded', () => {
    noticeManager = new NoticeManager();
});
