export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const maxWidth = 1024;
      const maxHeight = 1024;
      let { width, height } = img as HTMLImageElement;

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
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/webp',
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

