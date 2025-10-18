import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
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

export function TeacherSetGrades() {
  const { address } = useAccount();
  const { instance, isLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState<number>(1);
  const [value, setValue] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!instance) { setMessage('Initializing encryption...'); return; }
    if (!student || !/^0x[a-fA-F0-9]{40}$/.test(student)) { setMessage('Invalid student address'); return; }
    const num = parseInt(value);
    if (!Number.isInteger(num)) { setMessage('Grade must be an integer'); return; }

    try {
      setSubmitting(true);
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(num);
      const encrypted = await input.encrypt();

      const signer = await signerPromise;
      if (!signer) { setMessage('Wallet not connected'); setSubmitting(false); return; }
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.setGrade(student, subject, encrypted.handles[0], encrypted.inputProof);
      await tx.wait();
      setMessage('Grade set successfully');
    } catch (e: any) {
      setMessage(e?.message || 'Failed to set grade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Teacher: Set Student Grade</h2>
      <p style={{ color: '#64748B' }}>Only contract owner can set grades.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <input placeholder="Student address (0x...)" value={student} onChange={e => setStudent(e.target.value)} style={inputStyle} />
        <select value={subject} onChange={e => setSubject(parseInt(e.target.value))} style={inputStyle}>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" placeholder="Grade (e.g., 95)" value={value} onChange={e => setValue(e.target.value)} style={inputStyle} />
        <button disabled={submitting || isLoading} style={buttonStyle}>{submitting ? 'Submitting...' : 'Set Grade'}</button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1' };
const buttonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid #2563EB', background: '#2563EB', color: '#fff', cursor: 'pointer', width: 'fit-content' };

