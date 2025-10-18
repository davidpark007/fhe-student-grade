import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

const subjects = [
  { id: 0, name: 'Language', icon: '📚' },
  { id: 1, name: 'Mathematics', icon: '🔢' },
  { id: 2, name: 'Science', icon: '🔬' },
  { id: 3, name: 'History', icon: '📜' },
  { id: 4, name: 'Physical', icon: '⚽' },
];

export function TeacherSetGrades() {
  const { address } = useAccount();
  const { instance, isLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState<number>(1);
  const [value, setValue] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!instance) {
      setMessage({ type: 'info', text: 'Initializing encryption...' });
      return;
    }
    if (!student || !/^0x[a-fA-F0-9]{40}$/.test(student)) {
      setMessage({ type: 'error', text: 'Invalid student address' });
      return;
    }
    const num = parseInt(value);
    if (!Number.isInteger(num) || num < 0 || num > 100) {
      setMessage({ type: 'error', text: 'Grade must be an integer between 0 and 100' });
      return;
    }

    try {
      setSubmitting(true);
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(num);
      const encrypted = await input.encrypt();

      const signer = await signerPromise;
      if (!signer) {
        setMessage({ type: 'error', text: 'Wallet not connected' });
        setSubmitting(false);
        return;
      }
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.setGrade(student, subject, encrypted.handles[0], encrypted.inputProof);
      await tx.wait();
      setMessage({ type: 'success', text: '✅ Grade set successfully!' });
      setValue('');
      setStudent('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Failed to set grade' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Set Student Grade</h2>
      <p>Only contract owner can set grades. All grades are encrypted on-chain.</p>

      <form onSubmit={onSubmit} className="form-container">
        <div className="form-group">
          <label className="form-label">Student Wallet Address</label>
          <input
            className="form-input"
            placeholder="0x..."
            value={student}
            onChange={e => setStudent(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject</label>
          <select
            className="form-select"
            value={subject}
            onChange={e => setSubject(parseInt(e.target.value))}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Grade (0-100)</label>
          <input
            type="number"
            className="form-input"
            placeholder="Enter grade (e.g., 95)"
            value={value}
            onChange={e => setValue(e.target.value)}
            min="0"
            max="100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || isLoading}
          className="btn btn-primary"
        >
          {submitting ? (
            <>
              <span className="spinner"></span>
              Encrypting & Submitting...
            </>
          ) : (
            '🔒 Encrypt & Set Grade'
          )}
        </button>
      </form>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

