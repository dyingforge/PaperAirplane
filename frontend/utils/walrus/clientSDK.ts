import { SuiClient } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';
import { getFullnodeUrl } from '@mysten/sui/client';

const client = new SuiClient({
    url: getFullnodeUrl('testnet'),
    network: 'testnet',
  }).$extend(
    walrus({
      uploadRelay: {
        host: 'https://upload-relay.testnet.walrus.space',
        timeout: 60000,
        sendTip: {
          max: 1000,
        },
      },
      storageNodeClientOptions: {
        timeout: 30000,
        onError: (error) => {
          console.warn('[Walrus Storage Node]', error.message);
        },
      },
    }),
  );
  
export const walrusClient = client;


