interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: "0x8c073db9de44cf1cc81cefb671715551a1f94a26fc9bb47107fef5dd5f52e344",
        Airport:"0xfa716ba800e8c1f48c34bea336e0a341ef2c14db8de936371313d08633075145",
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}