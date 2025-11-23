import { walrusClient } from './clientSDK';
import type { WalrusFile } from '@mysten/walrus';
import { RetryableWalrusClientError } from '@mysten/walrus';

export interface DownloadOptions {
  blobId: string;
  timeout?: number;
  maxRetries?: number;
}

async function downloadBlob(
  options: DownloadOptions
): Promise<WalrusFile> {
  const { blobId, maxRetries = 3 } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Walrus] 📥 下载 blobId: ${blobId} (尝试 ${attempt}/${maxRetries})`);
      
      const blob = await walrusClient.walrus.getBlob({ blobId });
      
      const files = await blob.files();
      
      if (files.length === 0) {
        throw new Error('下载失败：blob 中未找到文件');
      }
      
      console.log(`[Walrus] ✅ 下载成功，找到 ${files.length} 个文件`);
      
      return files[0];
      
    } catch (error) {
      lastError = error as Error;
      console.error(`[Walrus] ❌ 下载失败 (尝试 ${attempt}/${maxRetries}):`, error);
      
      if (error instanceof RetryableWalrusClientError) {
          console.log('[Walrus] 检测到可重试错误，重置客户端缓存...');
      }
      
      if (attempt < maxRetries) {
        const delayMs = 1000 * attempt;
        console.log(`[Walrus] ⏳ ${delayMs}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw new Error(
    `下载失败（已尝试 ${maxRetries} 次）: ${lastError?.message || '未知错误'}`
  );
}

async function getFileContent(file: WalrusFile): Promise<string> {
  const content = await file.text();
  return content;
}

/**
 * 读取用户帖子内容
 * @param blobId - Walrus blob ID
 * @param maxRetries - 最大重试次数（默认 3 次）
 * @returns 帖子内容（Markdown 文本）
 */
export async function readUserPostContent(
  blobId: string,
  maxRetries: number = 3
): Promise<string> {
  try {
    const file = await downloadBlob({ blobId, maxRetries });
    const content = await getFileContent(file);
    console.log(`[Walrus] 📄 成功读取内容，长度: ${content.length} 字符`);
    return content;
  } catch (error) {
    console.error('[Walrus] 读取文件内容失败:', error);
    throw new Error(
      `无法读取帖子内容: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}