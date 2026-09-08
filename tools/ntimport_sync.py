#!/usr/bin/env python3
"""
Muka Imports — NT Imports catalog synchronizer

Reads the public NT Imports product listing and product pages, extracts product
name, product URL, sizes and the first product image, then writes data/products.json
and downloads images into assets/products/.

Run from the project root:
    python tools/ntimport_sync.py

Requirements:
    pip install requests beautifulsoup4

This intentionally does NOT collect prices. It is designed for the Muka catalog,
where the customer is sent to WhatsApp to consult price.
"""
from __future__ import annotations

import json, re, time, hashlib, os, sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print('Instale as dependências: pip install requests beautifulsoup4')
    raise

BASE = 'https://www.ntimport.com.br'
LISTING = BASE + '/produtos/'
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'products.json'
IMG_DIR = ROOT / 'assets' / 'products'
IMG_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; MukaImportsCatalogSync/1.0)'}
SIZE_RE = re.compile(r'\b(?:3[3-9]|4[0-3])(?:/(?:3[4-9]|4[0-3]))?\b')

BRANDS = {
    'nike':'Nike','adidas':'Adidas','mizuno':'Mizuno','asics':'Asics',
    'nb':'New Balance','new balance':'New Balance','puma':'Puma','on':'On',
    'tommy':'Tommy Hilfiger','lacoste':'Lacoste','vans':'Vans',
}

EXCLUDED_NON_SNEAKER = ('chinelo', 'slide', 'chuteira')


def slugify(s):
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s.lower()).strip('-')
    return s[:100] or hashlib.md5(s.encode()).hexdigest()[:10]


def get(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text


def parse_listing(html):
    soup = BeautifulSoup(html, 'html.parser')
    found = {}
    for a in soup.find_all('a', href=True):
        href = urljoin(BASE, a['href'])
        if '/produtos/' not in href or href.rstrip('/') == LISTING.rstrip('/'):
            continue
        title = a.get_text(' ', strip=True)
        if not title:
            img = a.find('img', alt=True)
            title = img.get('alt','').strip() if img else ''
        if not title:
            continue
        # product URLs normally have a single slug after /produtos/
        path = urlparse(href).path.strip('/').split('/')
        if len(path) != 2 or path[0] != 'produtos':
            continue
        if any(x in title.lower() for x in EXCLUDED_NON_SNEAKER):
            continue
        found[href] = title
    return found


def infer_brand(text):
    low = text.lower()
    for k,v in BRANDS.items():
        if k in low:
            return v
    # NT often uses abbreviated names in titles
    if low.startswith(('nk ', 'nike ')) or 'air max' in low or 'air force' in low or 'vomero' in low or 'nocta' in low or 'shox' in low or 'vapormax' in low or 'dunk' in low or 'jordan' in low:
        return 'Nike'
    if 'prophecy' in low or 'molas' in low:
        return 'Mizuno'
    if 'gel nyc' in low:
        return 'Asics'
    if low.startswith('ad ') or 'adizero' in low or 'campus' in low or 'bad bunny' in low or 'yeezy' in low or 'adi2000' in low:
        return 'Adidas'
    if low.startswith('puma'):
        return 'Puma'
    if low.startswith('nb ') or 'new balance' in low:
        return 'New Balance'
    if low.startswith('tênis on') or low.startswith('on '):
        return 'On'
    return 'Outro'


def infer_category(title, url):
    t = (title + ' ' + url).lower()
    for key, label in [
        ('air-max','Air Max'),('air-force','Air Force 1'),('dunk','Dunk'),
        ('vomero','Vomero'),('vapormax','Vapormax'),('shox','Shox'),
        ('nocta','Nocta'),('jordan','Jordan'),('v5-rnr','V5 RNR'),
        ('prophecy','Prophecy'),('adizero','Adizero'),('campus','Campus'),
        ('bad-bunny','Bad Bunny'),('gel-nyc','Gel NYC'),('nb-725','NB 725'),
        ('sc-elite','NB SC Elite'),('caven','Puma Caven'),('12-molas','12 Molas'),
        ('on ','On'),('on-','On'),
    ]:
        if key in t:
            return label
    return 'Tênis'


def parse_product(url, fallback_title):
    html = get(url)
    soup = BeautifulSoup(html, 'html.parser')
    h1 = soup.find('h1')
    title = h1.get_text(' ', strip=True) if h1 else fallback_title
    text = soup.get_text(' ', strip=True)

    # Collect sizes from the product page. Keep compound sizes exactly as displayed.
    sizes = []
    for s in SIZE_RE.findall(text):
        if s not in sizes:
            sizes.append(s)
    # Prefer the visible product-size block when available.
    if sizes:
        order = {'33/34':0,'34':1,'35':2,'35/36':3,'36':4,'37':5,'37/38':6,'38':7,'38/39':8,'39':9,'39/40':10,'40':11,'40/41':12,'41':13,'41/42':14,'42':15,'42/43':16,'43':17,'43/44':18}
        sizes.sort(key=lambda x: order.get(x,99))

    # Product images: prioritize og:image, then gallery images.
    images=[]
    og = soup.find('meta', attrs={'property':'og:image'})
    if og and og.get('content'):
        images.append(urljoin(url, og['content']))
    for img in soup.find_all('img'):
        src = img.get('data-src') or img.get('src')
        if not src: continue
        full = urljoin(url, src)
        if full not in images and ('mitiendanube' in full or '/products/' in full or 'produto' in full.lower()):
            images.append(full)
    image = images[0] if images else None

    return {
        'id': slugify(title),
        'brand': infer_brand(title),
        'name': title,
        'color': '',
        'model': category_model(title),
        'category': infer_category(title, url),
        'subcategory': infer_category(title, url),
        'sizes': sizes,
        'image': image,
        'supplierUrl': url,
        'source': 'NT Imports',
        'status': 'published' if image and sizes else 'pending',
        'tags': [infer_brand(title), infer_category(title, url)],
    }


def category_model(title):
    low=title.lower()
    for token in ['Air Max','Air Force 1','Dunk','Vomero','Vapormax','Shox','Nocta','Jordan','Prophecy','Adizero','Campus','Bad Bunny','Gel NYC','NB 725','NB SC Elite','Puma Caven','12 Molas']:
        if token.lower() in low:
            return token
    return title


def download_image(url, product_id):
    if not url: return None
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    if ext not in ('.jpg','.jpeg','.png','.webp'): ext='.webp'
    name = slugify(product_id) + ext
    out = IMG_DIR / name
    if out.exists() and out.stat().st_size > 5000:
        return 'assets/products/' + name
    try:
        r=requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        if len(r.content) < 1000: return None
        out.write_bytes(r.content)
        return 'assets/products/' + name
    except Exception as e:
        print('Imagem falhou:', url, e)
        return None


def main():
    all_products = {}
    # The current NT catalog exposes 12 listing pages.
    for page in range(1,13):
        url = LISTING if page == 1 else f'{LISTING}page/{page}/'
        print(f'Página {page}/12: {url}')
        try:
            items = parse_listing(get(url))
        except Exception as e:
            print('  falhou:', e); continue
        print('  produtos encontrados:', len(items))
        for u,t in items.items():
            if u in all_products: continue
            try:
                p=parse_product(u,t)
                local=download_image(p['image'], p['id'])
                if local: p['image']=local; p['status']='published'
                all_products[u]=p
                print('   +', p['name'])
                time.sleep(.15)
            except Exception as e:
                print('   !', t, e)

    products=list(all_products.values())
    products.sort(key=lambda p:(p['brand'], p['name']))
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\nFinalizado: {len(products)} produtos em {DATA}')
    print('Publicados com imagem baixada:', sum(p['status']=='published' for p in products))
    print('Pendentes:', sum(p['status']!='published' for p in products))

if __name__ == '__main__': main()
