interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: "0x339eab7569d5d58560fb666e0f23198d4efffe8aae5973d41b68e14db64b7cbb",
        Airport:"0x5d34528456fbb30a4370d923e2fc0bebe0715097a888182708b4eaf17dc758f9",
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}