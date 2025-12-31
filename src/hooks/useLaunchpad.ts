import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'

export const LAUNCHPAD_ADDRESS = '0x56BEAeb96D33DEc49B2BF94c7cF610E8B8f3A507' as Address

export const LAUNCHPAD_ABI = [
  { inputs: [], name: 'platformFee', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getIDOCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getAllIDOs', outputs: [{ components: [
    { name: 'idoToken', type: 'address' }, { name: 'name', type: 'string' }, { name: 'description', type: 'string' },
    { name: 'imageUrl', type: 'string' }, { name: 'paymentToken', type: 'address' }, { name: 'isNativePayment', type: 'bool' },
    { name: 'tokenPrice', type: 'uint256' }, { name: 'tokensForSale', type: 'uint256' }, { name: 'tokensSold', type: 'uint256' },
    { name: 'softCap', type: 'uint256' }, { name: 'hardCap', type: 'uint256' }, { name: 'minContribution', type: 'uint256' },
    { name: 'maxContribution', type: 'uint256' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' },
    { name: 'totalRaised', type: 'uint256' }, { name: 'totalContributors', type: 'uint256' }, { name: 'creator', type: 'address' },
    { name: 'isActive', type: 'bool' }, { name: 'isFinalized', type: 'bool' }, { name: 'isWhitelisted', type: 'bool' }
  ], type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [
    { name: '_idoToken', type: 'address' }, { name: '_name', type: 'string' }, { name: '_description', type: 'string' },
    { name: '_imageUrl', type: 'string' }, { name: '_paymentToken', type: 'address' }, { name: '_isNativePayment', type: 'bool' },
    { name: '_tokenPrice', type: 'uint256' }, { name: '_tokensForSale', type: 'uint256' }, { name: '_softCap', type: 'uint256' },
    { name: '_hardCap', type: 'uint256' }, { name: '_minContribution', type: 'uint256' }, { name: '_maxContribution', type: 'uint256' },
    { name: '_startTime', type: 'uint256' }, { name: '_endTime', type: 'uint256' }, { name: '_isWhitelisted', type: 'bool' }
  ], name: 'createIDO', outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_idoId', type: 'uint256' }, { name: '_amount', type: 'uint256' }], name: 'contribute', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: '_idoId', type: 'uint256' }], name: 'claimTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_idoId', type: 'uint256' }], name: 'claimRefund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_idoId', type: 'uint256' }, { name: '_amount', type: 'uint256' }], name: 'depositIDOTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const

export interface IDOData {
  id: number; idoToken: Address; name: string; description: string; imageUrl: string
  paymentToken: Address; isNativePayment: boolean; tokenPrice: string; tokensForSale: string
  tokensSold: string; softCap: string; hardCap: string; minContribution: string; maxContribution: string
  startTime: number; endTime: number; totalRaised: string; totalContributors: number
  creator: Address; isActive: boolean; isFinalized: boolean; isWhitelisted: boolean
}

export function useLaunchpad() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)

  const waitForTx = useCallback(async (hash: `0x${string}`): Promise<boolean> => {
    if (!publicClient) return false
    const start = Date.now()
    while (Date.now() - start < 120000) {
      try {
        const r = await publicClient.getTransactionReceipt({ hash })
        if (r) return r.status === 'success'
      } catch { /* continue */ }
      await new Promise(r => setTimeout(r, 2000))
    }
    return false
  }, [publicClient])

  const contribute = useCallback(async (idoId: number, amount: string, isNative: boolean) => {
    if (!walletClient || !address || !publicClient) { setStatusMessage('❌ Connect wallet'); return { success: false } }
    setIsProcessing(true); setStatusMessage('📝 Confirm in wallet...')
    try {
      const amountWei = parseUnits(amount, 18)
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: LAUNCHPAD_ADDRESS, abi: LAUNCHPAD_ABI, functionName: 'contribute',
        args: [BigInt(idoId), amountWei], value: isNative ? amountWei : 0n,
        gas: 300_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Contributed!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, address, publicClient, waitForTx])

  const claimTokens = useCallback(async (idoId: number) => {
    if (!walletClient || !publicClient) { setStatusMessage('❌ Connect wallet'); return { success: false } }
    setIsProcessing(true); setStatusMessage('📝 Confirm in wallet...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: LAUNCHPAD_ADDRESS, abi: LAUNCHPAD_ABI, functionName: 'claimTokens',
        args: [BigInt(idoId)], gas: 200_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Claimed!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, publicClient, waitForTx])

  const reset = useCallback(() => { setStatusMessage(''); setTxHash(null); setIsProcessing(false) }, [])

  return { contribute, claimTokens, reset, isProcessing, statusMessage, txHash }
}

export function parseIDOData(raw: readonly unknown[], id: number): IDOData {
  const d = raw as [Address, string, string, string, Address, boolean, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, Address, boolean, boolean, boolean]
  return {
    id, idoToken: d[0], name: d[1], description: d[2], imageUrl: d[3], paymentToken: d[4], isNativePayment: d[5],
    tokenPrice: formatUnits(d[6], 18), tokensForSale: formatUnits(d[7], 18), tokensSold: formatUnits(d[8], 18),
    softCap: formatUnits(d[9], 18), hardCap: formatUnits(d[10], 18), minContribution: formatUnits(d[11], 18),
    maxContribution: formatUnits(d[12], 18), startTime: Number(d[13]), endTime: Number(d[14]),
    totalRaised: formatUnits(d[15], 18), totalContributors: Number(d[16]), creator: d[17],
    isActive: d[18], isFinalized: d[19], isWhitelisted: d[20]
  }
}
