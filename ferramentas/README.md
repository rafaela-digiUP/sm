# Auditoria de acessibilidade dos posts

`auditoria-acessibilidade.js` abre o `carrossel.html` de uma pasta, mede cada texto de cada slide e falha se algum não cumprir os critérios mínimos.

```
npm install playwright pngjs
node ferramentas/auditoria-acessibilidade.js post-digishield
```

## Critérios (slide de 1080 px de largura)

| Critério | Mínimo | Porquê |
| --- | --- | --- |
| Texto corrido (parágrafos) | 30 px | ≈ 11 px num telemóvel de 390 px |
| Qualquer outro texto (etiquetas, rodapés, contadores) | 26 px | ≈ 9,4 px no telemóvel |
| Contraste do texto normal | 4,5:1 | WCAG 2.2, 1.4.3 (AA) |
| Contraste do texto grande (≥ 66 px, ou ≥ 52 px em negrito) | 3:1 | equivale a 24 px / 18,7 px em negrito no telemóvel |
| Itálico | nenhum | |

O contraste é medido contra o fundo real: o script tira uma captura do slide sem texto e compara cada texto com os 2% de píxeis mais desfavoráveis por baixo dele (texturas, brilhos e imagens 3D incluídos).

Regras de letra que o script não mede, mas que seguimos:

- Lexend em todo o texto corrido; JetBrains Mono só em etiquetas curtas (até ~5 palavras).
- Maiúsculas só nas etiquetas mono, com espaçamento até 0,1 em.
- Entrelinha do texto corrido entre 1,4 e 1,5.
- Nada de texto riscado, sublinhado decorativo ou texto sobre fotografia sem fundo sólido.
