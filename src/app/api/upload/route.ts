import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// 🔹 Configuração do Cloudinary (usa o teu .env.local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // O ficheiro enviado (input name="file")
    const file = formData.get("file") as File | null;

    // Public ID anterior (caso haja imagem antiga)
    const oldPublicId = formData.get("oldPublicId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro recebido." }, { status: 400 });
    }

    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Se houver imagem anterior → apaga antes de subir a nova
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
        console.log(`🧹 Imagem antiga (${oldPublicId}) removida do Cloudinary`);
      } catch (error) {
        console.warn("⚠️ Falha ao eliminar imagem antiga:", error);
      }
    }

    // Upload da nova imagem
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "terapias-manuais", // opcional: cria pasta no teu Cloudinary
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    const result = uploadResult as any;

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("❌ Erro no upload Cloudinary:", error);
    return NextResponse.json(
      { error: "Falha na ligação ao Cloudinary." },
      { status: 500 }
    );
  }
}
