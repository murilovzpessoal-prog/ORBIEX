import { getAllProducts } from './productsStore';
import { PROMPT_CARDS } from './promptCards';

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function triggerDownload(url: string, filename: string): Promise<void> {
  const resolvedUrl = url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`;
  try {
    const res = await fetch(resolvedUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
  } catch {
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  }
}

export async function downloadOrOpenWorkflowImages(opts: {
  productQuery?: string;
  influencerOrSceneQuery?: string;
  includeBothPair?: boolean;
}): Promise<{ ok: boolean; summary: string }> {
  const downloaded: string[] = [];
  const pQuery = norm(opts.productQuery || '');
  const iQuery = norm(opts.influencerOrSceneQuery || '');
  const wantPair = Boolean(opts.includeBothPair) || (!pQuery && !iQuery);

  // 1. Foto do Produto Campeão
  if (pQuery || wantPair) {
    const products = getAllProducts();
    let bestProd = products[0];
    if (pQuery) {
      const tokens = pQuery.split(' ').filter((t) => t.length > 2);
      let bestHits = -1;
      for (const p of products) {
        const pn = norm(`${p.name} ${p.category}`);
        const hits = tokens.filter((t) => pn.includes(t)).length + (pn.includes(pQuery) ? 4 : 0);
        if (hits > bestHits) {
          bestHits = hits;
          bestProd = p;
        }
      }
    }
    if (bestProd?.image) {
      const slug = norm(bestProd.name).replace(/\s+/g, '-').slice(0, 36) || 'produto';
      await triggerDownload(bestProd.image, `1-produto-${slug}.jpg`);
      downloaded.push(`Produto "${bestProd.name}"`);
    }
  }

  // 2. Imagem de Influenciadora / Ambiente da Biblioteca
  if (iQuery || wantPair) {
    const refImages = PROMPT_CARDS.filter((c) => c.mediaType === 'image');
    const influencers = refImages.filter((c) => c.filterCategory === 'Influenciadoras');
    let chosen = influencers[0] || refImages[0];

    if (iQuery) {
      const tokens = iQuery.split(' ').filter((t) => t.length > 2);
      let bestHits = -1;
      for (const c of refImages) {
        const cn = norm(`${c.title} ${c.description} ${c.filterCategory}`);
        const hits = tokens.filter((t) => cn.includes(t)).length + (cn.includes(iQuery) ? 4 : 0);
        if (hits > bestHits) {
          bestHits = hits;
          chosen = c;
        }
      }
    }

    if (chosen?.mediaUrl) {
      if (downloaded.length > 0) {
        await new Promise((r) => window.setTimeout(r, 350));
      }
      const slug = norm(chosen.title).replace(/\s+/g, '-').slice(0, 36) || 'referencia';
      await triggerDownload(chosen.mediaUrl, `2-referencia-${slug}.jpg`);
      downloaded.push(`Referência "${chosen.title}"`);
    }
  }

  if (!downloaded.length) {
    return { ok: false, summary: 'Nenhuma imagem encontrada para baixar.' };
  }

  return {
    ok: true,
    summary: `Baixei ${downloaded.join(' e ')} direto para a pasta Downloads — prontas para subir no Google Flow!`,
  };
}
