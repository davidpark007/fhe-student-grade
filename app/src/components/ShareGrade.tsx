import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

const subjects = [
  { id: 0, name: 'Language' },
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'History' },
  { id: 4, name: 'Physical' },
];

export function ShareGrade() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [subject, setSubject] = useState(1);
  const [viewer, setViewer] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const onShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!address) { setMsg('Connect wallet'); return; }
    if (!/^0x[a-fA-F0-9]{40}$/.test(viewer)) { setMsg('Invalid viewer address'); return; }
    try {
      setBusy(true);
      const signer = await signerPromise;
      if (!signer) { setMsg('Wallet not connected'); setBusy(false); return; }
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.allowViewer(subject, viewer);
      await tx.wait();
      setMsg('Viewer allowed for this subject');
    } catch (e: any) {
      setMsg(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Share My Grade</h2>
      <form onSubmit={onShare} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <select value={subject} onChange={e => setSubject(parseInt(e.target.value))} style={inputStyle}>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input placeholder="Viewer address (0x...)" value={viewer} onChange={e => setViewer(e.target.value)} style={inputStyle} />
        <button disabled={busy} style={buttonStyle}>{busy ? 'Sharing...' : 'Allow Viewer'}</button>
      </form>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1' };
const buttonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid #2563EB', background: '#2563EB', color: '#fff', cursor: 'pointer', width: 'fit-content' };

