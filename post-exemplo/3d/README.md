# Imagens 3D do carrossel

`scene.html` desenha as duas imagens com three.js 0.160.0:

- `?mode=hero` — a tecla Tab isolada (`tecla-tab-crop.png`, depois de recortada)
- `?mode=field` — o teclado com luz vermelha (`teclado.png`)

Para voltar a gerar: `npm install three@0.160.0`, servir esta pasta (`python3 -m http.server 8765`) e correr `node shot.js` (Playwright).

- `?mode=aa` — o «AA» extrudido em Lexend 700 (`post-eaa/aa-3d.png`, depois de recortado). Precisa de `lexend-700.ttf` na mesma pasta (Google Fonts).
