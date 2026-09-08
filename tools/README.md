# Sincronizador NT Imports → Muka Imports

Este utilitário transforma o catálogo público da NT Imports em dados do catálogo Muka.

## O que ele faz

- percorre as 12 páginas atuais do catálogo público;
- abre cada produto;
- coleta nome, tamanhos e imagem principal;
- identifica marca/categoria quando possível;
- baixa as imagens para `assets/products/`;
- gera `data/products.json`;
- **não coleta nem publica preços**;
- exclui chinelos/slides/chuteiras do catálogo de tênis.

## Como executar

No computador com internet, dentro da pasta do projeto:

```bash
pip install requests beautifulsoup4
python tools/ntimport_sync.py
```

Depois, abra o site normalmente. O `script.js` lê `data/products.json`.

> Importante: o sincronizador depende da estrutura pública atual do site da NT. Se a NT alterar o layout, o parser poderá precisar de ajuste.
