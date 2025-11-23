import { AGGREGATORS } from './client';

export async function downloadBlob(blobId: string): Promise<Uint8Array> {
    let lastError: Error | null = null;

    // 随机打乱节点顺序
    const shuffledAggregators = [...AGGREGATORS].sort(() => Math.random() - 0.5);

    for (const aggregator of shuffledAggregators) {
        try {
            console.log(`Trying download from: ${aggregator}`);
            const url = `${aggregator}/v1/blobs/${blobId}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);

        } catch (err) {
            console.warn(`Failed to download from ${aggregator}:`, err);
            lastError = err as Error;
        }
    }

    throw new Error(`All Walrus aggregators failed. Last error: ${lastError?.message}`);
}
