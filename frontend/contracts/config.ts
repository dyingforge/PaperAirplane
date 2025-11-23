interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: "0xb1028b5ef41d5caf6e60605958183d6d02374d811c367e0d9a584879ba235db0",
        Airport:"0x4bffad764b5a4429fea9dc9112dc01b2b979c92060ab9e2c92629af66211396e",
        SealConfig:"0x17e4eb7f4b332e472eaa257bdb4abf9d3665c78b91aa43497a92bfdfeda59a8b",
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}