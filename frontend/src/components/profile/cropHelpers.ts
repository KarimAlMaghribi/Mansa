export const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise(resolve => {
    image.onload = () => {
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx?.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
      }, 'image/jpeg');
    };
  });
};
