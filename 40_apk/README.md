# 40_apk — Ariadne 안드로이드 APK (TWA)

배포된 PWA(https://jwj-nick.github.io/ariadne/)를 **Trusted Web Activity** 로 감싼 껍데기다.
assetlinks 검증이 통과하면 주소창 없이 전체 화면으로 뜬다.
기록과 진도는 Chrome 과 같은 origin 이라 그대로 이어진다.

- **내려받기:** https://jwj-nick.github.io/ariadne/ariadne.apk (사이드로드 — "출처를 알 수 없는 앱" 허용 필요)
- **패키지:** `io.github.jwj_nick.ariadne` · versionCode 1 (1.0.0)
- **서명:** `ariadne-signing.keystore` (alias `ariadne`)
- **검증:** https://jwj-nick.github.io/.well-known/assetlinks.json 에 인증서 SHA256 등록됨
  (`23:71:20:AA:...`). **키를 갈면 assetlinks 도 함께 갱신해야 주소창이 사라진다.**

## ⚠️ 이 리포는 공개다

`.gitignore` 가 keystore·local.properties·app/·build/ 를 막고 있다.
**서명 키와 비밀번호를 커밋하지 않는다.** 키를 잃으면 같은 서명으로 덮어쓰기 설치를 할 수 없어
기존 설치를 지우고 새로 깔아야 하므로, 키스토어는 이 폴더 밖에도 한 벌 보관해 둔다.
비밀번호는 오너가 따로 관리한다.

## 앱을 고쳤을 때 APK 를 다시 만들 필요가 있는가

**대개 없다.** TWA 는 웹을 그대로 여는 껍데기라, `main` 에 push 해서 GitHub Pages 가 새로 뜨면
APK 를 그대로 두어도 새 화면이 나온다.
다시 만들어야 하는 경우는 **껍데기가 바뀔 때뿐**이다 — 아이콘, 앱 이름, 테마 색, 시작 주소, 화면 방향.

## 재빌드 절차

1. `twa-manifest.json` 의 `appVersionCode` 를 +1 하고 `appVersionName` 을 갱신한다.
2. `npx @bubblewrap/cli update --skipVersionUpgrade` (안드로이드 프로젝트 재생성)
3. `local.properties` 를 만든다: `sdk.dir=C\:/Users/admin/AppData/Local/Android/Sdk`
   (**정식 SDK 루트**여야 한다. cmdline-tools/latest 를 주면 AGP 가 플랫폼을 못 찾는다.)
4. `JAVA_HOME=C:\Users\admin\.jdk17\jdk-17.0.20.1+1` 을 잡고 `cmd /c .\gradlew.bat assembleRelease --no-daemon`
   (이 PC 는 `NoDefaultCurrentDirectoryInExePath` 라 `.\` 를 붙여야 한다.
   `bubblewrap build` 는 같은 이유로 실패하므로 gradle 을 직접 부른다.)
5. build-tools 34.0.0 으로 정렬하고 서명한다.
   ```
   zipalign -f -p 4 app/build/outputs/apk/release/app-release-unsigned.apk aligned.apk
   apksigner sign --ks ariadne-signing.keystore --ks-key-alias ariadne \
     --ks-pass pass:<비밀번호> --key-pass pass:<비밀번호> --out ariadne.apk aligned.apk
   apksigner verify --print-certs ariadne.apk
   ```
6. `cp ariadne.apk ../public/ariadne.apk` 후 `main` 에 push 하면 배포된다.

## 툴체인 (한자 앱에서 이미 깔아 둔 것을 그대로 쓴다)

- JDK 17: `C:\Users\admin\.jdk17\jdk-17.0.20.1+1` (Temurin)
- Android SDK: `C:\Users\admin\AppData\Local\Android\Sdk` (platforms 34/36 · build-tools 34.0.0)
- bubblewrap CLI: npm 전역
