/**
 * Plik: app/api/clients/[id]/attachments/route.ts
 * Cel: Załączniki klienta — upload (POST multipart `file`), lista (GET), usuwanie
 *      (DELETE ?type=&attId=). Zdjęcia → Photo, pozostałe → Document (z clientId).
 * Zależności: lib/prisma, lib/rbac, lib/uploads, lib/audit.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { saveUploadedFile } from '@/lib/uploads';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };

async function ensureClient(id: string) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client)
    return NextResponse.json({ error: 'Klient nie istnieje' }, { status: 404 });
  return null;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAuth();
    const notFound = await ensureClient(params.id);
    if (notFound) return notFound;

    const [photos, documents] = await Promise.all([
      prisma.photo.findMany({
        where: { clientId: params.id },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.document.findMany({
        where: { clientId: params.id },
        orderBy: { uploadedAt: 'desc' },
      }),
    ]);
    return NextResponse.json({ photos, documents });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const notFound = await ensureClient(params.id);
    if (notFound) return notFound;

    const file = (await req.formData()).get('file');
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
            clientId: params.id,
            url: saved.url,
            caption: saved.fileName,
          },
        })
      : await prisma.document.create({
          data: {
            clientId: params.id,
            fileName: saved.fileName,
            fileUrl: saved.url,
            fileType: saved.fileType,
          },
        });

    await createAuditLog({
      userId: session.user.id,
      action: 'CLIENT_ATTACHMENT_ADD',
      entity: 'Client',
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

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const attId = searchParams.get('attId');
    if (!attId || (type !== 'photo' && type !== 'document')) {
      return NextResponse.json({ error: 'Błędne parametry' }, { status: 400 });
    }
    if (type === 'photo') {
      await prisma.photo.deleteMany({
        where: { id: attId, clientId: params.id },
      });
    } else {
      await prisma.document.deleteMany({
        where: { id: attId, clientId: params.id },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
