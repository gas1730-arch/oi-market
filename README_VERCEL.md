Vercel 배포 가이드 (우선)

이 문서는 `oi-market` Next.js 앱을 Vercel에 배포하기 위한 최소한의 절차와 권장 설정을 정리합니다. 이 프로젝트는 Next.js App Router + TypeScript 기반이며, 서버측으로 Firebase Admin을 사용합니다.

1) 전제 조건

- Vercel 계정 및 GitHub 연동
- 프로젝트가 GitHub에 푸시되어 있어야 함 (예: `gas1730-arch/oi-market`)
- Node.js (프로젝트의 `package.json`에 명시된 버전 권장)

2) 중요한 환경 변수

Vercel에 반드시 추가해야 하는 환경 변수들:

- `FIREBASE_SERVICE_ACCOUNT` : Firebase 서비스 계정 JSON을 한 줄 문자열로 저장합니다. (예: `{"type":"service_account", ...}`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` 등 클라이언트용 Firebase 설정
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` : 네이버 지도 클라이언트 ID

권장 방식:

- Vercel Dashboard -> Project -> Settings -> Environment Variables에서 `Preview`/`Production`에 맞게 값을 추가하세요.
- 서비스 계정 JSON은 민감정보이므로 Vercel Secrets을 사용해 저장한 뒤 환경변수로 참조할 수 있습니다. (대역폭/편의에 따라 `FIREBASE_SERVICE_ACCOUNT`에 직접 붙여넣어도 동작합니다.)

예시(로컬에서 Vercel CLI 사용):

```bash
# Vercel 로그인
vercel login

# 프로젝트 연결 (한 번만)
vercel link

# 환경변수 추가 (인터랙티브)
vercel env add FIREBASE_SERVICE_ACCOUNT production
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_NAVER_MAP_CLIENT_ID production
```

3) 빌드 설정

- Vercel은 Next.js를 자동으로 인식합니다. 기본 빌드 커맨드는 `npm run build`입니다.
- `package.json`에 `build` 스크립트가 있으면 Vercel에서 자동으로 사용합니다.
- Node 버전이 특정 버전을 요구하면 `engines.node`를 `package.json`에 설정하거나 Vercel Project Settings에서 Node 버전을 지정하세요.

4) 배포 흐름

- GitHub와 통합한 경우: 브랜치에 푸시(push)할 때마다 Vercel이 Preview 배포를 생성합니다.
- 메인 브랜치(예: `main`)에 병합하면 Production 배포가 트리거됩니다.

5) Firebase 관련 배포 후 작업

- Firestore 규칙 배포 (로컬에서):

```bash
firebase deploy --only firestore:rules
```

- 만약 Cloud Functions를 추가하면 `firebase deploy --only functions`를 사용합니다.

6) 배포 확인 및 디버깅 팁

- Vercel 대시보드의 Deployments 탭에서 빌드 로그와 배포 URL 확인
- 런타임 에러(서버 측)는 Vercel 로그에서 확인 가능. Firebase Admin 초기화 실패는 `FIREBASE_SERVICE_ACCOUNT` 값이 올바른지 확인하세요.

7) 권장 추가 설정

- Preview / Production 환경변수를 분리하여 보안 관리
- 환경변수에 민감정보(서비스 계정)는 가능한 Secret으로 관리
- 자동화: GitHub Actions 또는 Vercel의 Webhook을 통해 CI 파이프라인을 추가할 수 있습니다.

8) 참고: 서비스 계정 처리 주의사항

- `FIREBASE_SERVICE_ACCOUNT` 값은 JSON 전체를 한 줄로 넣어도 되고, Vercel Secret으로 저장 후 참조할 수 있습니다.
- 로컬 개발에서는 `.env.local`에 같은 값을 두고 `lib/firebaseAdmin.ts`가 이를 읽어 Admin SDK를 초기화합니다.

9) 다음 단계 제안

- (필수) Vercel에 환경변수 추가 후, 메인 브랜치에 푸시하여 한 번 배포해 보세요.
- (권장) 마감 처리(auction endsAt) 자동화용 Cloud Function 또는 외부 스케줄러 구현 및 배포

배포 관련 추가로 문서화가 필요하면 알려주세요. Firebase Hosting용 가이드는 요청하시면 이어서 작성하겠습니다.
