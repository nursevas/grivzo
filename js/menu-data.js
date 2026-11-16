/* =========================================================
   GRIVZO — меню
   ---------------------------------------------------------
   КАК ПОМЕНЯТЬ ЦЕНУ: исправьте число в поле price (в тенге).

   КАК ДОБАВИТЬ ТОВАР: скопируйте любую строку с товаром,
   поменяйте id (уникальный, латиницей), название, описание,
   цену и фото.

   ВАРИАНТЫ (количество штук, бортик и т.п.):
     variants: [ { id: "8", label: "8 шт", price: 2000 }, ... ]
   Короткие варианты показываются кнопками прямо на карточке,
   длинные — в окне товара по кнопке «Выбрать».

   ФОТО: в поле img можно указать
     • свой файл:   "assets/products/cheese-beef.webp"
     • ссылку:      "https://..."
   Лучше всего — квадратные фото 800×800.

   Необязательные поля:
     weight  — вес/объём ("280 г", "0,5 л")
     badge   — "hit" (Хит), "new" (Новинка), "spicy" (Острое),
               "gift" (Соус в подарок)
     hidden  — true, чтобы временно скрыть товар из меню
   ========================================================= */

// Временные фото (Unsplash, бесплатная лицензия). Замените на свои фото блюд.
const photo = (id, focus = "") =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=720&h=720&q=80${focus}`;
// Кадрирование части фото: x, y — центр (0…1), z — увеличение
const crop = (id, x, y, z) => photo(id, `&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${z}`);

const IMG = {
  // свои фотографии бургеров
  cheeseBeef:      "assets/products/cheese-beef.webp",
  cheeseBeef2x:    "assets/products/cheese-beef-2x.webp",
  cheeseChicken:   "assets/products/cheese-chicken.webp",
  cheeseChicken2x: "assets/products/cheese-chicken-2x.webp",

  beef:      photo("1568901346375-23c9450c58cd"),
  beef2:     photo("1553979459-d2229ba7433b"),
  beef3:     photo("1594212699903-ec8a3eca50f5"),
  chicken:   photo("1606755962773-d324e0a13086"),
  chicken2:  crop("1606755962773-d324e0a13086", 0.5, 0.45, 1.4),
  chicken3:  crop("1606755962773-d324e0a13086", 0.5, 0.55, 1.8),
  mix:       photo("1550547660-d9450f859349"),
  strips:    photo("1586190848861-99aa4a171e90"),
  bbq:       photo("1572802419224-296b0aeee0d9"),
  pineapple: photo("1571091718767-18b5b1457add"),
  men:       photo("1607013251379-e6eecfffe234"),

  comboBeef:    photo("1561758033-d89a9ad46330"),
  comboChicken: crop("1561758033-d89a9ad46330", 0.6, 0.5, 1.5),
  comboTray:    photo("1610614819513-58e34989848b"),

  margherita: photo("1574071318508-1cdbab80d002"),
  pepperoni:  photo("1628840042765-356cda07504e"),
  pizzaA:     photo("1513104890138-7c749659a591"),
  pizzaB:     photo("1565299624946-b28f40a0ae38"),
  pizzaC:     photo("1604382354936-07c5d9983bd3"),
  pizzaD:     photo("1590947132387-155cc02f3212"),
  pizzaE:     photo("1585238342024-78d387f4a707"),
  pizzaF:     photo("1541745537411-b8046dc6d66c"),

  wingsBreaded: photo("1626645738196-c2a7c87a8f58"),
  wingsSweet:   photo("1567620832903-9fc6debc209f"),
  wingsBbq:     photo("1608039755401-742074f0548d"),
  stripsBox:    photo("1575932444877-5106bee2a599"),

  basketCheese:  photo("1585109649139-366815a0d713"),
  basketCaesar:  photo("1630431341973-02e1b662ec35"),
  basketSausage: photo("1576107232684-1279f390859f"),
  basketStrips:  photo("1562967914-608f82629710"),
  basketMush:    photo("1513456852971-30c0b8199d4d"),
  basketPine:    photo("1598679253544-2c97992403ea"),

  friesM: photo("1573080496219-bb080dd4f877"),
  friesL: photo("1541592106381-b31e9677c0e5"),

  sauceCheese:  crop("1563599175592-c58dc214deff", 0.5, 0.5, 3),
  sauceKetchup: photo("1472476443507-c7a5948772fc"),
  sauceGarlic:  crop("1563599175592-c58dc214deff", 0.5, 0.2, 3),
  sauceBbq:     crop("1563599175592-c58dc214deff", 0.25, 0.35, 3)
};

// Пицца: базовая цена + бортики (из меню: сырные бортики +500 ₸, бортики с сосисками +400 ₸)
const pizza = (id, name, price, img, desc) => ({
  id, name, price, img, desc,
  variantTitle: "Бортик",
  variants: [
    { id: "classic", label: "Без бортика", price },
    { id: "cheese",  label: "Сырный бортик (+500 ₸)", price: price + 500 },
    { id: "sausage", label: "Бортик с сосисками (+400 ₸)", price: price + 400 }
  ]
});

// Крылышки: 8 / 16 / 24 / 48 шт
const wings = (prices) => [8, 16, 24, 48].map((n, i) => ({ id: String(n), label: `${n} шт`, price: prices[i] }));

// Состав комбо — как в меню: «Чизбургер + фри + напиток 0,5 + соус»
const COMBO_DESC = "Чизбургер + фри + напиток 0,5 + соус";

/* Названия, цены и описания — строго по меню GRIVZO.
   Описание (desc) есть только там, где оно указано в меню. */
window.GRIVZO_MENU = [
  /* ---------------- КОМБО ---------------- */
  {
    id: "combo", title: "Комбо", nav: "Комбо",
    items: [
      { id: "combo-beef",       name: "Комбо Чизбургер говяжий",    price: 2600, desc: COMBO_DESC, img: IMG.comboBeef },
      { id: "combo-chicken",    name: "Комбо Чизбургер куриный",    price: 2500, desc: COMBO_DESC, img: IMG.comboChicken },
      { id: "combo-beef-2x",    name: "Комбо Чизбургер говяжий 2Х", price: 3100, desc: COMBO_DESC, img: IMG.beef2 },
      { id: "combo-chicken-2x", name: "Комбо Чизбургер куриный 2Х", price: 3000, desc: COMBO_DESC, img: IMG.chicken2 },
      { id: "combo-beef-3x",    name: "Комбо Чизбургер говяжий 3Х", price: 3850, desc: COMBO_DESC, img: IMG.beef3 },
      { id: "combo-chicken-3x", name: "Комбо Чизбургер куриный 3Х", price: 3750, desc: COMBO_DESC, img: IMG.chicken3 },
      { id: "combo-mix",        name: "Комбо Чизбургер Микс",       price: 3100, desc: COMBO_DESC, img: IMG.comboTray },
      { id: "combo-strips",     name: "Комбо Чизбургер Стрипс",     price: 2700, desc: COMBO_DESC, img: IMG.strips },
      { id: "combo-bbq",        name: "Комбо Чизбургер BBQ",        price: 3000, desc: COMBO_DESC, img: IMG.bbq },
      { id: "combo-pineapple",  name: "Комбо Чизбургер с ананасом", price: 3100, desc: COMBO_DESC, img: IMG.pineapple },
      { id: "combo-men",        name: "Комбо Чизбургер MEN",        price: 3350, desc: COMBO_DESC, img: IMG.men }
    ]
  },

  /* ---------------- БУРГЕРЫ ---------------- */
  {
    id: "burgers", title: "Бургеры", nav: "Бургеры",
    items: [
      { id: "cheese-beef",       name: "Чизбургер говяжий",    price: 1800, img: IMG.cheeseBeef },
      { id: "cheese-chicken",    name: "Чизбургер куриный",    price: 1700, img: IMG.cheeseChicken },
      { id: "cheese-beef-2x",    name: "Чизбургер говяжий 2Х", price: 2400, img: IMG.cheeseBeef2x },
      { id: "cheese-chicken-2x", name: "Чизбургер куриный 2Х", price: 2300, img: IMG.cheeseChicken2x },
      { id: "cheese-beef-3x",    name: "Чизбургер говяжий 3Х", price: 3150, img: IMG.beef3 },
      { id: "cheese-chicken-3x", name: "Чизбургер куриный 3Х", price: 3050, img: IMG.chicken3 },
      { id: "cheese-mix",        name: "Чизбургер Микс",       price: 2300, img: IMG.mix },
      { id: "cheese-strips",     name: "Чизбургер Стрипс",     price: 2000, img: IMG.strips },
      { id: "cheese-bbq",        name: "Чизбургер BBQ",        price: 2100, img: IMG.bbq },
      { id: "cheese-pineapple",  name: "Чизбургер с ананасом", price: 2100, img: IMG.pineapple },
      { id: "cheese-men",        name: "Чизбургер MEN",        price: 2450, img: IMG.men }
    ]
  },

  /* ---------------- ПИЦЦА ---------------- */
  {
    id: "pizza", title: "Пицца", nav: "Пицца",
    note: "+ Сырные бортики для пиццы — 500 ₸ · + Бортики с сосисками для пиццы — 400 ₸",
    items: [
      pizza("pizza-margherita",     "Маргарита",                 2000, IMG.margherita),
      pizza("pizza-pepperoni",      "Пепперони",                 2200, IMG.pepperoni),
      pizza("pizza-sausage",        "Пицца с сосисками",         2300, IMG.pizzaE),
      pizza("pizza-chicken",        "Куриная",                   2400, IMG.pizzaB),
      pizza("pizza-mushroom",       "С грибами",                 2500, IMG.pizzaA),
      pizza("pizza-hawaii",         "Гавайская",                 2500, IMG.pizzaF),
      pizza("pizza-caesar",         "Цезарь",                    2500, IMG.pizzaD),
      pizza("pizza-chicken-mush",   "Курица с грибами",          2500, IMG.pizzaC),
      pizza("pizza-4seasons",       "Четыре сезона",             2600, IMG.pizzaA),
      pizza("pizza-cheese-chicken", "С курицей с сырным соусом", 2600, IMG.pizzaF),
      pizza("pizza-chicken-bbq",    "Куриная BBQ",               2600, IMG.pizzaB),
      pizza("pizza-mexican",        "Мексиканская",              2600, IMG.pizzaC,
        "Соус томатный, сыр моцарелла, рваная говядина, болгарский перец, острый соус, орегано."),
      pizza("pizza-bolognese",      "Болоньезе",                 2600, IMG.pizzaE,
        "Соус томатный, сыр моцарелла, соус болоньезе (говяжий фарш), красный лук, орегано."),
      pizza("pizza-mix",            "Микс",                      2700, IMG.pepperoni)
    ]
  },

  /* ---------------- КРЫЛЫШКИ ---------------- */
  {
    id: "wings", title: "Крылышки", nav: "Крылышки",
    items: [
      { id: "wings-classic", name: "Классические в панировке", badge: "gift",
        desc: "1 соус в подарок.",
        img: IMG.wingsBreaded, variantTitle: "Количество",
        variants: wings([2000, 3500, 5000, 8500]) },
      { id: "wings-sweet", name: "В кисло-сладком соусе в японском стиле",
        img: IMG.wingsSweet, variantTitle: "Количество",
        variants: wings([2400, 4000, 6000, 9500]) },
      { id: "wings-bbq", name: "В соусе BBQ в корейском стиле",
        img: IMG.wingsBbq, variantTitle: "Количество",
        variants: wings([2400, 4000, 6000, 9500]) },
      { id: "strips", name: "Стрипсы",
        desc: "Наггетсы из филе (кур.)",
        img: IMG.stripsBox, variantTitle: "Размер",
        variants: [
          { id: "s", label: "Маленький", price: 1500 },
          { id: "m", label: "Средний",   price: 3000 },
          { id: "l", label: "Большой",   price: 4500 }
        ] }
    ]
  },

  /* ---------------- ФРИ В БАСКЕТЕ ---------------- */
  {
    id: "basket", title: "Фри в баскете", nav: "Фри в баскете",
    items: [
      { id: "basket-cheese",     name: "Фри-баскет Сырный",           price: 1750, img: IMG.basketCheese },
      { id: "basket-caesar",     name: "Фри-баскет Цезарь",           price: 1950, img: IMG.basketCaesar },
      { id: "basket-sausage",    name: "Фри-баскет с колбасками",     price: 1950, img: IMG.basketSausage },
      { id: "basket-strips",     name: "Фри-баскет со стрипсами",     price: 2250, img: IMG.basketStrips },
      { id: "basket-chick-mush", name: "Фри-баскет курица с грибами", price: 2250, img: IMG.basketMush },
      { id: "basket-pineapple",  name: "Фри-баскет ананас с курицей", price: 2250, img: IMG.basketPine }
    ]
  },

  /* ---------------- ФРИ ---------------- */
  {
    id: "fries", title: "Фри", nav: "Картофель фри",
    items: [
      { id: "fries-m", name: "Фри средний", price: 500, img: IMG.friesM },
      { id: "fries-l", name: "Фри большой", price: 700, img: IMG.friesL }
    ]
  }
];
