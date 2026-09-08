# Muka Imports — V2

Catálogo estático preparado para GitHub Pages.

## Estrutura
- `index.html` — estrutura e conteúdo da página
- `styles.css` — identidade visual e responsividade
- `script.js` — busca, filtros, modal, seleção de tamanho e WhatsApp
- `data/products.json` — base de produtos separada da interface
- `assets/logo-muka-imports.png` — logo oficial da Muka Imports

## Regras comerciais
- Nenhum preço é exibido no catálogo.
- O botão de consulta abre o WhatsApp da Muka.
- O tamanho selecionado é incluído automaticamente na mensagem.
- O número utilizado é +55 11 99738-4383.

## Regra de imagens
A versão final só publica imagens que foram validadas. Produtos sem imagem confirmada permanecem na base de dados com status `pending_image` e não aparecem no catálogo público. Isso evita fotos genéricas ou modelos/colorways incorretos.

## Atualização de produtos
Para adicionar um produto, edite `data/products.json` e use:
- `status: "published"` somente quando os dados e a imagem estiverem conferidos;
- `status: "pending_image"` enquanto a imagem correta ainda não estiver validada.

## Publicação no GitHub Pages
Substitua os arquivos do repositório pela estrutura deste ZIP, mantendo o nome `index.html` na raiz. Depois aguarde a atualização do GitHub Pages.


## Catálogo sincronizado
Esta versão contém 500 produtos únicos importados do catálogo público da NT Imports, com imagens locais e dados de marca, modelo, cor, categoria e numeração. Produtos duplicados por identificador foram consolidados. Preços não são publicados.
