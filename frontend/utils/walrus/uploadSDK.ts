import { WalrusFile } from "@mysten/walrus";
import { walrusClient } from "./clientSDK";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";

export async function createWalrusFile(content: string, address: string) {
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const file = WalrusFile.from({
    contents: new TextEncoder().encode(content),
    identifier: "rumor.txt",
    tags: {
      "content-type": "text/plain",
    },
  });
  // Step 1: Create and encode the flow (can be done immediately when file is selected)
  const flow = walrusClient.walrus.writeFilesFlow({
    files: [file],
  });

  await flow.encode();

  // Step 2: Register the blob (triggered by user clicking a register button after the encode step))
  const registerTx = flow.register({
    epochs: 3,
    owner: address,
    deletable: true,
  });
  const { digest } = await signAndExecuteTransaction({
    transaction: registerTx as any,
  });
  // Step 3: Upload the data to storage nodes
  // This can be done immediately after the register step, or as a separate step the user initiates
  await flow.upload({ digest });

  // Step 4: Certify the blob (triggered by user clicking a certify button after the blob is uploaded)

  const certifyTx = flow.certify();

  await signAndExecuteTransaction({ transaction: certifyTx as any });

  // Step 5: Get the new files
  const files = await flow.listFiles();
  console.log("Uploaded files", files);
}
