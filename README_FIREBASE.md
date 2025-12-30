# 오이마켓 - Firebase 설정 가이드

필수 환경변수:

- `FIREBASE_SERVICE_ACCOUNT` : 서비스 계정(JSON)을 문자열로 넣습니다. (서버, CI)
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, 등 클라이언트용 Firebase 설정.
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` : 네이버 지도 클라이언트 ID

로컬 실행 예시 (.env.local):

```
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", ... }'
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
```

Firestore 규칙 배포:

```
firebase deploy --only firestore:rules
```

실행:

```
npm install
npm run dev
```

핵심 구현 요약:
- `app/api/bid/route.ts` : AUCTION 입찰 트랜잭션 구현 (입찰 차단 로직 포함)
- `app/api/chats/route.ts` : 채팅 생성 규칙 구현 (AUCTION: 낙찰자만, NORMAL: 누구나 요청)
- `firestore.rules` : 기본 보안 규칙
