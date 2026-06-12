/**
 * Plik: app/api/orders/[id]/attachments/route.ts
 * Cel: Załączniki zlecenia — przesyłanie pliku (POST multipart: pole `file`),
 *      listowanie (GET) oraz usuwanie (DELETE ?type=&id=). Zdjęcia trafiają do
 *      modelu Photo, pozostałe pliki do Document. RBAC jak dla zlecenia.
 * Zależności: lib/prisma, lib/rbac, lib/orders, lib/uploads, lib/audit.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { canMutateOrder } from '@/lib/orders';
import { saveUploadedFile } from '@/lib/uploads';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };

async function loadOrderForUser(
  orderId: string,
  session: Awaited<ReturnType<typeof requireAuth>>,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order)
    return {
      error: NextResponse.json(
        { error: 'Zlecenie nie istnieje' },
        { status: 404 },
      ),
    };
  if (!canMutateOrder(session, order))
    return {
      error: NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 }),
    };
  return { order };
}

// GET — lista załączników (zdjęcia + dokumenty).
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { error } = await loadOrderForUser(params.id, session);
    if (error) return error;

    const [photos, documents] = await Promise.all([
      prisma.photo.findMany({
        where: { orderId: params.id },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.document.findMany({
        where: { orderId: params.id },
        orderBy: { uploadedAt: 'desc' },
      }),
    ]);
    return NextResponse.json({ photos, documents });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST — prześlij plik (multipart/form-data, pole "file").
export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { error } = await loadOrderForUser(params.id, session);
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
    }

    let saved;
    try {
      saved = await saveUploadedFile(file);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Błąd zapisu pliku' },
        { status: 400 },
      );
    }

    const record = saved.isImage
      ? await prisma.photo.create({
          data: {
            orderId: params.id,
            url: saved.url,
            caption: saved.fileName,
          },
        })
      : await prisma.document.create({
          data: {
            orderId: params.id,
            fileName: saved.fileName,
            fileUrl: saved.url,
            fileType: saved.fileType,
          },
        });

    await createAuditLog({
      userId: session.user.id,
      action: 'ORDER_ATTACHMENT_ADD',
      entity: 'Order',
      entityId: params.id,
    });

    return NextResponse.json(
      { kind: saved.isImage ? 'photo' : 'document', record },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE ?type=photo|document&attId=...
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { error } = await loadOrderForUser(params.id, session);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const attId = searchParams.get('attId');
    if (!attId || (type !== 'photo' && type !== 'document')) {
      return NextResponse.json({ error: 'Błędne parametry' }, { status: 400 });
    }

    if (type === 'photo') {
      await prisma.photo.deleteMany({
        where: { id: attId, orderId: params.id },
      });
    } else {
      await prisma.document.deleteMany({
        where: { id: attId, orderId: params.id },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
