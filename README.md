# AIssue Frontend (React)

AIssue는 GitHub 이슈를 AI로 분석하여 자동으로 해결책을 제안하는 시스템입니다.  
이 저장소는 React 기반의 프론트엔드 애플리케이션을 제공합니다.

## 🚀 실행 방법

```bash
npm install
npm run dev
```

- 환경 변수 설정이 필요한 경우 `.env` 파일을 프로젝트 루트에 추가하세요.

## 🧪 테스트 방법

- 웹 브라우저를 통해 직접 접속하여 UI/UX를 테스트할 수 있습니다.

## 📋 주요 기능

- [AIssue-BE-Express](https://github.com/c99-dev/AIssue-BE-Express)와 RESTful API 연동
- [AIssue-BE-Flask](https://github.com/c99-dev/AIssue-BE-Flask)와 RESTful API 연동
- GitHub 이슈 정보를 사용자에게 시각적으로 보여주는 기능
- 사용자 인증 및 관리 (로그인, 회원가입 등)
- 결제 서비스 관련 UI/UX (토스페이먼츠 연동 백엔드와 연계)
- 이메일 및 브라우저 알림 수신 및 표시 기능
- 이슈 생성, 편집, 조회 등 사용자 인터페이스 제공

## 🛠️ 기술 스택

- React
- JavaScript (주요 언어)
- HTML
- Tailwind CSS (스타일링 프레임워크)
- Lucid (아이콘 라이브러, UI 컴포넌트 라이브러리)

## 📁 프로젝트 구조

```
src/
├── components/   # 재사용 가능한 UI 컴포넌트
├── pages/        # 각 페이지 컴포넌트
├── assets/       # 이미지, 폰트 등 정적 자원
├── styles/       # 전역 스타일 또는 테마
├── utils/        # 유틸리티 함수
├── hooks/        # 커스텀 React Hooks
├── services/     # API 통신 로직
├── App.js        # 메인 애플리케이션 컴포넌트
└── index.js      # 애플리케이션 진입점
```

## 🤝 기여 방법

1. 이슈 또는 PR 등록 전, 반드시 최신 브랜치로 업데이트 
2. 코드 스타일은 프로젝트 내 기존 스타일을 따릅니다.
