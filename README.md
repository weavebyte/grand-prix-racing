# 나의 F1 · 그랑프리

키보드로 즐기는 비공식 팬 레이싱 게임입니다. 로그인·결제·설치 없이 데스크톱 브라우저에서 플레이할 수 있습니다. WebGL 2가 필요합니다.

**[게임 플레이](https://weavebyte.github.io/grand-prix-racing/)**

## 조작

- ↑ / W: 가속
- ↓ / S / Space: 브레이크
- ← → / A D: 조향
- P: 피트 예약
- Esc: 일시정지 / 계속

11개 팀, 22명 드라이버, 한국 창작 코스 포함 6개 코스, 날씨 변화, 충돌·연기·엔진 수리 기능이 있습니다. 팀과 드라이버 능력치, 주행 경로는 게임용 창작 설정입니다. 온라인 순위표는 없습니다.

## 개발 및 공개

```sh
npm ci
npm test
npm run build:pages
```

GitHub Pages는 `main` 브랜치의 `/docs` 폴더를 배포합니다. 변경 후 `npm run build:pages`를 실행하고 소스와 `docs`를 함께 커밋합니다. 이미지 파일을 분리해 필요한 이미지부터 불러옵니다.

로컬 파일을 직접 열려면 `npm run build` 실행 후 루트 `index.html`을 엽니다. 이 방식은 이미지가 포함된 큰 번들을 생성하며 해당 `game.js`는 Git에 포함하지 않습니다.

## 출처

F1 및 각 팀과 관계없는 비공식 팬 프로젝트입니다. 상표·로고·선수 및 경기장 사진의 권리는 각 권리자에게 있으며, 출처는 `assets/sources.json`, `assets/logos/sources.json`, `assets/sponsors/SOURCES.md`를 확인하세요. 출처 표기가 재배포 허가를 의미하지는 않습니다.

사진풍 손·관객·메카닉은 생성 이미지입니다. 하늘과 노면은 Poly Haven CC0 자료입니다. Three.js는 MIT 라이선스이며 `THREE-LICENSE.txt`에 포함되어 있습니다.
