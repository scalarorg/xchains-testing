import { ethers } from "ethers";
import { EthereumAccount } from "../types/eth";

export async function sendEther(
  sender: EthereumAccount,
  recipientAddress: string,
  amountInEther: string,
  ethRpcUrl: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(ethRpcUrl);
  const signer = new ethers.Wallet(sender.privateKey, provider);

  const tx = await signer.sendTransaction({
    to: recipientAddress,
    value: ethers.parseEther(amountInEther),
  });

  return tx.hash;
}
