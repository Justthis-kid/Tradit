import products from "../../../data/products.json";

export async function GET() {
  return Response.json(products);
}
