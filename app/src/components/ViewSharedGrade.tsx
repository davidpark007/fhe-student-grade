import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

const subjects = [
  { id: 0, name: 'Language' },
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'History' },
  { id: 4, name: 'Physical' },
];

export function ViewSharedGrade() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState(1);
  const [grade, setGrade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: handle, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEncryptedGrade',
    args: student && /^0x[a-fA-F0-9]{40}$/.test(student) ? [student, subject] : undefined,
    query: { enabled: false },
  });

  const onView = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrade(null);
    if (!instance || !address) return;
    setBusy(true);
    try {
      const { data } = await refetch();
      if (!data) throw new Error('No grade found');
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
        { handle: data, contractAddress: CONTRACT_ADDRESS },
      ], keypair.privateKey, keypair.publicKey, signature.replace('0x',''), [CONTRACT_ADDRESS], address, start, durationDays);
      const v = res[data as string];
      setGrade(String(v));
    } catch (e: any) {
      setGrade(`Failed: ${e?.message || 'error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>View Shared Grade</h2>
      <form onSubmit={onView} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <input placeholder="Student address (0x...)" value={student} onChange={e => setStudent(e.target.value)} style={inputStyle} />
        <select value={subject} onChange={e => setSubject(parseInt(e.target.value))} style={inputStyle}>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button disabled={busy} style={buttonStyle}>{busy ? 'Fetching...' : 'View Grade'}</button>
      </form>
      {handle && <p style={{ marginTop: 8 }}>Encrypted handle: <code>{String(handle).slice(0, 34)}...</code></p>}
      {grade && <p>Decrypted grade: <strong>{grade}</strong></p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1' };
const buttonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid #2563EB', background: '#2563EB', color: '#fff', cursor: 'pointer', width: 'fit-content' };

