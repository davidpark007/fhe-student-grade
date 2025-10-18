import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

const subjects = [
  { id: 0, name: 'Language' },
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'History' },
  { id: 4, name: 'Physical' },
];

export function MyGrades() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [selected, setSelected] = useState(1);
  const [grade, setGrade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  
  const { data: handle } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEncryptedGrade',
    args: address ? [address, selected] : undefined,
    query: { enabled: !!address },
  });

  const decrypt = async () => {
    setGrade(null);
    if (!instance || !address || !handle) return;
    setBusy(true);
    try {
      const signer = await signerPromise;
      if (!signer) throw new Error('Wallet not connected');

      const keypair = instance.generateKeypair();
      const start = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(keypair.publicKey, [CONTRACT_ADDRESS], start, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );
      const res = await instance.userDecrypt([
        { handle, contractAddress: CONTRACT_ADDRESS },
      ], keypair.privateKey, keypair.publicKey, signature.replace('0x',''), [CONTRACT_ADDRESS], address, start, durationDays);
      const v = res[handle as string];
      setGrade(String(v));
    } catch (e: any) {
      setGrade(`Failed: ${e?.message || 'error'}`);
    } finally {
      setBusy(false);
    }
  };

  if (!address) return <p>Please connect your wallet.</p>;

  return (
    <div>
      <h2>My Grades</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span>Subject:</span>
        <select value={selected} onChange={e => setSelected(parseInt(e.target.value))} style={selectStyle}>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={decrypt} disabled={busy || !handle} style={buttonStyle}>{busy ? 'Decrypting...' : 'Decrypt'}</button>
      </div>
      <div>
        <p>Encrypted handle: <code>{handle ? String(handle).slice(0, 34) + '...' : 'N/A'}</code></p>
        {grade && <p>Decrypted grade: <strong>{grade}</strong></p>}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1' };
const buttonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid #2563EB', background: '#2563EB', color: '#fff', cursor: 'pointer' };

