const CART_KEY = "cart";
const LEGACY_BAG_KEY = "bag";
export const CART_UPDATED_EVENT = "cart:updated";

function normalizeItem(item) {
  if (!item || typeof item !== "object") {
    throw new Error("Saved cart data is invalid. Remove the saved cart and try again.");
  }

  const title = typeof item.title === "string" ? item.title : item.name;
  const price = Number(item.price);
  const quantity = Number(item.qty ?? 1);

  if (
    typeof title !== "string" ||
    !title ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error("Saved cart data is invalid. Remove the saved cart and try again.");
  }

  return {
    id: String(item.id ?? title),
    title,
    price,
    qty: quantity,
    image: typeof item.image === "string" ? item.image : "",
    detail: typeof item.detail === "string" ? item.detail : "",
  };
}

export function readCart() {
  const storedCart = localStorage.getItem(CART_KEY);
  const legacyBag = storedCart === null ? localStorage.getItem(LEGACY_BAG_KEY) : null;
  const serializedCart = storedCart ?? legacyBag;

  if (serializedCart === null) {
    return [];
  }

  let parsedCart;
  try {
    parsedCart = JSON.parse(serializedCart);
  } catch {
    throw new Error("Saved cart data could not be read. Remove the saved cart and try again.");
  }

  if (!Array.isArray(parsedCart)) {
    throw new Error("Saved cart data is invalid. Remove the saved cart and try again.");
  }

  const cart = parsedCart.map(normalizeItem);
  if (legacyBag !== null) {
    saveCart(cart);
    localStorage.removeItem(LEGACY_BAG_KEY);
  }
  return cart;
}

export function saveCart(items) {
  const cart = items.map(normalizeItem);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addToCart(product) {
  const cart = readCart();
  const item = normalizeItem(product);
  const existingItem = cart.find((cartItem) => cartItem.id === item.id);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push(item);
  }

  saveCart(cart);
}

export function updateCartQuantity(id, delta) {
  const cart = readCart()
    .map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  saveCart(cart);
}

export function removeFromCart(id) {
  saveCart(readCart().filter((item) => item.id !== id));
}
