import products from "../../../data/products.json";

export const revalidate = 300;

export async function GET() {
  return Response.json(products, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
