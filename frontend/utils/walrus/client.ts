// 优先使用环境变量中的配置，如果失败则回退到列表中的其他节点
const ENV_PUBLISHER = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER;
const ENV_AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR;

export const PUBLISHERS = [
    ENV_PUBLISHER,
    'https://publisher.walrus-testnet.walrus.space',
    'https://walrus-testnet-publisher.nodes.guru',
    'https://walrus-testnet-publisher.nodeinfra.com',
    'https://walrus-testnet-publisher.stakely.io',
    'https://walrus-publisher-testnet.suisec.tech:9001',
    'https://publisher.testnet.walrus.atalma.io',
].filter(Boolean) as string[];

export const AGGREGATORS = [
    ENV_AGGREGATOR,
    'https://aggregator.walrus-testnet.walrus.space',
    'https://walrus-testnet-aggregator.nodes.guru',
    'https://walrus-testnet-aggregator.nodeinfra.com',
    'https://walrus-testnet-aggregator.stakely.io',
    'https://walrus-aggregator-testnet.suisec.tech',
    'https://aggregator.testnet.walrus.atalma.io',
].filter(Boolean) as string[];

// 常量兼容
export const WALRUS_PUBLISHER = PUBLISHERS[0];
export const WALRUS_AGGREGATOR = AGGREGATORS[0];
