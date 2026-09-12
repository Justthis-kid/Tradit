import { NextResponse } from "next/server";

const products = [
  {
    id: "p1",
    name: "Nike Air Force 1 'Triple White'",
    brand: "Nike",
    price: 110,
    discountPrice: 90
  },
  {
    id: "p2",
    name: "Nike Dunk Low 'Panda'",
    brand: "Nike",
    price: 120,
    discountPrice: 95
  },
  {
    id: "p3",
    name: "Adidas Ultraboost 22",
    brand: "Adidas",
    price: 180,
    discountPrice: 140
  },
  {
    id: "p4",
    name: "New Balance 990v5",
    brand: "New Balance",
    price: 200,
    discountPrice: 160
  }
];

export async function GET() {
  return NextResponse.json(products);
}
