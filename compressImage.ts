//图片文件压缩
export async function compressImage(file: File) {
  const res = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target!.result as any;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置压缩后的图片尺寸
        const maxWidth = 200;
        const maxHeight = 200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 渲染压缩后的图片
        ctx!.clearRect(0, 0, width, height);
        ctx!.drawImage(img, 0, 0, width, height);

        // 获取压缩后的图片数据
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);

        resolve(compressedDataUrl);
      };
    };

    reader.readAsDataURL(file);
  });
  return dataURLtoFile(res, file.name);
}

// 转文件
export function dataURLtoFile(dataUrl, fileName) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
}
