import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName: string;
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  onUploadComplete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl || null
  );
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem válida",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 2MB",
          variant: "destructive",
        });
        return;
      }

      // Redimensionar imagem para 200x200px
      const resizedImage = await resizeImage(file, 200, 200);

      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      const filePath = `${fileName}`;

      // Deletar avatar antigo se existir
      if (currentAvatarUrl) {
        const oldFileName = currentAvatarUrl.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("avatars").remove([`${userId}/${oldFileName}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, resizedImage, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Atualizar profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onUploadComplete?.(publicUrl);

      toast({
        title: "Sucesso!",
        description: "Foto atualizada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Função para redimensionar imagem
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular dimensões mantendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erro ao processar imagem"));
          }
        }, file.type);
      };

      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = URL.createObjectURL(file);
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={previewUrl || undefined} alt={userName} />
        <AvatarFallback className="text-2xl">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>

      <div>
        <input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <label htmlFor="avatar-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("avatar-upload")?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Alterar Foto
              </>
            )}
          </Button>
        </label>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Imagem quadrada recomendada (máx 2MB)
      </p>
    </div>
  );
}
