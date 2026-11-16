/* =========================================================
   GRIVZO — меню на казахском языке
   Русские названия и цены лежат в js/menu-data.js.
   Здесь только переводы: ключ — id товара/раздела из menu-data.js.
   Если перевода нет, на казахском показывается русский текст.
   ========================================================= */
const KK_COMBO = "Чизбургер + фри + сусын 0,5 + тұздық";

window.GRIVZO_MENU_KK = {
  sections: {
    combo:   { title: "Комбо" },
    burgers: { title: "Бургерлер" },
    pizza:   { title: "Пицца", note: "+ Пицца үшін ірімшікті бортиктер — 500 ₸ · + Пицца үшін шұжықты бортиктер — 400 ₸" },
    wings:   { title: "Қанаттар" },
    basket:  { title: "Баскеттегі фри" },
    fries:   { title: "Фри" }
  },

  // заголовок выбора и подписи вариантов (ключ — русский текст из menu-data.js)
  variantTitles: { "Бортик": "Борт", "Количество": "Саны", "Размер": "Көлемі" },
  variants: {
    "Без бортика": "Бортиксіз",
    "Сырный бортик (+500 ₸)": "Ірімшікті борт (+500 ₸)",
    "Бортик с сосисками (+400 ₸)": "Шұжықты борт (+400 ₸)",
    "8 шт": "8 дана", "16 шт": "16 дана", "24 шт": "24 дана", "48 шт": "48 дана",
    "Маленький": "Кіші", "Средний": "Орташа", "Большой": "Үлкен"
  },

  items: {
    // Комбо
    "combo-beef":       { name: "Чизбургер комбо (сиыр еті)",     desc: KK_COMBO },
    "combo-chicken":    { name: "Чизбургер комбо (тауық еті)",    desc: KK_COMBO },
    "combo-beef-2x":    { name: "Чизбургер комбо 2Х (сиыр еті)",  desc: KK_COMBO },
    "combo-chicken-2x": { name: "Чизбургер комбо 2Х (тауық еті)", desc: KK_COMBO },
    "combo-beef-3x":    { name: "Чизбургер комбо 3Х (сиыр еті)",  desc: KK_COMBO },
    "combo-chicken-3x": { name: "Чизбургер комбо 3Х (тауық еті)", desc: KK_COMBO },
    "combo-mix":        { name: "Чизбургер комбо Микс",           desc: KK_COMBO },
    "combo-strips":     { name: "Чизбургер комбо Стрипс",         desc: KK_COMBO },
    "combo-bbq":        { name: "Чизбургер комбо BBQ",            desc: KK_COMBO },
    "combo-pineapple":  { name: "Ананасты чизбургер комбо",       desc: KK_COMBO },
    "combo-men":        { name: "Чизбургер комбо MEN",            desc: KK_COMBO },

    // Бургеры
    "cheese-beef":       { name: "Сиыр етінен чизбургер" },
    "cheese-chicken":    { name: "Тауық етінен чизбургер" },
    "cheese-beef-2x":    { name: "Сиыр етінен чизбургер 2Х" },
    "cheese-chicken-2x": { name: "Тауық етінен чизбургер 2Х" },
    "cheese-beef-3x":    { name: "Сиыр етінен чизбургер 3Х" },
    "cheese-chicken-3x": { name: "Тауық етінен чизбургер 3Х" },
    "cheese-mix":        { name: "Чизбургер Микс" },
    "cheese-strips":     { name: "Чизбургер Стрипс" },
    "cheese-bbq":        { name: "Чизбургер BBQ" },
    "cheese-pineapple":  { name: "Ананасты чизбургер" },
    "cheese-men":        { name: "Чизбургер MEN" },

    // Пицца
    "pizza-margherita":     { name: "Маргарита" },
    "pizza-pepperoni":      { name: "Пепперони" },
    "pizza-sausage":        { name: "Шұжықты пицца" },
    "pizza-chicken":        { name: "Тауықты" },
    "pizza-mushroom":       { name: "Саңырауқұлақты" },
    "pizza-hawaii":         { name: "Гавай пиццасы" },
    "pizza-caesar":         { name: "Цезарь" },
    "pizza-chicken-mush":   { name: "Тауық пен саңырауқұлақ" },
    "pizza-4seasons":       { name: "Төрт мезгіл" },
    "pizza-cheese-chicken": { name: "Тауық пен ірімшік тұздығы" },
    "pizza-chicken-bbq":    { name: "BBQ тауықты" },
    "pizza-mexican":        { name: "Мексикалық",
      desc: "Томат тұздығы, моцарелла ірімшігі, жыртылған сиыр еті, болгар бұрышы, ащы тұздық, орегано." },
    "pizza-bolognese":      { name: "Болоньезе",
      desc: "Томат тұздығы, моцарелла ірімшігі, болоньезе тұздығы (сиыр фаршы), қызыл пияз, орегано." },
    "pizza-mix":            { name: "Микс" },

    // Крылышки
    "wings-classic": { name: "Паназылған классикалық қанаттар", desc: "1 тұздық сыйлыққа." },
    "wings-sweet":   { name: "Жапон үлгісіндегі тәтті-қышқыл тұздықта" },
    "wings-bbq":     { name: "Корей үлгісіндегі BBQ тұздығында" },
    "strips":        { name: "Стрипсы", desc: "Тауық филесінен наггетс." },

    // Фри в баскете
    "basket-cheese":     { name: "Ірімшікті фри-баскет" },
    "basket-caesar":     { name: "Цезарь фри-баскет" },
    "basket-sausage":    { name: "Шұжықты фри-баскет" },
    "basket-strips":     { name: "Стрипсы бар фри-баскет" },
    "basket-chick-mush": { name: "Тауық пен саңырауқұлақты фри-баскет" },
    "basket-pineapple":  { name: "Ананас пен тауықты фри-баскет" },

    // Фри
    "fries-m": { name: "Фри орташа" },
    "fries-l": { name: "Фри үлкен" }
  }
};
