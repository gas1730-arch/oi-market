import admin from 'firebase-admin'

if (!admin.apps.length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!sa) {
    // 초기화 지연: 환경변수에 서비스 계정 JSON을 넣어야 합니다.
    // 실제 배포/로컬 실행 시 FIREBASE_SERVICE_ACCOUNT에 JSON 문자열을 넣으세요.
  } else {
    try {
      const cred = JSON.parse(sa)
      admin.initializeApp({
        credential: admin.credential.cert(cred),
      })
    } catch (e) {
      console.error('Failed to init firebase admin:', e)
    }
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : ({
  // 빌드/테스트 시 앱이 초기화되지 않았다면 호출 시 명확한 에러를 던지는 안전한 스텁을 제공합니다.
  verifyIdToken: async () => { throw new Error('Firebase admin is not initialized (FIREBASE_SERVICE_ACCOUNT missing)') }
} as any)

export const adminDb = admin.apps.length ? admin.firestore() : ({
  collection: () => { throw new Error('Firebase admin is not initialized (FIREBASE_SERVICE_ACCOUNT missing)') }
} as any)
