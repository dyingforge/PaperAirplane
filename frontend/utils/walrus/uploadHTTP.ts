interface UploadResponse {
    newlyCreated?: {
        blobObject?: {
            blobId: string;
        };
    };
    alreadyCertified?: {
        blobId: string;
    };
}

/**
 * 通过 HTTP PUT 上传文件到 Walrus Publisher
 * @param file - 浏览器 File 对象或 Blob
 * @param epochs - 存储周期 (默认 2)
 */
export async function uploadBlob(file: File | Blob, epochs: number = 2): Promise<string> {
    const url = `${import.meta.env.VITE_PUBLISHER}/v1/blobs?epochs=${epochs}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        body: file, 
    });

    if (!response.ok) {
        throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
    }

    const data: UploadResponse = await response.json();

    // 处理两种可能的成功响应结构
    if (data.newlyCreated?.blobObject?.blobId) {
        return data.newlyCreated.blobObject.blobId;
    } else if (data.alreadyCertified?.blobId) {
        return data.alreadyCertified.blobId;
    }

    throw new Error('Invalid response format from Walrus Publisher');
}
