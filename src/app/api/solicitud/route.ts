import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalog } from "@/lib/catalog";
import { cartItemsSchema, orderMessages, quoteCart } from "@/lib/cart";
import { whatsappLink } from "@/lib/config";

const requestSchema = z.object({
  items: cartItemsSchema.min(1),
  branch_id: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 20000)
    return NextResponse.json(
      { error: "Solicitud demasiado extensa." },
      { status: 413 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 20000)
      return NextResponse.json(
        { error: "Solicitud demasiado extensa." },
        { status: 413 },
      );
    const input = requestSchema.safeParse(JSON.parse(raw));
    if (!input.success)
      return NextResponse.json(
        { error: "Revisa los productos y cantidades del carrito." },
        { status: 400 },
      );
    const catalog = await getCatalog();
    if (catalog.preview && !catalog.demo)
      return NextResponse.json(
        {
          error:
            "Esta es una vista previa. Los productos requieren revisión antes de enviar solicitudes de compra.",
        },
        { status: 409 },
      );
    const branch = catalog.branches.find(
      (branch) => branch.id === input.data.branch_id,
    );
    if (input.data.branch_id && !branch)
      return NextResponse.json(
        { error: "Selecciona una sucursal válida." },
        { status: 400 },
      );
    const quote = quoteCart(
      input.data.items,
      catalog.products,
      input.data.branch_id,
    );
    if (quote.incomplete)
      return NextResponse.json(
        {
          error:
            "Hay productos sin precio confirmado. Consulta con la tienda antes de solicitar la compra.",
        },
        { status: 409 },
      );
    const messages = orderMessages(quote, branch?.name ?? "Sin seleccionar");
    return NextResponse.json(
      {
        total: quote.total,
        messages: messages.map((text) => ({ text, url: whatsappLink(text) })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Solicitud inválida."
            : error instanceof Error
              ? error.message
              : "No se pudo preparar la solicitud.",
      },
      { status: 400 },
    );
  }
}
