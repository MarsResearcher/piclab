/**
 * Bundled HD stock catalog — shared by template builds and the local image library.
 * Images live in /public/template-assets (see CREDITS.md).
 * Regenerate files via: node scripts/fetch-template-assets.mjs
 */

export type StockCategory =
  | 'landscape'
  | 'architecture'
  | 'travel'
  | 'people'
  | 'still-life'
  | 'texture'
  | 'product';

export type StockItem = {
  id: string;
  file: string;
  /** Unsplash CDN photo id (photo-{id}). */
  photo: string;
  category: StockCategory;
  /** Display name in the local library. */
  name: string;
  credit: string;
};

export const STOCK_CATALOG: StockItem[] = [
  {
    id: 'hills',
    file: 'hills.jpg',
    photo: '1501785888041-af3ef285b470',
    category: 'landscape',
    name: '山野远峰',
    credit: 'Luca Bravo',
  },
  {
    id: 'alpine',
    file: 'alpine.jpg',
    photo: '1464822759023-fed622ff2c3b',
    category: 'landscape',
    name: '雪山湖泊',
    credit: 'Kalen Emsley',
  },
  {
    id: 'forest',
    file: 'forest.jpg',
    photo: '1441974231531-c6227db76b6e',
    category: 'landscape',
    name: '林间光斑',
    credit: 'Casey Horner',
  },
  {
    id: 'ocean',
    file: 'ocean.jpg',
    photo: '1507525428034-b723cf961d3e',
    category: 'landscape',
    name: '海岸浪线',
    credit: 'Sean Oulashin',
  },
  {
    id: 'desert',
    file: 'desert.jpg',
    photo: '1509316785289-025f5b846b35',
    category: 'landscape',
    name: '沙丘曲线',
    credit: 'Neom',
  },
  {
    id: 'mist',
    file: 'mist.jpg',
    photo: '1470071459604-3b5ec3a7fe05',
    category: 'landscape',
    name: '雾气山脊',
    credit: 'v2osk',
  },
  {
    id: 'snow',
    file: 'snow.jpg',
    photo: '1483921020237-2ff51e8e4b22',
    category: 'landscape',
    name: '雪原松林',
    credit: 'Aaron Burden',
  },
  {
    id: 'city',
    file: 'city.jpg',
    photo: '1519501025264-65ba15a82390',
    category: 'architecture',
    name: '都市夜景',
    credit: 'Pedro Lastra',
  },
  {
    id: 'architecture',
    file: 'architecture.jpg',
    photo: '1487958449943-2429e8be8625',
    category: 'architecture',
    name: '现代建筑',
    credit: 'Lance Anderson',
  },
  {
    id: 'concrete',
    file: 'concrete.jpg',
    photo: '1497366216548-37526070297c',
    category: 'architecture',
    name: '混凝土空间',
    credit: 'Nastuh Abootalebi',
  },
  {
    id: 'street',
    file: 'street.jpg',
    photo: '1477959858617-67f85cf4f1df',
    category: 'architecture',
    name: '城市街景',
    credit: 'Pedro Lastra',
  },
  {
    id: 'bridge',
    file: 'bridge.jpg',
    photo: '1476514525535-07fb3b4ae5f1',
    category: 'travel',
    name: '湖面倒影',
    credit: 'Luca Bravo',
  },
  {
    id: 'neon',
    file: 'neon.jpg',
    photo: '1540959733332-eab4deabeeaf',
    category: 'travel',
    name: '霓虹街巷',
    credit: 'Jezael Melgoza',
  },
  {
    id: 'portrait',
    file: 'portrait.jpg',
    photo: '1534528741775-53994a69daeb',
    category: 'people',
    name: '人像光影',
    credit: 'Ayo Ogunseinde',
  },
  {
    id: 'still',
    file: 'still.jpg',
    photo: '1495474472287-4d71bcdd2085',
    category: 'still-life',
    name: '咖啡静物',
    credit: 'Nadya Spetnitskaya',
  },
  {
    id: 'food',
    file: 'food.jpg',
    photo: '1546069901-ba9599a7e63c',
    category: 'still-life',
    name: '餐桌色彩',
    credit: 'Anna Pelzer',
  },
  {
    id: 'market',
    file: 'market.jpg',
    photo: '1488459716781-31db52582fe9',
    category: 'still-life',
    name: '市集蔬果',
    credit: 'Christine Siracusa',
  },
  {
    id: 'flowers',
    file: 'flowers.jpg',
    photo: '1490750967868-88aa4486c946',
    category: 'still-life',
    name: '花卉特写',
    credit: 'Annie Spratt',
  },
  {
    id: 'fabric',
    file: 'fabric.jpg',
    photo: '1558618666-fcd25c85cd64',
    category: 'texture',
    name: '织物纹理',
    credit: 'Five F Cat',
  },
  {
    id: 'paper',
    file: 'paper.jpg',
    photo: '1516414447565-b14be0adf13e',
    category: 'texture',
    name: '纸页书卷',
    credit: 'Thought Catalog',
  },
  {
    id: 'stone',
    file: 'stone.jpg',
    photo: '1550684848-fac1c5b4e853',
    category: 'texture',
    name: '石材肌理',
    credit: 'Pawel Czerwinski',
  },
  {
    id: 'product',
    file: 'product.jpg',
    photo: '1505740420928-5e560c06d30e',
    category: 'product',
    name: '极简产品',
    credit: 'C D-X',
  },
];

export type TemplateAssetId = (typeof STOCK_CATALOG)[number]['id'];

export const STOCK_BY_ID: Record<string, StockItem> = Object.fromEntries(
  STOCK_CATALOG.map((s) => [s.id, s]),
);

/** Stable IndexedDB sourceId so we can re-seed without duping. */
export function stockLibrarySourceId(id: string): string {
  return `builtin-stock:${id}`;
}
